# Duplication Detection — Research Tooling

Calibration scripts and a viewer that informed the design in [docs/planning/automatic-duplicate-detection-feature-plan.md](../../docs/planning/automatic-duplicate-detection-feature-plan.md). The feature itself is shelved; this directory preserves the tooling for whoever picks it up next.

The scripts read and write CSVs under `public/data/`. The viewer at `/similarity-explorer` (wired in [src/App.tsx](../../src/App.tsx)) reads the same CSVs through Vite's static serving.

### What's committed vs. ignored

Three of the four CSVs are committed snapshots so the viewer works on a fresh clone:

- `statements.csv` — raw extract of statements + topics
- `statement-similarity.csv` — pairwise scores within each room
- `dryrun-merges.csv` — output of the dryrun simulation

`statement-embeddings.csv` is gitignored because it's about 150 MB. A fresh clone has no embedding cache; running step 2 below regenerates it (and pays the Gemini cost once). Running step 2 again later re-uses the cache and only embeds new statements.

To refresh the committed snapshots with current site data, run all three scripts in order and commit the new CSVs.

## Running the scripts

All commands are run from the project root.

### 1. Extract statements + topics from the live DB

```
deno run --allow-net --allow-env --allow-read --allow-write --env-file=.env \
  research/duplication-detection/scripts/extract-statements.ts
```

Output: `public/data/statements.csv` (columns: `room_id, topic, statement_id, statement_text, timestamp`).

Requires `.env` with `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY`, `VITE_HEARD_API_SECRET`, `DEV_ADMIN_KEY`. Hits `/admin/debates` and then `/room/:id` for every active room with 10-way concurrency. Expect ~30-60 seconds for ~800 rooms.

### 2. Generate embeddings + pairwise similarity

```
deno run --allow-net --allow-env --allow-read --allow-write --env-file=.env \
  research/duplication-detection/scripts/score-statement-similarity.ts
```

Inputs: `public/data/statements.csv`. Outputs: `public/data/statement-embeddings.csv` (cache) and `public/data/statement-similarity.csv` (every within-room pair with cosine similarity).

Requires `GEMINI_API_KEY` in `.env`. Calls Gemini's `batchEmbedContents` with `gemini-embedding-001`, 100 statements per request.

The script is **resumable**: the embedding cache is rewritten after every successful batch, so a crash or transient API error mid-run loses at most one batch of work. Re-running picks up exactly where it left off and only embeds statements that aren't already cached. Transient Gemini errors (429, 5xx) are retried up to 5 times with exponential backoff (1s, 2s, 4s, 8s, 16s).

Expect a few minutes for a fresh embedding run of ~3,500 statements; subsequent runs after cache hits are nearly instant.

### 3. Simulate the cron over historical data

```
deno run --allow-read --allow-write \
  research/duplication-detection/scripts/dryrun-duplicate-detection.ts
```

Inputs: `public/data/statements.csv` + `public/data/statement-embeddings.csv`. Output: `public/data/dryrun-merges.csv`.

Walks each room chronologically, applies the chain-following merge logic at the chosen threshold, and prints summary counts at thresholds 0.70-0.95. Override the threshold with `--threshold=0.85`.

Pure local arithmetic — runs in seconds, no network, no API cost.

## Viewer

`screens/SimilarityExplorer.tsx` is wired into the main app and reachable at `http://localhost:5173/similarity-explorer` when running `npm run dev`. The "View" selector at the top switches between **All pairs** (statement-similarity.csv) and **Dryrun merges** (dryrun-merges.csv). Both use the same sortable / resizable / paginated table.

## Files

```
research/duplication-detection/
  README.md                                  ← this file
  scripts/
    extract-statements.ts
    score-statement-similarity.ts
    dryrun-duplicate-detection.ts
  screens/
    SimilarityExplorer.tsx
```
