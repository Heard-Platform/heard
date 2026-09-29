# Phase 2: Cluster Naming

[← Overview](README.md)

## Name rules

- 2–3 words, **≤ 16 characters**, aiming for 14–16. Examples: "Full Speed Ahead", "Hit the Brakes", "Show Me the Data".
- Describes what the group *believes*, not who its members are.
- Fair: every group should be happy with its name. No mocking, no partisan labels, no real people's names.

## Fallback names

Used before a cluster is named, or when naming fails: plain "Group A", "Group B", "Group C", lettered by slot so they stay stable across recomputes. Fun alternatives (colour teams, animals, Greek letters) were considered, but they either imply something about the group or add confusion.

## When to name

A new cluster (one without a name) gets named once it has **≥ 5 members and ≥ 1 statement that clears the z-test**. Until then it keeps its fallback.

## Avoiding rename churn

Once a cluster has a name, it should only change when the group's *views* have changed, not because the LLM phrased the same idea differently. A user's group getting a new name for no visible reason is confusing. Guards, in order:

1. **Named clusters are never re-sent for naming just because another cluster needs a name.** They go into the prompt as fixed, taken names (so the new name contrasts with them), not as something to rewrite.
2. **Drift is measured on the group's stance, not on which statements rank highest.** When a cluster is named, store a snapshot of how it voted on its top statements (its agree rate on each). A cluster counts as drifted only when it no longer clearly holds that stance on at least half of them: its agree rate on a statement has moved more than ~25 points, or crossed 50%. A different, similar statement overtaking one of them doesn't count.
3. **The LLM must justify a rename, and "keep" is the default.** On drift, the model sees the current name, the old stance snapshot and the new top statements. It answers either `keep`, or `rename` with a one-line reason naming what changed plus the new name. If the response is `keep`, ambiguous or fails validation, the current name stays.

## Prompt

- All clusters are named in **one call**, so the names contrast with each other.
- For each cluster, the model sees:
  - its size
  - its top ~5 distinguishing statements in **both** directions ("agrees much more than others" and "disagrees much more than others")
- Room context: the post title and 1–2 statements every cluster agrees on, as "not what separates them".
- Clusters that already have a name are listed separately as taken names, not open to change.
- Output: JSON `{ names: [{ stableId, name }] }`. The drift check (guard 3) is its own small call, with output `{ decision: "keep" }` or `{ decision: "rename", reason, name }`.

Today's distinguishing-statement z-test only keeps the agree-more side. Add a two-sided variant for naming and leave the existing one alone, because the report depends on it.

## Validation and execution

- On the server:
  - Parse the JSON.
  - Every cluster must be present.
  - Check word count and the 16-character cap.
  - Reject duplicates.
- Retry up to twice, each time with the specific failure noted. If all three attempts fail, keep the fallback, log it, and try again on the next recompute.
- Runs in the background (`EdgeRuntime.waitUntil`) after a recompute, so no request waits on the LLM.
- Only writes back if the identity record's `version` hasn't changed since naming started.
- Uses the existing LLM client, so usage logging comes for free. Haiku-class models are enough. Cost: about 1–2k input tokens per call, only when clusters change.

## Where names appear

- The analysis report, replacing the Cluster A/B/C letters.
- The new AI Review tab in dev tools (below), for reviewing names across all rooms.
- Later, the minimap (Phase 4).

## AI Review tab (dev tools)

A new dev tools tab for reviewing anything AI-generated. For now its only section is cluster names.

- **Auto-naming switch** at the top of the section: turns automatic naming after recomputes on or off.
- **Room picker:** a searchable dropdown of every room (fuzzy match on title), showing each room's vote count. Picking a room runs naming for it.
- **List:** only rooms with at least one named cluster, most recently named first, loaded in pages ("Load more").
- **Each row** shows:
  - the room title and its vote count
  - each cluster as a colour chip, with its name (or "Group A/B/C") and size
  - for a renamed cluster, the previous name and the model's reason
- **"Re-run naming" button per row:**
  - Generates fresh names for every cluster in that room, deliberately skipping the rename guards.
  - Still respects the minimum-data rule; clusters that don't meet it keep their fallback.
  - If the room has no clusters yet, it runs clustering first.
  - The room moves to the top of the list, or drops out of it if none of its clusters had enough data to name.

## Deploy

- Automatic naming after recomputes sits behind an internal on/off switch, toggled from the top of the AI Review tab. The per-room button works regardless, so names can be generated and reviewed manually before the switch is turned on.
- The frontend shows the name if one exists and the fallback otherwise, so the two sides can deploy in either order.

## Blast radius

**Small.** Almost all of the risk sits inside the new feature: naming could fail to run, show bad names on the analysis report, or rename clusters too readily.

Areas impacted:
- Core DB call for clusters - Small refactor
- Functions for calcing cluster defining statements - This was refactored.
- Cluster generation - Now has a call to do naming added midway.
- API endpoint for room analysis report - Query could fail in rare race conditions if a recompute lands between naming's version check and its save.
- AI token spend - This adds a new regular usage of AI.

## Tracking

In the feature results tracker: total tokens spent on cluster naming (initial names, drift checks and manual re-runs). Name quality is reviewed in the AI Review tab instead.

---

## Footnotes: code pointers

- LLM: `createLlmClient().completeJson(prompt, { endpoint: "cluster-naming" })` in `src/supabase/functions/server/llm-provider.ts`.
- In `cluster-analysis.tsx`, `calcDistinguishingAgreedStatements` (z ≥ 1.96, used by the report) and `calcAnyDistinguishingStatements` (|z| ≥ 1.96, used for naming) share one ranking helper.
- `cluster-naming-utils.ts` (pure): naming inputs, common ground, stance snapshot and drift detection, prompts, and response parsing and validation. The prompt labels groups A/B/C and maps them back to `stableId`.
- `cluster-naming.ts`: `nameClustersForRoom(roomId, "auto" | "force")`, plus the on/off switch accessors. Force mode clears names on clusters that no longer meet the minimum-data rule.
- `background-utils.ts`: `runInBackground`, a thin wrapper around `EdgeRuntime.waitUntil` that logs failures.
- Trigger it at the end of `clusterUsersAndSave` in `clustering.tsx`.
- Identity record addition per cluster: `naming: { name, namedAt, stanceSnapshot, previousName, renameReason } | null`. Kept clusters carry it across recomputes.
- On/off switch: follow the `ENRICHMENT_ON` pattern end to end, i.e. the internal var and endpoints in `internal-config-api.tsx` / `internal-utils.ts` (e.g. `CLUSTER_NAMING_ON`), plus the `getEnrichmentConfig` / `setEnrichmentConfig` toggle in `src/components/devtools/EnrichmentTab.tsx`, placed in the AI Review tab.
- There is no text moderation in the codebase to reuse (`moderation-utils.ts` only hides statements), so names rely on the prompt's fairness rules plus format validation, and are reviewed in the AI Review tab.
- Expose it as `clusterConsensus.clusters[].name` via `analysis-api.tsx`.
- AI Review tab:
  - Add an `"ai-review"` entry to `TabType` and a `TabButton` in `src/components/devtools/DevTools.tsx`.
  - New `src/components/devtools/AiReviewTab.tsx`, with the cluster-names section as its own component (e.g. `ClusterNamesReview.tsx`) so later AI sections slot in beside it.
  - Room listing: follow `/dev/posts` (`api.getAllPosts`, used by `PostsTab.tsx`).
  - Endpoints in `ai-review-clusters-api.ts`: `GET /dev/ai-review/cluster-names?offset&limit` (named rooms only, via one `cluster:%:identity` KV query), `GET /dev/ai-review/rooms` (picker options, vote count from `room.totalVotes`) and `POST /dev/room/:roomId/cluster-names/regenerate`. The switch is `GET/POST /internal/config/cluster-naming`.
- Tokens: every naming call (including drift checks) uses `endpoint: "cluster-naming"`, so the tracker total is the sum of `totalTokens` in `llm_api_calls` for that endpoint. See `ai-usage-api.ts` for the query pattern; aggregate it in `/stats/features` (`features-results-tracker-api.ts`).
