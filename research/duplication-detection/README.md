# Duplication Detection: Research Tooling

A self-contained mini-app for the duplication-detection research described in [`automatic-duplicate-detection-feature-plan.md`](automatic-duplicate-detection-feature-plan.md). The feature is shelved; this directory preserves the design and the calibration tooling for whoever picks it up next.

This directory has **zero ties to the main app**: its own `package.json`, `vite.config.ts`, `tsconfig.json`, dependencies, and dev server. The main project's `package.json`, `tsconfig.json`, `src/`, and other configuration files are untouched.

## Quick start

For a fresh clone, in order. Run all commands from the project root unless noted.

1. Make sure `.env` at the project root contains: `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY`, `VITE_HEARD_API_SECRET`, `DEV_ADMIN_KEY`, `GEMINI_API_KEY`.

2. Generate the data (writes into `research/duplication-detection/public/data/`). Run each step on its own and confirm it completes before moving to the next; the steps build on each other and the second one can hit Gemini rate limits or fail mid-run.

   2a. Extract statements from the live DB (~30-60s):

   ```
   deno run --allow-net --allow-env --allow-read --allow-write --env-file=.env research/duplication-detection/scripts/extract-statements.ts
   ```

   Wait for the `Wrote N rows to ...statements.csv` line.

   2b. Embed every statement and compute pairwise similarity (a few minutes; resumable):

   ```
   deno run --allow-net --allow-env --allow-read --allow-write --env-file=.env research/duplication-detection/scripts/score-statement-similarity.ts
   ```

   This is the slowest and most failure-prone step. If Gemini returns a 429 the script retries automatically using the server's `retryDelay`; if it gives up after 5 attempts, just rerun the same command and it will pick up from the cache. Done when you see `Wrote N pairs to ...statement-similarity.csv`.

   2c. Run the dryrun simulation (a few seconds, local only):

   ```
   deno run --allow-read --allow-write research/duplication-detection/scripts/dryrun-duplicate-detection.ts
   ```

   Done when you see `Wrote N merges to ...dryrun-merges.csv`.

3. Install the mini-app's dependencies and start it:

   ```
   cd research/duplication-detection
   npm install
   npm run dev
   ```

4. Open http://localhost:5174.

Steps 2 and 3 are independent of each other; step 2 takes a few minutes (mostly the embeddings call), step 3 is fast. After the first time, you only need to repeat step 2 if you want fresher data, and only `npm run dev` to bring the viewer back up.

## Layout

```
research/duplication-detection/
├── README.md                                       ← this file
├── automatic-duplicate-detection-feature-plan.md   ← design doc
├── package.json                                    ← mini-app deps (React, Vite, papaparse)
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx                                     ← the Similarity Explorer viewer
│   └── styles.css
├── scripts/
│   ├── extract-statements.ts                       ← Deno script
│   ├── score-statement-similarity.ts               ← Deno script
│   └── dryrun-duplicate-detection.ts               ← Deno script
└── public/
    └── data/                                       ← gitignored; scripts write here, Vite serves at /data/
```

## Running the viewer

From this directory:

```
cd research/duplication-detection
npm install
npm run dev
```

Vite serves on port 5174 (configured in `vite.config.ts` to avoid clashing with the main app on 5173). Open http://localhost:5174.

The viewer's "View" selector switches between **All pairs** (`statement-similarity.csv`) and **Dryrun merges** (`dryrun-merges.csv`). It reads CSVs from `public/data/`, which Vite serves at `/data/`.

## Generating data

The scripts read and write CSVs at `research/duplication-detection/public/data/` regardless of which directory you run them from. They resolve their own location via `import.meta.url`, so the data always lands inside this folder. The `.env` file at the **project root** holds the credentials.

Run from the project root (the script-path argument to `deno run` is resolved relative to your current directory, so the commands below assume CWD = project root):

### 1. Extract statements + topics from the live DB

```
deno run --allow-net --allow-env --allow-read --allow-write --env-file=.env research/duplication-detection/scripts/extract-statements.ts
```

Output: `research/duplication-detection/public/data/statements.csv` (columns: `room_id, topic, statement_id, statement_text, timestamp`).

Requires `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY`, `VITE_HEARD_API_SECRET`, `DEV_ADMIN_KEY` in the project-root `.env`. Hits `/admin/debates` and then `/room/:id` for every active room with 10-way concurrency. Expect ~30-60 seconds for ~800 rooms.

### 2. Generate embeddings + pairwise similarity

```
deno run --allow-net --allow-env --allow-read --allow-write --env-file=.env research/duplication-detection/scripts/score-statement-similarity.ts
```

Inputs: `statements.csv`. Outputs: `statement-embeddings.csv` (cache) and `statement-similarity.csv` (every within-room pair with cosine similarity), all under `research/duplication-detection/public/data/`.

Requires `GEMINI_API_KEY` in the project-root `.env`. Calls Gemini's `batchEmbedContents` with `gemini-embedding-001`, 100 statements per request.

The script is **resumable**: the embedding cache is rewritten after every successful batch, so a crash or transient API error mid-run loses at most one batch of work. Re-running picks up exactly where it left off and only embeds statements that aren't already cached. Transient Gemini errors (429, 5xx) are retried up to 5 times with exponential backoff (1s, 2s, 4s, 8s, 16s).

Expect a few minutes for a fresh embedding run of ~3,500 statements; subsequent runs after cache hits are nearly instant.

### 3. Simulate the cron over historical data

```
deno run --allow-read --allow-write research/duplication-detection/scripts/dryrun-duplicate-detection.ts
```

Inputs: `statements.csv` + `statement-embeddings.csv`. Output: `dryrun-merges.csv`. All under `research/duplication-detection/public/data/`.

Walks each room chronologically, applies the chain-following merge logic at the chosen threshold, and prints summary counts at thresholds 0.70-0.95. Override the threshold with `--threshold=0.85`.

Pure local arithmetic. Runs in seconds, no network, no API cost.

## Why is this self-contained?

The viewer was originally wired into the main app at `/similarity-explorer`. To eliminate any production-side dependency on this research tooling, the viewer was extracted into its own Vite project here. The main app has no knowledge of this directory; touching anything in here will not affect production builds, type-checks, or runtime behaviour.
