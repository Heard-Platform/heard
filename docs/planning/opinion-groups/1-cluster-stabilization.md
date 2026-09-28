# Phase 1: Cluster Stabilization

[← Overview](README.md)

## Problem

Cluster numbers change on every recompute:
- k-means starts from random points.
- `calculateClusterConsensus` renumbers clusters by size.

So "cluster 0" today and "cluster 0" after the next recompute can be different groups. A name or colour attached to an index would end up on the wrong group, and the minimap would shuffle.

## Approach

- After each recompute, match new clusters to the previous ones by **member Jaccard overlap**. With k ≤ 3 there are at most 6 possible pairings, so we just try them all and keep the one with the highest total overlap.
- Each cluster gets a persistent `stableId`. It's stored in a new identity record in KV, alongside the cluster's name, colour, map anchor slot, a snapshot of its members and the naming signature Phase 2 needs.
- A match with overlap ≥ ~0.4 inherits the previous `stableId`, name, colour and slot.
- A new cluster without a qualifying match gets a new `stableId`, the next free slot (largest new cluster first). Having no name yet is what marks it for naming in Phase 2.
- Previous clusters that went unmatched are dropped.
- The identity record carries a `version` that increments on every recompute. Clients use it to tell whether their data is stale.
- **Why members rather than centroids:** centroids gain new dimensions whenever statements are added, so centroids from different recomputes aren't comparable. Member overlap has no such problem.
- The analysis report, the pie-chart columns and (later) the minimap all key on `stableId` instead of the array index.

## Deploy

- Backwards compatible, no flag. The first recompute after deploy gives every cluster a fresh `stableId`.
- Verify by running regenerate-clusters twice on a busy room and confirming the IDs hold.
- Log overlap values for about a week to tune the 0.4 threshold before Phase 2 relies on it.

## Tests

- Identical members → same IDs.
- Permuted index order → same IDs.
- A cluster splits → one side inherits the ID, the other is new.
- k drops from 3 to 2 → one identity is dropped.
- Overlap below the threshold → a new identity.

## Tracking

In the feature results tracker: a chart of cluster recomputes per week, to confirm clustering isn't running too often. Plus a stat showing the % of clusters that kept their ID after a recompute.

---

## Footnotes: code pointers

- Clustering: `src/supabase/functions/server/clustering.tsx`. Hook the matching in at the end of `clusterUsersAndSave`. Existing KV keys: `cluster:${roomId}:metadata` and `cluster_assignment:${roomId}:${userId}`.
- Matching lives in the pure module `cluster-identity.ts`. Identity record at `cluster:${roomId}:identity`: `{ version, timestamp, clusters: [{ stableId, clusterIndex, slot, memberIds }] }`. A single `slot` drives both colour (frontend palette) and, later, the minimap anchor. Phase 2 adds the naming fields. It is saved in the same `mset` as the metadata and assignments.
- `calculateClusterConsensus` in `cluster-analysis.tsx` takes the identities and adds `stableId` + `slot` to `Cluster` and `ClusterVoteBreakdown`. Column order stays by size; colour and letter come from `slot`. `currentUserClusterId` is unchanged (it is only compared within one response).
- Index-keyed UI to migrate: `src/components/analysis/ClusterConsensusBox.tsx`, `StatementVotesTable*.tsx`, `BridgeStatementsSection.tsx`, `src/utils/colors.ts`, `src/utils/bridging-utils.ts`.
- Verification endpoint: `/room/:roomId/regenerate-clusters` in `analysis-api.tsx`.
- Tests: extend `clustering.test.tsx`; add `cluster-identity.test.ts`.
- Legacy rooms (metadata but no identity record) are recomputed on the next analysis view (`analysis-api.tsx`).
- Tracking: `clusterUsersAndSave` logs `cluster_recompute` plus one `cluster_identity_kept` / `cluster_identity_new` event per cluster via `insertAnalyticsEvent` (`model-utils.ts`), because `user_events` has no metadata column. Kept % = kept ÷ (kept + new). Aggregate it in `/stats/features` (`features-results-tracker-api.ts`, read with `getEventsOfType`). Add an entry to `src/components/devtools/FeatureResultsTracker.tsx`, with a weekly chart in `devtools/feature-tracker/` (see `CertifyCardConversionChart` for the pattern).
