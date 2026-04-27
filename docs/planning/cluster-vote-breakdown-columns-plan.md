# Cluster Vote Breakdown Columns Plan

## Overview

Add a Polis-style breakdown of agree / disagree / pass / didn't-vote percentages to the **All Statements** table on the analysis report ([StatementVotesTable.tsx](src/components/analysis/StatementVotesTable.tsx)). Today the table shows raw counts only (Agree, Super Agree, Disagree, Pass, Total). We are adding a second group of columns to its right: one **Overall** column plus one column per opinion cluster, each rendering a stacked-bar visualization of how that subpopulation voted on the statement.

The intent is parity with Polis's "vote breakdown by group" matrix: a quick visual scan tells you where each cluster stands on every statement, not just the top 3 surfaced in `ClusterConsensusBox`.

---

## What the user sees

For each statement row, to the right of the existing raw-count columns, a horizontal cell appears for each subpopulation. Inside each cell:

- A stacked bar with four segments, scaled to the subpopulation size:
  - **Agree** (green) — `agreeVotes / size`
  - **Disagree** (red) — `disagreeVotes / size`
  - **Pass** (gray) — `passVotes / size`
  - **Didn't vote** (empty / very light) — `(size - votes) / size`
- A label below the bar: `agree% disagree% pass% (n)`, where `n` is the count of subpopulation members who voted on this statement (i.e. `size - didn'tVote`). Percentages are out of `size`, so they sum to ≤ 100% with the remainder being "didn't vote" (matching Polis's convention).

Column headers are: `OVERALL N`, `A N₁`, `B N₂`, ... where `N` is total participants and `Nᵢ` is cluster size. Letters are assigned by index in `clusterConsensus.clusters`, which is already sorted by size descending — so `A` is always the largest cluster.

The number of cluster columns is `clusterConsensus.totalClusters` and varies room-to-room. If `clusterConsensus` is null/empty, only the **Overall** column is rendered.

---

## Assumptions

- Cluster ordering and labels follow `clusterConsensus.clusters` (size-desc, ids reassigned 0..N-1). Letter labels (A=0, B=1, ...) are assigned at render time. This matches how `ClusterConsensusBox` numbers clusters in [DebateAnalysisReport.tsx:142](src/components/analysis/DebateAnalysisReport.tsx#L142).
- The "Overall" denominator is `metrics.totalParticipants` (everyone who participated in any way — already on `AnalysisMetrics`). This may differ slightly from `sum(clusterSizes)` if some participants did not vote on enough statements to be assigned to a cluster, but is the more meaningful "could have voted" denominator.
- Sorting on the existing five raw-count columns is unchanged. The new columns are **not sortable** in this first pass — sort semantics for a 4-segment stacked value aren't well-defined (sort by agree%? by consensus?), and the existing sort already covers the most useful orderings. We can revisit if users ask.
- Hidden statements remain excluded — `applyStatementMerges` and the `getStatementsForRoom` filter already handle that upstream; nothing new is needed here.

---

## Data Model

The server currently computes per-cluster vote totals only for the **top 3** statements per cluster, inside `calculateClusterConsensus` in [cluster-analysis.tsx:84-133](src/supabase/functions/server/cluster-analysis.tsx#L84-L133). Those `ClusterConsensusStatement` records also lack `passVotes`. To populate the new columns we need:

1. **All statements** (not just top 3) broken down by cluster.
2. **`passVotes`** alongside agree/disagree counts.
3. **Cluster sizes** carried through to the frontend (currently they live on each `Cluster` but not on the wire-level `clusterConsensus` summary in a form the table can read directly).

### New shared type — `ClusterVoteBreakdown`

Add to both [src/supabase/functions/server/cluster-analysis.tsx](src/supabase/functions/server/cluster-analysis.tsx) and [src/types/index.ts](src/types/index.ts):

```ts
export interface ClusterVoteBreakdown {
  clusterId: number;        // 0..N-1, matches Cluster.id ordering (size desc)
  clusterSize: number;      // denominator for percentages
  agreeVotes: number;       // includes super-agrees, mirroring ClusterStatement
  disagreeVotes: number;
  passVotes: number;
  // didn'tVote = clusterSize - (agree + disagree + pass)  -- derived on the client
}
```

### Extension to `StatementVotes`

Add an optional field to `StatementVotes` in both [server analysis-utils.tsx:5-16](src/supabase/functions/server/analysis-utils.tsx#L5-L16) and [frontend types/index.ts:259-270](src/types/index.ts#L259-L270):

```ts
export interface StatementVotes {
  // ... existing fields
  clusterVotes?: ClusterVoteBreakdown[];   // one entry per cluster, in cluster-id order
}
```

Optional because pre-cluster (or zero-cluster) rooms won't have it. The Overall column is computed from the existing `agreeVotes`, `disagreeVotes`, `passVotes` and a top-level `totalParticipants` — no new per-row field needed for that.

### No change to `ClusterStatement`

The existing `ClusterStatement` shape used by `ClusterConsensusBox` (top 3 per cluster) stays as-is. We do not retrofit `passVotes` there because the consensus box doesn't display it and we don't want to widen that surface unnecessarily.

---

## Server-Side Computation

### Refactor in `cluster-analysis.tsx`

Today `calcBestClusterStatements` produces only the four fields used by the consensus box. Two changes:

1. Extract a smaller helper that, for a single statement and a list of users-in-cluster, returns the full breakdown including `passVotes`. Use it from both call sites.
2. Add a new exported function `calcStatementClusterBreakdowns(statements, clusterMetadata, assignments, participants)` that returns `Record<statementId, ClusterVoteBreakdown[]>`, one entry per statement, with the inner array in the same cluster-id order as `calculateClusterConsensus` produces (i.e. size-desc, reassigned 0..N-1).

To keep cluster ordering consistent between the consensus box and the new breakdowns, do the size-desc sort + id reassignment **once**, on a shared intermediate (e.g. a `usersByClusterSorted: string[][]` array). Both `calculateClusterConsensus` and `calcStatementClusterBreakdowns` consume that shared structure. Either:

- (a) Refactor `calculateClusterConsensus` to also return `statementBreakdowns: Record<string, ClusterVoteBreakdown[]>` as a sibling field, OR
- (b) Export a new function `buildSortedClusterUsers(...)` that both call.

Recommend (a) — single-pass, single-call from the API layer, no duplicated user-cluster bookkeeping.

The updated return type:

```ts
export interface ClusterConsensus {
  totalClusters: number;
  clusters: Cluster[];                                  // existing top-3 per cluster
  statementBreakdowns: Record<string, ClusterVoteBreakdown[]>;  // NEW: per-statement, per-cluster
}
```

### Wire-up in `analysis-api.tsx`

After computing `clusterConsensus` at [analysis-api.tsx:88-94](src/supabase/functions/server/analysis-api.tsx#L88-L94), enrich `metrics.allStatements`:

```ts
const allStatementsWithClusters = metrics.allStatements.map(s => ({
  ...s,
  clusterVotes: clusterConsensus?.statementBreakdowns[s.id] ?? undefined,
}));
```

and replace `...metrics` in the `analysisData` with the enriched version. No new endpoints, no new KV reads — this all happens in the existing `/room/:roomId/analysis` request path.

---

## Frontend Changes

### `StatementVotesTable.tsx`

Three pieces of new prop / column work:

1. **New prop:** `totalParticipants: number` (passed down from `DebateAnalysisReport`). Used as the denominator for the Overall column.
2. **New prop:** `clusterSizes: number[]` (length = number of clusters, in cluster-id order). Drives column headers and is the denominator for each cluster column. Empty array if no clusters.
3. **New columns:** rendered after the existing five raw-count columns. Header layout:
   - `OVERALL {totalParticipants}`
   - `A {clusterSizes[0]}`, `B {clusterSizes[1]}`, ... up to the number of clusters present.

Each new cell is rendered by a small subcomponent `<VoteBreakdownCell agree={...} disagree={...} pass={...} size={...} />` that draws the stacked bar plus the label. Same component used for both Overall and per-cluster cells.

### `VoteBreakdownCell` — new component

Co-locate inside `StatementVotesTable.tsx` (it's small and not reused elsewhere yet). Roughly:

```tsx
function VoteBreakdownCell({ agree, disagree, pass, size }: Props) {
  const agreePct = size ? (agree / size) * 100 : 0;
  const disagreePct = size ? (disagree / size) * 100 : 0;
  const passPct = size ? (pass / size) * 100 : 0;
  const voted = agree + disagree + pass;
  return (
    <div className="space-y-1">
      <div className="flex h-2 rounded overflow-hidden bg-muted">
        <div className="agree-bg" style={{ width: `${agreePct}%` }} />
        <div className="disagree-bg" style={{ width: `${disagreePct}%` }} />
        <div className="pass-bg" style={{ width: `${passPct}%` }} />
        {/* remainder is "didn't vote" — implicit empty space */}
      </div>
      <div className="text-xs tabular-nums">
        <span className="agree-text">{Math.round(agreePct)}%</span>{" "}
        <span className="disagree-text">{Math.round(disagreePct)}%</span>{" "}
        <span className="pass-text">{Math.round(passPct)}%</span>{" "}
        <span className="text-muted-foreground">({voted})</span>
      </div>
    </div>
  );
}
```

Reuses the existing `agree-bg`, `disagree-bg`, `pass-bg`, `agree-text` (etc.) Tailwind classes already present in the table — no new color tokens.

### `DebateAnalysisReport.tsx`

Update [the `<StatementVotesTable />` call at line 168](src/components/analysis/DebateAnalysisReport.tsx#L168):

```tsx
<StatementVotesTable
  statements={allStatements}
  totalParticipants={totalParticipants}
  clusterSizes={clusterConsensus?.clusters.map(c => c.size) ?? []}
/>
```

`totalParticipants` is already in scope (destructured at line 25). `clusterConsensus` is already in scope (line 34).

---

## Edge Cases

1. **No cluster data** (`clusterConsensus` null or `totalClusters === 0`). Only the Overall column renders. The "No Cluster Data Available" warning at [DebateAnalysisReport.tsx:111-125](src/components/analysis/DebateAnalysisReport.tsx#L111-L125) is unchanged.
2. **Statement with zero votes** (e.g. brand new). `voted = 0`, all percentages 0%, label reads `0% 0% 0% (0)`, bar is fully empty. Renders fine.
3. **Cluster with size 0** (theoretically possible if all assigned users were filtered). Skip the column or render `0% 0% 0% (0)` — easier to just render and let it be empty. Will not happen in practice given current cluster-construction logic but should not crash.
4. **Many clusters** — table gets wide. Wrap in the existing `overflow-x-auto` (already in place at [StatementVotesTable.tsx:61](src/components/analysis/StatementVotesTable.tsx#L61)). Cells should be narrow (~120px) so 6+ columns still fits on a desktop screen.
5. **Merged statements.** `mergedFrom` is already accumulated by `applyStatementMerges` upstream. The cluster vote breakdown is computed from the merged statement's voter map, which already includes voters from sources. No special handling needed.
6. **`agree + disagree + pass > size`** (shouldn't happen — would mean a user voted twice). Defensively clamp `voted` to `size` and let CSS overflow rules handle bar widths summing to >100%. Worth a `console.warn` but not a hard error.

---

## Testing

- Update [src/stories/StatementVotesTable.story.tsx](src/stories/StatementVotesTable.story.tsx) mock data to include `clusterVotes` on each statement and pass `totalParticipants` + `clusterSizes` props. Add a second story variant `WithoutClusters` that omits cluster props to verify graceful degradation.
- Update [src/stories/DebateAnalysisReport.story.tsx](src/stories/DebateAnalysisReport.story.tsx) — its mock `allStatements` should include `clusterVotes` so the analysis-report screenshot matches what production renders.
- Add unit tests in [src/supabase/functions/server/cluster-analysis.test.tsx](src/supabase/functions/server/cluster-analysis.test.tsx):
  - `calculateClusterConsensus` returns `statementBreakdowns` with one entry per statement and one inner record per cluster.
  - Cluster ordering in `statementBreakdowns[id]` matches the cluster-id ordering in `clusters`.
  - `passVotes` are counted correctly per cluster.
  - Statements with zero cluster voters render `{ agreeVotes: 0, disagreeVotes: 0, passVotes: 0 }`.
- Manual QA on a real analysis page: visit `/analysis/:roomId` for a room with ≥2 clusters, confirm the new columns appear, the bars sum to roughly 100%, and the cluster sizes in headers match `ClusterConsensusBox`.

---

## Implementation Task Breakdown

Each step leaves the app in a working, mergeable state.

1. **Server: extend `cluster-analysis.tsx`.** Refactor the per-statement vote-counting into a small helper that produces full `{agree, disagree, pass, total}` breakdowns. Add `statementBreakdowns: Record<string, ClusterVoteBreakdown[]>` to the `ClusterConsensus` return type and populate it inside `calculateClusterConsensus`. Update existing tests; add new ones covering the breakdowns. *No frontend change yet — server emits more data, nothing reads it.*

2. **Types: propagate `ClusterVoteBreakdown` to the frontend.** Mirror the new type in [src/types/index.ts](src/types/index.ts). Add optional `clusterVotes` to the frontend `StatementVotes`. Add `statementBreakdowns` to the frontend `ClusterConsensus`. No runtime change.

3. **API: enrich `allStatements` with `clusterVotes` in `analysis-api.tsx`.** Map `clusterConsensus?.statementBreakdowns[s.id]` onto each `StatementVotes` before returning. Confirm via dev tools that the response payload now includes the new field.

4. **Frontend: render new columns in `StatementVotesTable.tsx`.** Add `totalParticipants` and `clusterSizes` props. Build the `VoteBreakdownCell` subcomponent. Render the Overall column always, and one column per cluster size. Update [DebateAnalysisReport.tsx](src/components/analysis/DebateAnalysisReport.tsx) to pass the new props. Update both Storybook story files. Verify on a staging room.

5. **Polish + manual QA.** Confirm column widths stay reasonable at the typical cluster count (1–5). Confirm "no clusters" rooms still render correctly. Sanity-check that cluster-letter ordering in the table matches the cluster numbering used in `ClusterConsensusBox` to avoid user confusion between the two surfaces.
