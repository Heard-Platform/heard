# Cluster Vote Breakdown Columns Plan

## Overview

Add a Polis-style breakdown of vote distribution to the **All Statements** table on the analysis report ([StatementVotesTable.tsx](src/components/analysis/StatementVotesTable.tsx)). Today the table shows raw counts only (Agree, Super Agree, Disagree, Pass, Total). We are adding a second group of columns to its right: one **Overall** column plus one column per opinion cluster, each rendering a small pie chart of how that subpopulation voted on the statement.

The intent is parity with Polis's "vote breakdown by group" matrix: a quick visual scan tells you where each cluster stands on every statement, not just the top 3 surfaced in `ClusterConsensusBox`.

The frontend has been built and is wired to mock data in Storybook. The remaining work is server-side computation of per-cluster breakdowns and plumbing them into the analysis API response.

---

## What the user sees

For each statement row, to the right of the existing raw-count columns, a cell appears for each subpopulation. Inside each cell:

- A **44px pie chart** with up to five slices, scaled to the subpopulation size. Slices render in a fixed order regardless of which categories have non-zero values, starting at 12 o'clock and unfolding clockwise:
  1. **Agree** (green-500) — `rawAgreeVotes / size`
  2. **Super agree** (purple-500) — `superAgreeVotes / size`
  3. **Disagree** (red-500) — `disagreeVotes / size`
  4. **Pass** (amber-500) — `passVotes / size`
  5. **Didn't vote** (gray-200) — `(size - voted) / size`
- **Hover/tap tooltip** lists all five categories with `pct% (count)`, color-coded to match the slices. There are no always-visible labels under the pie — keeping each cell ~48px wide so many cluster columns fit on a desktop screen.

Column headers are: `OVERALL N`, `A N₁`, `B N₂`, ... where `N` is total participants and `Nᵢ` is cluster size. Letters are assigned by index in `clusterConsensus.clusters`, which is already sorted by size descending — so `A` is always the largest cluster.

The number of cluster columns is `clusterConsensus.totalClusters` and varies room-to-room. If `clusterConsensus` is null/empty, only the **Overall** column is rendered.

---

## Assumptions

- Cluster ordering and labels follow `clusterConsensus.clusters` (size-desc, ids reassigned 0..N-1). Letter labels (A=0, B=1, ...) are assigned at render time. This matches how `ClusterConsensusBox` numbers clusters in [DebateAnalysisReport.tsx:142](src/components/analysis/DebateAnalysisReport.tsx#L142).
- The "Overall" denominator is `metrics.totalParticipants` (everyone who participated in any way — already on `AnalysisMetrics`). This may differ slightly from `sum(clusterSizes)` if some participants did not vote on enough statements to be assigned to a cluster, but is the more meaningful "could have voted" denominator.
- Sorting on the existing five raw-count columns is unchanged. The new columns are **not sortable** — sort semantics for a 5-segment pie aren't well-defined and the existing sort already covers the most useful orderings.
- Hidden statements remain excluded — `applyStatementMerges` and the `getStatementsForRoom` filter already handle that upstream; nothing new is needed here.

---

## Data Model

The server currently computes per-cluster vote totals only for the **top 3** statements per cluster, inside `calculateClusterConsensus` in [cluster-analysis.tsx:84-133](src/supabase/functions/server/cluster-analysis.tsx#L84-L133). Those `ClusterConsensusStatement` records also lack `passVotes` and `superAgreeVotes`. To populate the new columns we need:

1. **All statements** (not just top 3) broken down by cluster.
2. **`passVotes`** alongside agree/disagree counts.
3. **`superAgreeVotes`** so the pie can render super-agrees as a distinct slice.
4. **Cluster sizes** carried through to the frontend (already on `Cluster.size`, surfaced via `clusterConsensus.clusters[i].size`).

### New shared type — `ClusterVoteBreakdown`

Already added to [src/types/index.ts:259-266](src/types/index.ts#L259-L266). The server needs to mirror it in [analysis-utils.tsx](src/supabase/functions/server/analysis-utils.tsx):

```ts
export interface ClusterVoteBreakdown {
  clusterId: number;        // 0..N-1, matches Cluster.id ordering (size desc)
  clusterSize: number;      // denominator for percentages
  agreeVotes: number;       // includes super-agrees (matches ClusterStatement convention)
  superAgreeVotes: number;  // subset of agreeVotes
  disagreeVotes: number;
  passVotes: number;
  // didn'tVote = clusterSize - (agree + disagree + pass)  -- derived on the client
  // rawAgree   = agreeVotes - superAgreeVotes              -- derived on the client
}
```

### Extension to `StatementVotes`

Added to [src/types/index.ts:268-280](src/types/index.ts#L268-L280):

```ts
export interface StatementVotes {
  // ... existing fields
  clusterVotes: ClusterVoteBreakdown[];   // one entry per cluster, in cluster-id order
}
```

`clusterVotes` is **required** (not optional). For pre-cluster or zero-cluster rooms the server will emit an empty array `[]`. Making it required keeps consumer code from littering `?? []` everywhere.

The Overall column is computed from the existing per-row `rawAgreeVotes`, `superAgreeVotes`, `disagreeVotes`, `passVotes` and the table-level `totalParticipants` prop — no new per-row Overall fields needed.

### No change to `ClusterStatement`

The existing `ClusterStatement` shape used by `ClusterConsensusBox` (top 3 per cluster) stays as-is. We do not retrofit `passVotes`/`superAgreeVotes` there because the consensus box doesn't display them.

---

## Server-Side Computation (NOT YET DONE)

### Refactor in `cluster-analysis.tsx`

Today `calcBestClusterStatements` produces only the four fields used by the consensus box. Two changes:

1. Extract a helper that, for a single statement and a list of users-in-cluster, returns the full breakdown including `passVotes` and `superAgreeVotes`. Use it from both call sites.
2. Add per-statement breakdowns covering **all** statements (not just top 3 per cluster) in cluster-id order.

To keep cluster ordering consistent between the consensus box and the new breakdowns, do the size-desc sort + id reassignment **once**, then drive both outputs from the same intermediate `usersByClusterSorted: string[][]`.

Recommended shape: extend `calculateClusterConsensus`'s return type to also include `statementBreakdowns: Record<string, ClusterVoteBreakdown[]>`. Single-pass, single-call from the API layer.

```ts
export interface ClusterConsensus {
  totalClusters: number;
  clusters: Cluster[];                                          // existing top-3 per cluster
  statementBreakdowns: Record<string, ClusterVoteBreakdown[]>;  // NEW
}
```

### Wire-up in `analysis-api.tsx`

After computing `clusterConsensus` at [analysis-api.tsx:88-94](src/supabase/functions/server/analysis-api.tsx#L88-L94), enrich `metrics.allStatements`:

```ts
const allStatementsWithClusters = metrics.allStatements.map(s => ({
  ...s,
  clusterVotes: clusterConsensus?.statementBreakdowns[s.id] ?? [],
}));
```

and replace `metrics.allStatements` with the enriched version when constructing `analysisData`. No new endpoints, no new KV reads — this all happens in the existing `/room/:roomId/analysis` request path.

### Default `clusterVotes` from `serializeStatement`

Until the API enrichment ships, every code path that constructs a `StatementVotes` (most importantly [serializeStatement in utils.tsx](src/supabase/functions/server/utils.tsx#L40)) must emit `clusterVotes: []` so the response shape matches the now-required field. Easiest: default to `[]` inside `serializeStatement`, then have `analysis-api.tsx` overwrite for clustered rooms.

---

## Frontend Changes (DONE)

### `StatementVotesTable.tsx`

[Implemented](src/components/analysis/StatementVotesTable.tsx). Two new props:

1. `totalParticipants: number` — denominator for the Overall column.
2. `clusterSizes: number[]` — drives column headers (`A {clusterSizes[0]}`, `B {clusterSizes[1]}`, ...) and is the denominator fallback for cluster columns. Empty array if no clusters.

Each new cell delegates to `VoteBreakdownPie`, passing different prop values for Overall vs. cluster columns:

- Overall: `rawAgree={row.rawAgreeVotes}`, `superAgree={row.superAgreeVotes}`, etc., `size={totalParticipants}`.
- Cluster: derives `rawAgree = cv.agreeVotes - cv.superAgreeVotes` (since `cv.agreeVotes` is the combined count, matching `ClusterStatement` convention), `size={cv.clusterSize ?? clusterSizes[idx]}`.

### `VoteBreakdownPie` — new component

Lives at [src/components/analysis/VoteBreakdownPie.tsx](src/components/analysis/VoteBreakdownPie.tsx). Uses recharts (`PieChart` + `Pie` + `Cell` + `Tooltip`), matching the convention in [DemographicsPieCharts.tsx](src/components/analysis/DemographicsPieCharts.tsx).

Key implementation details:
- **Fixed size** 44px (no `ResponsiveContainer`) since these are tiny inline cells — fixed dimensions skip a layout pass per row.
- **Stable slice ordering** via `SLICE_ORDER = ["agree", "superAgree", "disagree", "pass", "none"]`. Zero-value slices are passed unfiltered so the visual ordering never reshuffles.
- **`startAngle={90}` / `endAngle={-270}`** — first slice begins at 12 o'clock and unfolds clockwise.
- **`isAnimationActive={false}`** so a table of N rows doesn't ripple on load.
- **`allowEscapeViewBox={{ x: true, y: true }}`** on the tooltip so it isn't clipped to the 44×44 chart bounds.
- **All-zero fallback** — if every slice value is 0 (e.g. brand new room), renders a single full gray-200 pie instead of a recharts NaN edge case.

Slice colors are applied via `className` on each `Cell` (not the `fill` prop), pointing at the new `*-fill` semantic classes — see below.

### Semantic classes

Five new fill classes added to [semantic_classes.css](src/semantic_classes.css), following the existing `.{semantic}-{property}` convention (alongside the matching `*-bg`/`*-text`/`*-border` rules):

```css
.agree-fill        { fill: var(--color-green-500); }
.super-agree-fill  { fill: var(--color-purple-500); }
.disagree-fill     { fill: var(--color-red-500); }
.pass-fill         { fill: var(--color-amber-500); }
.no-vote-fill      { fill: var(--color-gray-200); }
```

If we ever rebrand a vote category's color, those rules are the single point of change.

### `DebateAnalysisReport.tsx`

[Updated](src/components/analysis/DebateAnalysisReport.tsx#L168-L172):

```tsx
<StatementVotesTable
  statements={allStatements}
  totalParticipants={totalParticipants}
  clusterSizes={clusterConsensus?.clusters.map(c => c.size) ?? []}
/>
```

`totalParticipants` and `clusterConsensus` were already in scope.

### Storybook

Both [StatementVotesTable.story.tsx](src/stories/StatementVotesTable.story.tsx) and [DebateAnalysisReport.story.tsx](src/stories/DebateAnalysisReport.story.tsx) have been updated:

- All mock `StatementVotes` now include `clusterVotes` with `superAgreeVotes` per cluster, sized to match the mock cluster sizes.
- A `WithoutClusters` story variant on `StatementVotesTable` verifies graceful degradation when `clusterSizes={[]}` and each statement's `clusterVotes` is `[]`.
- An `Empty` story variant covers the zero-statement case.

---

## Edge Cases

1. **No cluster data** (`clusterConsensus` null or `totalClusters === 0`). Only the Overall column renders. The "No Cluster Data Available" warning at [DebateAnalysisReport.tsx:111-125](src/components/analysis/DebateAnalysisReport.tsx#L111-L125) is unchanged.
2. **Statement with zero votes** (e.g. brand new). All slice values are 0; `VoteBreakdownPie` falls back to a single gray-200 pie. Tooltip still works and reads `0% (0)` for every category.
3. **Cluster with size 0**. Renders a single gray-200 pie via the same all-zero fallback.
4. **Many clusters** — table gets wide. Already wrapped in `overflow-x-auto` at [StatementVotesTable.tsx:68](src/components/analysis/StatementVotesTable.tsx#L68). Each cell is ~48px so 6+ cluster columns fit on a desktop screen.
5. **Merged statements.** `mergedFrom` is already accumulated by `applyStatementMerges` upstream. The cluster vote breakdown is computed from the merged statement's voter map, which already includes voters from sources. No special handling needed.
6. **`agree + disagree + pass > size`** (shouldn't happen — would mean a user voted twice). `Math.max(size - voted, 0)` clamps "didn't vote" to non-negative. Recharts handles slice values > size gracefully (it just normalizes).
7. **Mobile tap behavior.** Recharts tooltips on touch dismiss on `touchend`. If users find this awkward, swap the recharts Tooltip for a Radix Popover wrapper (heavier, but click-to-toggle persistence). Defer until we have feedback.

---

## Testing

- ✅ [src/stories/StatementVotesTable.story.tsx](src/stories/StatementVotesTable.story.tsx) — mock data includes `clusterVotes` and the story passes the new props. `WithoutClusters` and `Empty` variants exist.
- ✅ [src/stories/DebateAnalysisReport.story.tsx](src/stories/DebateAnalysisReport.story.tsx) — mock `topPosts`/`spiciestPosts` include `clusterVotes` aligned with the existing 3 mock clusters.
- ❌ Add unit tests in [src/supabase/functions/server/cluster-analysis.test.tsx](src/supabase/functions/server/cluster-analysis.test.tsx):
  - `calculateClusterConsensus` returns `statementBreakdowns` with one entry per statement and one inner record per cluster.
  - Cluster ordering in `statementBreakdowns[id]` matches the cluster-id ordering in `clusters`.
  - `passVotes` and `superAgreeVotes` are counted correctly per cluster.
  - Statements with zero cluster voters render `{ agreeVotes: 0, superAgreeVotes: 0, disagreeVotes: 0, passVotes: 0 }` with `clusterSize` still populated from the cluster metadata.
- ❌ Manual QA on a real analysis page: visit `/analysis/:roomId` for a room with ≥2 clusters, confirm the new columns appear, the pie slice proportions look right, hovering reveals the tooltip with all five categories, and the cluster sizes in headers match `ClusterConsensusBox`.

---

## Implementation Task Breakdown

Each step leaves the app in a working, mergeable state.

1. ✅ **Frontend (FE-only iteration).** Built `VoteBreakdownPie`, added `totalParticipants` + `clusterSizes` props to `StatementVotesTable`, added `*-fill` semantic classes, wired `DebateAnalysisReport` to pass the new props, and updated both Storybook stories with cluster-aware mock data. Type changes already on the frontend — `ClusterVoteBreakdown` and required `clusterVotes` field on `StatementVotes` exist in [src/types/index.ts](src/types/index.ts).

2. **Server: extend `cluster-analysis.tsx`.** Refactor the per-statement vote-counting helper to return `{agreeVotes, superAgreeVotes, disagreeVotes, passVotes, clusterSize}`. Add `statementBreakdowns: Record<string, ClusterVoteBreakdown[]>` to the `ClusterConsensus` return type and populate it inside `calculateClusterConsensus` for **all** statements (not just top 3). Add unit tests covering the new field.

3. **Server: mirror the type and default `clusterVotes: []` in `serializeStatement`.** Add `ClusterVoteBreakdown` to [analysis-utils.tsx](src/supabase/functions/server/analysis-utils.tsx) so `StatementVotes` matches the frontend shape. Update `serializeStatement` in [utils.tsx](src/supabase/functions/server/utils.tsx#L40) to default `clusterVotes: []` so existing call sites stay valid.

4. **API: enrich `allStatements` in `analysis-api.tsx`.** Map `clusterConsensus?.statementBreakdowns[s.id] ?? []` onto each `StatementVotes` before returning. Confirm via dev tools that the response payload now includes the new field.

5. **Polish + manual QA.** Run through a real room with cluster data, confirm tooltips work cleanly on desktop and mobile, confirm cluster-letter ordering in the table matches `ClusterConsensusBox`. Decide whether mobile tooltip dismiss-on-touchend is acceptable or whether to swap to a Radix Popover.
