# Automatic Duplicate Detection Feature Plan

> **Status: shelved.** This document captures the design as of the time it was written. The feature was paused before implementation. The `Open Questions / Known Issues` section at the bottom lists everything that needs to be resolved before picking this back up.

## Overview

A scheduled cron job runs every 30 seconds, finds newly-added statements, compares each one against the other statements in its room via cosine similarity of sentence embeddings, and merges any pair that exceeds a configurable similarity threshold. Merged statements have their votes migrated to the canonical statement and disappear from the user-facing UI. An admin can undo any merge from the AdminPanel; a "manually unmerged" flag prevents the cron from re-merging it later.

This complements the manual [statement deduplication feature](deduplication-feature-plan.md). The manual flow lets a host pick two statements and merge them by hand; this automatic flow catches duplicates that hosts miss or that arrive too quickly to triage.

A separate one-off calibration step (described in the **Calibration** section) is required before deploying this feature, to pick a similarity threshold against current-corpus data.

---

## Assumptions

- Embeddings are produced by Gemini's `gemini-embedding-001` model (2048 dimensions). If a different embedding model is used in the future, the assumption is that 1) it returns a fixed-length numeric vector and 2) cosine similarity remains a meaningful similarity metric for it.
- Cosine similarity is computed in-process by the cron worker. No vector database, no `pgvector` extension.
- The `statement_merges` table from the manual deduplication feature is reused. New cron-driven merges are differentiated from manual ones by an `auto BOOLEAN` column.
- Embedding generation does not block the user-facing statement-submission path. New statements may exist without an embedding for up to one cron tick (≤30s).
- The cron is best-effort and idempotent. Repeated runs over the same data produce the same merges. Failures (Gemini timeout, partial DB failure) are recovered on later ticks via a retry sweep.
- A starting threshold of 0.85 is the design's working assumption. It was chosen by spot-checking near-threshold pairs from a one-time calibration; a fresh calibration should be run before this feature is enabled in production. Below 0.85 false positives appear (statements about the same topic with different opinions); above 0.90 obvious paraphrases get missed.

---

## User Flows

### Regular user — submits a duplicate statement

1. User submits a statement that paraphrases something already in the room.
2. The submission saves immediately. No latency penalty.
3. Within 30 seconds, the cron runs, embeds the statement, compares it, finds a near-duplicate, and merges it into the canonical statement.
4. Any votes the user (or others) cast on the duplicate during that 30-second window are migrated to the canonical statement.
5. The duplicate disappears from the voting queue and from the user's view of the room. The canonical statement is unaffected from the user's perspective except its vote counters now include the migrated votes.

### Admin — reviews and undoes an automated merge

1. Admin opens AdminPanel → "Merges" tab.
2. Sees a paginated list of recent merges, each row showing: room topic, duplicate text, target text, similarity score, timestamp, and `auto` vs `manual`.
3. If a merge looks wrong, admin clicks **Undo**.
4. The duplicate statement is restored with its original vote counts. The canonical statement's counters are decremented accordingly. `manuallyUnmerged = true` is set on the duplicate so the cron will not re-merge it on a future tick.

### Admin — adjusts the threshold

1. The threshold is a server constant (`DUPLICATE_SIMILARITY_THRESHOLD`). Admin coordinates with engineering to change it.
2. Future improvement: expose it as a Supabase env var so it can be tuned without a deploy.

---

## Data Model

### Changes to `Statement`

Add four optional fields to the `Statement` interface in [src/supabase/functions/server/types.tsx](../../src/supabase/functions/server/types.tsx) and the mirror in [src/types/index.ts](../../src/types/index.ts):

| Field | Type | Notes |
|---|---|---|
| `embedding` | `number[] \| undefined` | 2048-dimension vector. Absent for statements that have not been embedded yet, or for which embedding has failed. |
| `mergedIntoId` | `string \| undefined` | If set, this statement is a duplicate of another. Frontend hides any statement with this set. |
| `manuallyUnmerged` | `boolean \| undefined` | Set to `true` when an admin undoes a merge. Cron skips statements with this flag. One-way; no current path clears it. |
| `duplicateCheckedAt` | `number \| undefined` | Timestamp of the last successful duplicate-detection pass. Absent = the statement has not been compared yet. |

### Extended `mergedFrom` shape

The existing `mergedFrom?: Array<{ id: string; text: string }>` field on `Statement` is extended to carry a vote snapshot, so an undo can fully restore the duplicate's original state:

```ts
mergedFrom?: Array<{
  id: string;
  text: string;
  votes: Record<string, VoteType>;          // duplicate's full voter map (used to restore the duplicate)
  counts: {
    agrees: number;
    disagrees: number;
    passes: number;
    superAgrees: number;
  };
  appliedVoters: Record<string, VoteType>;  // subset of `votes` that actually migrated to the canonical (used for undo)
}>;
```

`votes` is the duplicate's complete voter dict at merge time, used to restore the duplicate on undo. `appliedVoters` is the subset that was actually applied to the canonical (i.e., `votes` minus the entries that collided with an existing canonical voter). Storing both makes undo unambiguous even when multiple merges have stacked into the same canonical: undo only subtracts what its own merge added.

This is a forward-compatible change: existing records with the simpler shape continue to load (the new fields are simply absent), and new merges populate the snapshot. Manual merges from the existing flow can also be upgraded to populate the snapshot at the same time, so undo semantics work uniformly.

### Changes to `statement_merges`

Two new columns on the existing table:

| Column | Type | Notes |
|---|---|---|
| `similarity` | `REAL` | The cosine score that triggered the merge. Null for manual merges (no score). |
| `auto` | `BOOLEAN NOT NULL DEFAULT true` | Distinguishes cron-driven merges from manual merges. New cron rows set this to `true`; the manual merge endpoint sets it to `false`. |

No other tables are added.

---

## API Endpoints

### Cron endpoint (server-only)

- `POST /make-server-f1a393b4/cron/detect-duplicates` — invoked every 30 seconds. Auth: `x-cron-secret` header (same pattern as [cron-api.tsx:12-22](../../src/supabase/functions/server/cron-api.tsx#L12-L22)). Returns a summary `{ processedCount, mergedCount, embeddingFailures }`.

### Admin endpoints

- `GET /make-server-f1a393b4/admin/merges?limit=50&offset=0` — list recent merges joined with both statements' texts and the room topic. Host-key auth as per the existing AdminPanel pattern.
- `POST /make-server-f1a393b4/admin/merges/:mergeId/undo` — reverse a single merge. Host-key auth.

Use the existing `defineRoute` wrapper.

---

## Detection Algorithm

A single tick runs in three phases.

### 1. Build the candidate set

Two queries, unioned:

- **Primary**: statements where `(value->>'timestamp')::bigint > now_ms - 30_000`. Catches anything that arrived in the last tick.
- **Retry sweep**: statements where `value->'embedding' IS NULL` OR `value->'duplicateCheckedAt' IS NULL`. Catches anything a previous tick failed on or that was added before the cron started running.

The union ensures that a statement which fails embedding on its first tick does not silently fall out of the window after 30 seconds — it stays in the retry sweep until both fields are populated.

Group candidates by `roomId` in memory.

### 2. Process each room

For each room with candidates, fetch all of its existing statements once (`getStatementsForRoom`). Then iterate each candidate:

```
for each candidate s in the room:
  if s.manuallyUnmerged:
    set s.duplicateCheckedAt = now, save, skip
  if s.mergedIntoId is set:
    set s.duplicateCheckedAt = now, save, skip
  if s.embedding is missing:
    embedding = gemini.embed(s.text)
    if embedding failed:
      log, continue   # retry sweep will pick it up next tick
    s.embedding = embedding
    save(s)
  bestScore, bestTarget = -1, null
  for each other statement t in the room:
    if t.embedding is missing or t.mergedIntoId is set:
      continue
    score = cosine(s.embedding, t.embedding)
    if score > bestScore:
      bestScore, bestTarget = score, t
  if bestTarget and bestScore >= DUPLICATE_SIMILARITY_THRESHOLD:
    canonical = walkChain(bestTarget)   # follow mergedIntoId
    mergeDuplicate(s, canonical, bestScore)
  set s.duplicateCheckedAt = now
  save(s)
```

`walkChain(target)` follows `mergedIntoId` until it reaches a statement without one. This handles the case where the best match has itself been merged into something else; the new statement is merged into the ultimate canonical instead, keeping the merge graph one level deep.

### 3. Merge

`mergeDuplicate(duplicate, canonical, similarity)` performs:

1. Compute `appliedVoters` = the subset of `duplicate.voters` whose `userId` is NOT already present in `canonical.voters`.
2. Append a new `mergedFrom` entry to the canonical: `{ id: duplicate.id, text: duplicate.text, votes: { ...duplicate.voters }, counts: { agrees, disagrees, passes, superAgrees }, appliedVoters }`.
3. Migrate votes (see next section). The set of voters actually applied is exactly `appliedVoters`.
4. Set `duplicate.mergedIntoId = canonical.id`.
5. Insert a row into `statement_merges` with `auto = true` and `similarity` set.
6. Save both statements.

---

## Vote Migration

When a duplicate is merged into a canonical, votes flow as follows:

- For each `(userId, voteType)` in `duplicate.voters`:
  - If `canonical.voters[userId]` is unset → set it, increment the matching counter on `canonical`.
  - If `canonical.voters[userId]` is already set → discard the duplicate's vote (canonical's existing vote wins). The discarded vote is preserved in the `mergedFrom` snapshot, so undo can still restore it.

This rule keeps "one vote per user per canonical statement" as an invariant. A user who voted on both the duplicate and the canonical is not double-counted.

### Undo

To reverse a merge:

1. Find the `mergedFrom` entry on the canonical that matches the duplicate's id.
2. Restore `duplicate.voters` from `entry.votes` and the duplicate's counters from `entry.counts`.
3. For each `(userId, voteType)` in `entry.appliedVoters`: remove that user from `canonical.voters` and decrement the matching counter on the canonical. Voters that collided at merge time are NOT in `appliedVoters`, so their canonical vote is left untouched (it was the canonical's pre-merge vote and should remain).
4. Remove the matched `mergedFrom` entry from the canonical.
5. Clear `duplicate.mergedIntoId`. Set `duplicate.manuallyUnmerged = true`.
6. Delete the `statement_merges` row.

The combination of `appliedVoters` in the snapshot plus the `manuallyUnmerged` flag makes the operation precise and idempotent — undoing the same merge twice is a no-op the second time. Multiple merges stacked into the same canonical can also be undone in any order, since each undo only touches the voters it itself migrated.

---

## Embedding Strategy

Embeddings are generated lazily by the cron, never on the user-facing write path:

- `saveStatement` is unchanged from today. New statements land in KV without an `embedding` field.
- The cron's per-statement loop generates the embedding the first time it processes the statement.
- If the embedding API call fails, the loop continues; the statement is left without an embedding and `duplicateCheckedAt` stays unset, so the retry sweep picks it up next tick.
- Backfill of existing statements is a separate one-off script, run once before the cron is enabled in production.

A future optimisation is to batch all statements needing embedding within a tick into a single `batchEmbedContents` call instead of one call per statement. For current site volume (single-digit statements per 30s in busy rooms) the savings are minimal.

### Backfill

`scripts/backfill-statement-embeddings.ts`:

1. Paginates through all statements via the existing `getAllStatements()` helper.
2. Skips any that already have `embedding` set.
3. Batches up to 100 statements per Gemini `batchEmbedContents` call.
4. Writes each result back via `saveStatement`.

Idempotent: re-running the script only embeds statements that lack an embedding.

---

## Calibration

Before turning the cron on, the threshold needs to be tuned against current-corpus data. The intended workflow:

1. Extract every existing statement (text, room, timestamp) into a CSV.
2. Generate embeddings for each via Gemini's batch embedding endpoint and cache them in a second CSV.
3. Run a chronological simulation per room: for each statement in timestamp order, compute cosine similarity against every prior statement in its room and record the highest score.
4. Inspect the resulting (statement_1, statement_2, score) pairs at thresholds 0.70, 0.75, 0.80, 0.85, 0.90, 0.95. Eyeball pairs near the cutoff at each threshold.
5. Pick the threshold where the lowest-scoring "merge" still feels like a real duplicate.

This calibration was done once during the design phase (April 2026) against ~3,700 statements across ~750 rooms; 0.85 was the resulting recommendation. The code that performed it lives under [`research/duplication-detection/`](../../research/duplication-detection/) — three Deno scripts (`extract-statements.ts`, `score-statement-similarity.ts`, `dryrun-duplicate-detection.ts`) and a React viewer (`screens/SimilarityExplorer.tsx`) reachable in dev at `/similarity-explorer`. If those scripts still exist when this feature is revisited they can be re-run; if not, the design above describes what they need to do.

---

## Phased Rollout

This feature lives behind multiple gates so it can be introduced safely.

1. **Schema and write-path types.** Add the new optional fields to `Statement`. Extend `mergedFrom` shape. Add the two columns to `statement_merges`. No runtime behaviour changes; existing endpoints continue to work.

2. **Backfill.** Run the backfill script against production. Embed every existing statement. Verify all statements have an embedding of the expected length.

3. **Cron worker.** Ship the cron endpoint. Initially register it but do not schedule it — invoke it manually a few times to verify behaviour. Then schedule it at 30s.

4. **Admin Merges UI.** Build the AdminPanel tab and undo flow.

Each phase ships independently and can be merged/reverted on its own. Calibration (above) should be redone before phase 3 if the corpus has grown significantly since the last calibration.

---

## Frontend Changes

### Hide merged statements

The frontend already filters `mergedFrom` for some surfaces; extend the same filter to also drop any statement with `mergedIntoId` set. One predicate, applied in [getStatementsForRoom](../../src/supabase/functions/server/kv-utils.tsx) (or an equivalent shared retrieval point):

```ts
return statements.filter((s) => !s.mergedIntoId && !s.isHidden);
```

This propagates to every consumer (voting queue, results, analysis, digests) without changes at the call sites.

### AdminPanel — new "Merges" tab

A new tab alongside Users / SubHeards / Debates. Source: `GET /admin/merges`. Each row:

- Topic
- Duplicate text + timestamp
- Target text + timestamp
- Similarity (numeric, sortable)
- Auto vs manual badge
- "Undo" button

Pagination, topic filter, and search reuse the patterns already established by the SimilarityExplorer screen.

---

## Corner Cases

1. **Duplicate's best match is itself a duplicate.** Walk the `mergedIntoId` chain to find the canonical and merge into that. Keeps the graph one level deep.
2. **Multiple candidates above threshold.** Pick the highest-scoring one. Tie-break by oldest target.
3. **Voter on both statements.** Canonical's existing vote wins; the duplicate's vote is discarded but preserved in the `mergedFrom` snapshot for undo.
4. **Embedding API outage.** The candidate stays without `embedding` and `duplicateCheckedAt`; the retry sweep keeps trying every 30s. No fallback to non-semantic comparison.
5. **Statement with empty text.** The Gemini API rejects empty content. The script (and cron) filter `text.trim().length === 0` upstream and skip those statements entirely.
6. **Cron tick takes longer than 30 seconds.** A second tick will start before the first finishes if the scheduler does not enforce mutex. Mitigation: add a Postgres advisory lock at the top of the handler that aborts the tick if another tick is in flight.
7. **A statement is merged, then a NEW statement matches the (now-duplicate) target.** Walk-the-chain handles this: the new statement merges into the ultimate canonical, never into a duplicate.
8. **Admin undoes a merge while the cron is running.** Last write wins on the duplicate; the worst case is that the cron sees `manuallyUnmerged = true` mid-loop and skips. No data corruption.
9. **Threshold is changed and the cron picks up old statements via the retry sweep.** Statements with `duplicateCheckedAt` already set are NOT re-evaluated when the threshold changes. To re-run with a new threshold, an explicit script clears `duplicateCheckedAt` on the affected statements first.
10. **A user submits two near-identical statements within 30 seconds (i.e., before the cron has run).** Both are in the same tick's candidate set. Whichever is processed first becomes canonical; the other merges into it. Order within the tick is by `timestamp` ascending so the older of the two wins.

---

## Testing

### Unit tests

- `cosine(a, b)` — verifies math against known vectors. Already covered by the dryrun script's correctness check.
- `walkChain(statements, target)` — handles a 3-deep chain, a cycle (defensively breaks), and an absent target.
- `mergeDuplicate(duplicate, canonical, similarity)` — verifies vote migration, snapshot creation, and `statement_merges` insertion.
- `undoMerge(mergeId)` — verifies the duplicate is restored, counters decrement on canonical, `mergedFrom` entry is removed, and `manuallyUnmerged = true`.
- Vote-collision case: voter on both statements ends with one vote on canonical, no double-count, snapshot preserves both for restoration.

### Integration tests

- End-to-end: submit two near-identical statements, invoke `/cron/detect-duplicates` manually, confirm the second is merged with the expected vote totals on the first.
- Embedding-failure path: stub the Gemini call to fail, verify the statement remains uncompared, run again with the stub returning success, verify it gets processed.
- Threshold regression: re-run the dryrun script after any algorithm change; the merge count at threshold 0.85 should not drift unexpectedly.

### Manual QA on staging

- Submit a paraphrase, wait 30 seconds, confirm it disappears from the voting queue and the original's vote count incorporates any votes cast on the duplicate.
- Open AdminPanel → Merges, confirm the merge is listed.
- Click Undo, confirm the duplicate reappears with its original votes.
- Submit the same paraphrase again, wait, confirm it is NOT re-merged (because `manuallyUnmerged = true`).

---

## Code Organization Notes

- New cron handler lives in `src/supabase/functions/server/duplicate-detection-api.tsx`. Mirror the structure of [cron-api.tsx](../../src/supabase/functions/server/cron-api.tsx).
- Admin merge endpoints go in [admin-api.tsx](../../src/supabase/functions/server/admin-api.tsx) alongside the other admin handlers.
- Vote-migration logic is shared with the existing manual merge flow. Extract any duplicated logic into `merge-utils.ts` (`server/merge-utils.ts`) so manual and auto merges call the same function.
- The cron secret follows the same pattern as the existing [cron-api.tsx:12-22](../../src/supabase/functions/server/cron-api.tsx#L12-L22) — `x-cron-secret` header validated against an env var. Do not invent a new auth mechanism.
- Use the `defineRoute` wrapper for the new endpoints.

---

## Implementation Task Breakdown

Tasks are ordered so each one leaves the app in a working, mergeable state.

1. **Resolve open questions.** See the **Open Questions / Known Issues** section below. Several of these change the data model or the migration path; do not skip.

2. **Calibration refresh.** Re-run the calibration workflow described in the **Calibration** section against current data. Confirm the threshold (working assumption: 0.85) or pick a new one.

3. **Schema + types.** Add the four new fields to `Statement` (server + frontend types). Extend `mergedFrom` shape in both. Add migration for the two new columns on `statement_merges`, and an `UPDATE` to set `auto = false` on existing rows (see Open Questions). No behaviour changes. Type-checks pass.

4. **Backfill script.** `scripts/backfill-statement-embeddings.ts`. Idempotent. Run on staging first, then production.

5. **`merge-utils.ts` extraction.** Pull the manual-merge vote logic into a shared helper. Refactor the manual endpoint to use it. Verify nothing regresses.

6. **Cron handler.** New `duplicate-detection-api.tsx`. Invoke manually a few times against staging. Verify the algorithm walks the chain, migrates votes correctly, and updates `duplicateCheckedAt`.

7. **Schedule the cron.** Wire it up to fire every 30 seconds with the cron secret. Monitor for a few hours. Watch for embedding failures and unintended merges.

8. **Frontend filter.** Update `getStatementsForRoom` (and any other shared retrieval point) to filter `mergedIntoId`. Verify in staging that auto-merged statements disappear from the voting queue.

9. **AdminPanel Merges tab.** New tab with the list view, undo button, and topic filter. Storybook story.

10. **Manual QA + sign-off.** Run through the manual test matrix. Tune the threshold one more time if needed.

---

## Open Questions / Known Issues

These were identified during design review and should be resolved before implementation begins. They are listed roughly in order of severity.

### Critical

1. **Inconsistency with the existing manual-merge model.** The manual deduplication feature (see [deduplication-feature-plan.md](deduplication-feature-plan.md)) explicitly does NOT modify the duplicate statement — it stores merges only in `statement_merges` and applies them on-the-fly at analysis/display time. This plan, by contrast, sets `mergedIntoId` on the duplicate and migrates votes immediately. As written, we end up with two parallel mechanisms that need to be reconciled. Pick one before building:
   - **Option A**: adopt the on-the-fly model so auto and manual merges work the same way. Simpler to reason about consistency; harder to reverse efficiently because there's no single field to flip.
   - **Option B**: migrate existing manual merges to also write `mergedIntoId` and `mergedFrom` snapshots, so a single retrieval-time filter handles both. Requires a one-off migration but unifies the runtime path.

2. **Migration bug on the new `auto` column.** `ADD COLUMN auto BOOLEAN NOT NULL DEFAULT true` would mark every existing `statement_merges` row (all manual merges) as `auto = true`, which is the opposite of correct. The migration must run an explicit `UPDATE statement_merges SET auto = false` immediately after the column is added, OR use `DEFAULT false` and have new cron code explicitly set `auto = true`.

3. **Cron-vs-retrieval filter conflict.** The plan says to filter `mergedIntoId` at the shared retrieval layer (so duplicates disappear from the UI), but the cron itself needs the unfiltered list to walk chains and compare against duplicates. We need an "includes duplicates" escape hatch — analogous to `getAllStatementsForRoomIncludingHidden` in the hide-response feature design. The cron will call the unfiltered variant; everyone else will call the default-filtered one.

### Notable

4. **Concurrent-tick mutex.** Corner case "Cron tick takes longer than 30 seconds" suggests a Postgres advisory lock, but Supabase edge functions don't easily share advisory locks across invocations. A practical approach is a CAS (compare-and-set) on a KV key like `cron_lock:duplicate-detection` with a TTL. Pick a real mechanism before shipping the cron.

5. **Intra-tick ordering.** The fact that same-tick candidates are sorted by `timestamp` ascending (older becomes canonical) is hidden in a corner case but is load-bearing for the algorithm. Move it explicitly into the algorithm pseudocode.

6. **Backfill scope.** Should the backfill script embed statements that are already merged-out (manually)? Probably yes, because they may be un-merged later, but the answer should be documented.

### Minor

7. **Backfilling manual merges to the new snapshot shape.** The plan mentions that "Manual merges from the existing flow can also be upgraded to populate the snapshot at the same time," but doesn't describe the migration. If we don't backfill, existing manual merges can't be undone via the new endpoint. Decide whether undo applies retroactively or only to new merges.

8. **Threshold env var.** The plan currently treats the threshold as a server constant requiring a deploy to change, with an env var as a "future improvement." For a tunable parameter, env var should likely be the starting point.

9. **Embedding API rate limits.** At Gemini's free-tier limits the cron is fine, but if traffic spikes (e.g. someone imports a large batch via the existing Polis importer), the cron could hit per-minute caps. Worth monitoring; consider implementing the batched-embedding optimisation up front rather than as a follow-up.

10. **Cycle defense in `walkChain`.** Cycles in `mergedIntoId` shouldn't be possible to create through the documented flow, but `walkChain` should defensively detect a cycle (visited-set) and bail rather than infinite-loop.
