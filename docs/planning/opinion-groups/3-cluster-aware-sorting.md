# Phase 3: Cluster-Aware Sorting

[← Overview](README.md)

## Goal

When a user first encounters a room, show them the statements that best reveal which cluster they're in. That places them quickly and makes the minimap meaningful early.

Today every user gets the same order: statements with the most opinionated votes first, with a fixed hash order as the tiebreak, and a linked statement pinned first.

Clusters are kept current by [Phase 2b](2b-cluster-freshness.md), so this phase assumes they exist and are reasonably fresh.

## The deck order

A separate endpoint that each viewer calls **once per room** returns the room's "deck order". It's kept off the room fetch, which is polled every 3 seconds. It's computed on request from the identity record and current votes, so nothing extra is stored and nothing goes stale.

- **Lead order:** the opening cards (3a).
- **Consensus statement:** so 3b can keep it in place.
- **Per cluster:** size, and Laplace-smoothed agree / disagree / pass rates for every statement. No user IDs, no individual votes.

The deck order is `null` for rooms with fewer than 2 clusters or with nothing that distinguishes them. The stack then keeps today's order.

## 3a: Opening cards

1. **Round-robin through the clusters**, largest first, taking each cluster's next distinguishing statement (either direction) until 6 are picked. If a cluster's next statement was already picked for another cluster, that cluster waits until the next round. This guarantees every cluster is represented early, and reuses the same statements naming is based on.
2. **Consensus card third:** the statement every cluster agrees with most (each ≥ 60% agree with ≥ 3 opinionated votes), reusing naming's common-ground logic. It's skipped if nothing qualifies.
3. **Exploration every 4th card:** the statements with the fewest votes (under 5), so new statements still collect votes.
4. The rest of the deck keeps today's order. A linked statement still goes first.

Example with 3 clusters: A1, B1, consensus, exploration, C1, A2, B2, exploration, C2.

**Short statements first.** Statements over 90 characters are kept out of the first 6 cards so new users start with easy ones. The server prefers short statements for every opening pick (distinguishing, consensus, exploration), the browser's adaptive picks skip long ones until card 7, and a final pass moves any long statement out of the first 6. Long statements are only used there when there aren't enough short ones. The server sends the long statement IDs in the deck order so the 90-character rule lives in one place.

## 3b: Adaptive order

- **Estimate:** a probability for each cluster, starting from cluster sizes and adjusted by how closely each of the user's votes matches that cluster's voting rates. Each vote's influence is halved so a few votes can't produce certainty, and statements the user hasn't voted on don't count.
- **After each vote**, pull forward the card expected to reduce the uncertainty about the user's cluster the most.
- The **top 3 cards** (the ones the stack renders) are never reordered, and the **consensus card stays in place**.
- **Stops** once the top cluster is ≥ 85% likely, or after 8 votes.
- **Stability:** the order is remembered between renders. Polls that reshuffle the incoming statements don't move cards; new statements are appended. If the deck order arrives after the first render, the cards already on screen stay put.

## Tradeoffs

- **Divisive-first:** good for placement and engagement, but a room's first impression becomes its most contested statements. The consensus card softens this, at the cost of one card that tells us almost nothing about the user's cluster.
- **Author fairness:** divisive statements collect even more votes. The exploration slots soften this.

## Deploy

- No feature flag; it's on for every room. Rooms without a deck order (fewer than 2 clusters, or nothing distinguishing them) keep today's order.
- Watch the votes-per-session chart for the first couple of weeks after turning it on.

## Blast radius

**Medium.** It changes the order of the swipe deck, which is the core voting experience in every room.

Areas impacted:
- Swipe deck - Card order changes for every room with clusters; vote tracking in the stack now records vote types (replacing the set of voted IDs).
- Server - A new per-room endpoint, called once per viewer per room; it computes distinguishing statements for each cluster on request.
- Cluster naming - Common-ground logic moved into a shared module; behaviour unchanged.
- Engagement - Could drop if the new order is too divisive or repetitive.

## Tracking

In the feature results tracker: a chart of average votes per voting session per week (a user's votes with no gap over 15 minutes), for the last 12 weeks.

---

## Footnotes: code pointers

- Server ordering (pure): `src/supabase/functions/server/statement-ordering.ts`. `interleaveDistinguishingStatements` (with `interleaveUnique`), `calcVoteRates`, `rankExplorationStatements`, `assembleCards`, `buildDeckOrder`.
- Shared stance helpers: `cluster-stance-utils.ts` (`VotedStatement`, `calcAgreeRate`, `rankCommonGround`), used by naming and ordering.
- Endpoint: `GET /room/:roomId/deck-order` in `deck-order-api.ts`. Visible statements come from `getStatements` minus merge sources, as in the room fetch.
- Current order: `orderStatements` in `voting-utils.ts`, applied by `getStatements` in `debate-api.tsx`. Unchanged.
- Client estimation (pure, reused by Phase 4): `src/utils/cluster-estimation.ts` (`estimateClusterProbabilities`, `calcVoteInfoValue`, `isStillPlacing`).
- Client ordering (pure): `src/utils/deck-ordering.ts` (`putFirst`, `pullForwardMostInformative`, `nextDeckOrder`).
- Hooks: `useDeckOrder` (fetch once per room) and `useOrderedStatements` (order state between renders), used in `SwipeableStatementStack.tsx`.
- Tracking: `averageVotesPerSessionByWeek` in `feature-tracker-utils.ts`, built from `getAllVotes`; chart in `devtools/feature-tracker/VotesPerSessionChart.tsx`.
