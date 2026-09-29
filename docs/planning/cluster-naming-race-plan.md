# Cluster Naming Race Condition Plan

Deferred. Not scheduled; pick up when it shows up in practice or before scaling recompute frequency further.

## Problem

Background cluster naming reads a room's identity record, calls the LLM, then re-reads the record, checks its `version` is unchanged, and saves names onto it. If a recompute saves a new identity record in the tiny window between that check and the save, naming overwrites the fresh record with the older one.

After that, the identity record no longer matches the cluster metadata and assignments from the latest recompute:

- **If the number of clusters changed**, the analysis endpoint throws (`calculateClusterConsensus` finds no identity for a cluster index) until the room's next recompute.
- **Otherwise**, names, colours and slots can attach to the wrong clusters until the next recompute. There's no error.

The window is milliseconds, but more frequent recomputes (Phase 2b) make a collision more likely.

## Options

1. **Store names separately from the identity record.** Naming writes to its own key (e.g. `cluster:${roomId}:names`, keyed by `stableId`) and never writes the identity record. Recomputes are then the only writer of the identity record, so the race disappears. Names still follow clusters across recomputes because `stableId` is preserved. This is the cleanest fix; it's a moderate refactor of Phase 2.
2. **Conditional save.** Only write if the stored version still matches. This isn't possible with the current KV store, since values are JSON strings and can't be filtered on `version`; it would need a dedicated column or table.
3. **Detect and repair on read.** Every recompute stamps the metadata and identity record with the same timestamp. The analysis endpoint can compare them and rebuild (or error loudly) on a mismatch. This mitigates the problem but doesn't remove it.

## Recommendation

Option 1, when this is picked up.

## Code pointers

- Naming save: end of `nameClustersForRoom` in `src/supabase/functions/server/cluster-naming.ts`.
- Identity record write during recompute: `clusterUsersAndSave` in `src/supabase/functions/server/clustering.tsx`.
- Where the mismatch surfaces: `calculateClusterConsensus` in `cluster-analysis.tsx`, called from `analysis-api.tsx`.
