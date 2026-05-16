# Public AI Usage Tracker

A public page that shows Heard's daily AI token usage over time, in service of a build-in-public stance.

## How it works (conceptual)

Every modern LLM API returns, alongside the generated content, a count of how many tokens the request and response used. The tracker hooks into that moment: whenever the application makes an AI call, the surrounding code reads those token counts and adds them to a running daily total for that provider. Those totals are kept in a single small table, one row per day per provider — there is no record of *what* was asked, only *how much*. A read-only public projection of that table is exposed so anyone on the internet can fetch the daily numbers, and a public page on the site reads those same numbers to render a chart. The full pipeline is transparent end-to-end: the writer is in the open-source codebase, the table's contents are publicly queryable, and the chart is just a view on top of them.

The design is deliberately one-way and append-only. Nothing in the pipeline can be edited from the public side, and the only data crossing the trust boundary is non-sensitive aggregates. Provider support is pluggable: each LLM provider needs its own small adapter to extract token counts from its response shape, but everything downstream — the storage, the projection, the chart — is provider-agnostic.

## In this codebase

- **Capture:** wrap `LlmClient` so Gemini's `usageMetadata` (prompt + candidate token counts) is read after each successful call.
- **Store:** Supabase table `ai_usage_daily(day, provider, input_tokens, output_tokens)` keyed on `(day, provider)`; upsert with sum-on-conflict.
- **Expose:** RLS-protected view filtered to Gemini, anon `SELECT` only — base table never reachable.
- **Render:** `/transparency` route in the Vite app reads the view via the existing Supabase client and draws a stacked-area chart with `recharts` (already a dep). The route uses its own minimal layout — no app nav, no auth chrome — so it reads as a public artifact, not part of the product. Header shows lifetime total, 7-day rolling, today-so-far. Footer links to the raw view as JSON and to the wrapper source.
- **Other providers:** Anthropic and OpenAI adapters present but throw "not implemented"; adding one later is a single-file change.

## Deliberately out of scope

- Estimated dollar cost.
- Per-model breakdown.
- Hourly granularity (daily only).
- Backfill of historical data — chart starts the day this ships.
- Non-Gemini providers (stubbed as "not implemented").

## Open questions

1. Do we record failed Gemini calls (4xx/5xx) as zero-token rows, or skip them entirely?
2. Should the Supabase write happen inline with each Gemini call (simpler, but adds ~50–150ms to every AI call and fails if Supabase is down), or run in the background so the AI call returns immediately (faster, but a crash mid-call can drop the row)?
