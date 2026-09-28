# Phase 3: Cluster-Aware Sorting

[← Overview](README.md)

## Goal

When a user first encounters a room, show them the statements that best reveal which cluster they're in. That places them quickly and makes the minimap meaningful early.

Today every user gets the same deterministic pseudo-shuffle (a hash of the statement ID), with a linked statement pinned first.

## The cluster snapshot (introduced here, reused by Phase 4)

Loaded once with the deck:

```
clusterSnapshot: {
  version,
  clusters: [{ stableId, name, color, size, anchorSlot }],
  voteProbabilities: { [stableId]: [P(agree), P(disagree), P(pass)] per statement }
}
```

- Small (k × statements × 3 numbers). No user IDs, no individual votes.
- Laplace-smoothed. Super-agree counts as agree.

**Client-side cluster estimate** (shared with Phase 4):
- Naive Bayes. The prior is cluster sizes. The likelihood is the product of `P(vote | cluster)` over the statements the user has voted on.
- Unvoted statements simply don't contribute, which fixes the "mostly-zeros vector" problem.
- The likelihood is damped (log-likelihood × ~0.5), so 2–3 votes can't produce certainty.
- This supersedes the masked-distance-to-centroid idea from the first brainstorm.

## 3a: Static order (server)

1. A linked statement (the target statement) stays first.
2. The next ~6 cards are the statements with the highest **mutual information** between vote and cluster: how much a vote on the statement tells us about someone's cluster. Only statements with ≥ 5 votes in every cluster are scored.
3. **Consensus slot:** the 3rd lead card is a **cross-cluster consensus** statement, one that every cluster agrees with.
   - It breaks up the run of divisive cards with a moment of common ground, early enough to shape the first impression.
   - Using the 3rd slot means the user has already given two votes that help place them.
   - Scored by the product of each cluster's (smoothed) agree rate. This favours statements every group agrees with, not ones that are merely popular overall.
   - Eligible only when every cluster agrees ≥ ~60% and has ≥ 5 votes on it. If nothing qualifies, the slot goes back to the divisive ranking.
4. **Exploration:** every 4th lead slot goes to an under-voted statement. Otherwise new statements never get votes and the divisive set freezes.
5. The rest of the deck keeps today's order.
6. If the room has no clusters yet (or only 1), the whole deck uses today's order.

**Freshness on deck load:**
- Flyer rooms may never have had their analysis viewed, so they may have no clusters.
- On deck load, recompute in the background if votes have grown ≥ 10% since the last recompute and it's been at least ~5 min.
- Serve the previous snapshot meanwhile.

The new ordering applies only to the swipe deck. The shared "get statements" path stays unchanged, because clustering, analysis and emails also use it.

## 3b: Adaptive order (client, optional, can ship with Phase 4)

- After each vote, update the estimate and pull forward the statement with the highest **expected information gain**. That's the expected drop in uncertainty about the user's cluster: `H(posterior) − E_vote[H(posterior | vote)]`. With k ≤ 3 and 3 outcomes this is cheap.
- Only cards at stack position ≥ 2 are reordered. The top two are already rendered and may be mid-animation.
- The consensus card stays at its position. Adaptive picking never pushes it out.
- Adapting stops once the top cluster is ≥ 0.85 likely, or after 8 votes. After that, the rest of the deck uses the static order, so users don't see only divisive content.

## Tradeoffs

- **Divisive-first:** good for placement and engagement, but a room's first impression would become its most contested statements. The consensus slot softens this, at the cost of one card that tells us almost nothing about the user's cluster. Watch completion rate to see whether one consensus card is enough.
- **Author fairness:** divisive statements collect even more votes. The exploration slots soften this.

## Deploy

- Behind a frontend feature flag.
- Watch the votes-per-session chart (see Tracking) for the first couple of weeks.

## Tracking

In the feature results tracker: a chart of average votes per session per week.

---

## Footnotes: code pointers

- Current order: `getStatementsForRoom` in `src/supabase/functions/server/kv-utils.tsx` (the `hashId` sort). **Leave it unchanged.** Apply the new order in `getStatements` in `debate-api.tsx` and in the flyer deck payload.
- New pure server module `statement-ordering.ts`: `orderStatementsForVoting(statements, snapshot, targetStatementId)`.
- Consensus score: don't reuse `getWeightedConsensusScore` in `statement-utils.tsx` or the pairwise `bridgeScore` in `src/utils/bridging-utils.ts`. The first is room-wide and the second compares only two clusters at a time. Compute the product of per-cluster agree rates from the snapshot's `voteProbabilities`.
- New `buildClusterSnapshot(roomId)`, built from the Phase 1 identity record plus `Statement.voters`.
- Throttle: mirror the `totalVotes` comparison in `analysis-api.tsx`; run the recompute through `EdgeRuntime.waitUntil`.
- New client module `src/utils/cluster-estimation.ts`: `estimateClusterPosterior`, `pickNextStatements`.
- 3b wiring: `unvotedStatements` in `src/components/room/SwipeableStatementStack.tsx` (it already pins `targetStatementId` there).
- Feature flag: `src/utils/constants/feature-flags.ts`.
