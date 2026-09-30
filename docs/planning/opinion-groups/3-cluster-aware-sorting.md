# Phase 3: Cluster-Aware Sorting

[← Overview](README.md)

## Goal

When a user swipes through the flyer flow, show them the statements that best reveal which cluster they're in. That places them within the flow's 6 cards and makes the minimap meaningful early.

**Flyer flow only.** This first shipped in the feed's swipe stack too. It was taken back out in Phase 5 to keep the blast radius small, so the feed uses today's order.

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
3. The rest of the deck keeps today's order. A linked statement still goes first.

Example with 3 clusters: A1, B1, consensus, C1, A2, B2, C2.

(Exploration cards, every 4th card for statements with under 5 votes, were in the first version. They were removed in Phase 5: pull-forward always ranks a better placement card ahead of them, so they rarely surfaced.)

## 3b: Adaptive order

- **Estimate:** a probability for each cluster, starting from cluster sizes and adjusted by how closely each of the user's votes matches that cluster's voting rates. Each vote's influence is halved so a few votes can't produce certainty, and statements the user hasn't voted on don't count.
- **After each vote**, pull forward the card expected to reduce the uncertainty about the user's cluster the most.
- The **2 readable cards** (current, and the one behind it that shows while dragging) are never reordered. See [Phase 5](5-flyer-integration.md).
- **Consensus card is locked to its slot:** 3rd card overall (flyer card, one lead card, consensus). A cleanup step at the end of each reorder (`placeConsensus`) puts it exactly at its slot, which moves up by one with each swipe. The flyer flow loads the deck order before its first render, so this never touches a card on screen.
- **Stops** once the top cluster is ≥ 85% likely, or after 8 votes.
- **Stability:** the order is remembered between renders.

## Tradeoffs

- **Divisive-first:** good for placement and engagement, but a room's first impression becomes its most contested statements. The consensus card softens this, at the cost of one card that tells us almost nothing about the user's cluster.
- **Author fairness:** divisive statements collect even more votes, and new statements wait until the user is placed.

## Deploy

- Ships with the flyer flow, behind its `FLYER_SWIPE` flag. Rooms without a deck order (fewer than 2 clusters, or nothing distinguishing them) keep today's order.

## Blast radius

**Small.** It only orders the flyer flow's cards. The feed's swipe stack is unchanged.

Areas impacted:
- Flyer flow - Card order after the flyer card.
- Server - A new per-room endpoint, called once per flyer scan; it computes distinguishing statements for each cluster on request.
- Cluster naming - Common-ground logic moved into a shared module; behaviour unchanged.
- Engagement - Could drop if the new order is too divisive or repetitive.

## Tracking

In the feature results tracker: a chart of average votes per voting session per week (a user's votes with no gap over 15 minutes), for the last 12 weeks.

---

## Footnotes: code pointers

- Server ordering (pure): `src/supabase/functions/server/statement-ordering.ts`. `interleaveDistinguishingStatements` (with `interleaveUnique`), `calcVoteRates`, `assembleCards`, `buildDeckOrder`.
- Shared stance helpers: `cluster-stance-utils.ts` (`VotedStatement`, `calcAgreeRate`, `rankCommonGround`), used by naming and ordering.
- Endpoint: `GET /room/:roomId/deck-order` in `deck-order-api.ts`. Visible statements come from `getStatements` minus merge sources, as in the room fetch.
- Current order: `orderStatements` in `voting-utils.ts`, applied by `getStatements` in `debate-api.tsx`. Unchanged.
- Client estimation (pure, reused by Phase 4): `src/utils/cluster-estimation.ts` (`estimateClusterProbabilities`, `calcVoteInfoValue`, `isStillPlacing`).
- Client ordering (pure): `src/utils/deck-ordering.ts` (`putFirst`, `pullForwardMostInformative`, `placeConsensus`, `nextDeckOrder`).
- Hook: `useOrderedStatements` (order state between renders), used by `FlyerSwipeContainer`, which fetches the deck order itself alongside the statements.
- Tracking: `averageVotesPerSessionByWeek` in `feature-tracker-utils.ts`, built from `getAllVotes`; chart in `devtools/feature-tracker/VotesPerSessionChart.tsx`.
