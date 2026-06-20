# GGWash importer — dry-run harness

A no-publish harness for iterating on the GGWash importer's LLM prompts. It runs
the **real** two-stage flow — fetch the live RSS feed, Stage 1 selection, Stage 2
transform — using the actual server code, then writes a Markdown report. It never
calls `createRoom`/`saveStatement`, so nothing is published and no DB is touched.

It imports the real prompt code from
[`../../src/supabase/functions/server/ggwash-prompt-utils.ts`](../../src/supabase/functions/server/ggwash-prompt-utils.ts)
and the real scraper, so **editing a prompt there and re-running shows exactly how
the change affects each stage.**

## Setup

Install [Deno](https://deno.land/) (the server code is Deno):
`winget install DenoLand.Deno` (or `choco install deno`).

LLM keys are read from the **repo-root `.env`** automatically (default provider is
Gemini → `GEMINI_API_KEY`). To override just for the dry run, drop a gitignored
`.env` in this folder; it takes precedence over the root one.

## Run

From the repo root:

```
deno run -A --node-modules-dir=auto --no-lock research/ggwash-importer/dry-run.ts
```

The two extra flags exist because the repo's root `package.json` puts Deno in
node_modules mode: `--node-modules-dir=auto` lets it auto-install `rss-parser`,
and `--no-lock` keeps the repo's root `deno.lock` from being modified by the run.

Open the generated `dry-run-report.md` (use VS Code's Markdown preview to see the
images). It has three parts:

- **Summary:** the run's counts, which article would be published, and a
  consolidated list of every generated topic + seed statements — each marked
  🟢 (would be posted) / ☑️ (valid but ranked lower) / ⚪ (valid but not selected).
- **Articles — one row per article:** for each feed article, its outcome
  (would-publish / valid / rejected / auto-rejected roundup), Stage-1 verdict,
  image, the 200-char snippet Stage 1 ranked on, the full body sent to the
  transform, the raw LLM response, and the resulting Heard post.
- **Appendix — shared prompts:** the transform prompt (shown once — it is identical
  for every article) and the Stage 1 selection call with its raw ranking. The
  unselected articles are transformed too (so you can see what they would become)
  unless you set `GGWASH_SKIP_UNSELECTED=1`.

Without a key it still runs: it renders the articles, images, and prompts, leaving
the LLM responses blank. Good for inspecting prompt construction offline.

## The tweak-and-rerun loop

The first run caches the fetched feed to `dry-run-feed.json`. Later runs reuse it,
so a prompt edit is compared against **identical articles**. To pull fresh
articles, set `GGWASH_REFRESH=1` (or delete the cache).

Knobs (env or `.env`):

| Var | Effect |
|---|---|
| `LLM_PROVIDER` | `gemini` (default) \| `anthropic` \| `openai` |
| `GGWASH_REFRESH=1` | re-fetch the live feed instead of using the cache |
| `GGWASH_PERSONA="..."` | pin the transform persona (default: random per call) so prompt A/Bs aren't muddied by persona variance |
| `GGWASH_TRANSFORM_LIMIT=N` | transform only the top N ranked (saves LLM calls) |
| `GGWASH_SKIP_UNSELECTED=1` | skip transforming the candidates Stage 1 didn't rank |

## Notes

- Uses the real `gemini-2.5-flash` client at `temperature 0.7`, so outputs vary
  run to run; the feed cache keeps the *inputs* fixed.
- `NODE_ENV` is forced to `test` so the client's usage-logging DB write is skipped.
- This folder's `.env`, feed cache, and Markdown report are gitignored.
