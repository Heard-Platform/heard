# Scheduling rant availability extraction

> Status: spike. See [llm-providers.md](llm-providers.md) for the provider-selection pattern this uses.

First LLM call in the event-page scheduling flow (diagram in [event-page-flow.excalidraw](event-page-flow.excalidraw)): take a participant's free-form rant about their availability and return structured JSON covering both resolvable dates and mentions the LLM declined to pin down.

## Shape

Types live in [availability-prompt-utils.ts](../src/supabase/functions/server/availability-prompt-utils.ts):

- `resolved[]`: concrete dates with `availability` (`available` / `unavailable` / `preferred` / `tentative`), optional `timeRange`, `confidence` (`high` / `medium` / `low`), and a verbatim `sourceQuote`.
- `ambiguous[]`: mentions too vague to pin down, with a `reason` and `sourceQuote`.
- `referenceDate`: echoed back so output is interpretable without the prompt.

## Provider findings (spike, 7-rant corpus)

- **Gemini 2.5 Flash**: accurate date arithmetic, appropriate confidence calibration, enumerates days covered by vague ranges. Production default (`SCHEDULING_LLM_PROVIDER=gemini`).
- **Claude Haiku 4.5**: accurate, more conservative (prefers `ambiguous` for "most of next week"). Good fallback.
- **gpt-4o-mini**: unfit. Wrong day-of-week arithmetic ("Next Wednesday" returned this week's Wednesday; "Thursday of first week of May" returned a Monday), dropped extractions entirely on the negative-only rant, over-confident on interpretive calls. Do not ship with this model.

## Open questions

- **Enumeration of vague ranges.** For "free most of next week" Gemini enumerates Tue-Sun, Claude routes to `ambiguous`. Defer until the synthesis call is in place and we know how downstream consumes these entries.
- **`available` vs `preferred`.** Definitions still drift across providers on phrases like "works though". Tighten if cross-provider consistency matters at ship time.

## Running the test corpus

From [src/supabase/functions/server/](../src/supabase/functions/server/):

```bash
RUN_AVAILABILITY_LLM_TESTS=1 deno test \
  --allow-env --allow-net \
  --env-file=../../../../.env \
  [--filter=Gemini] \
  availability-extraction-test.tsx
```

Drop the filter to run all three providers. Full suite costs well under $0.10 per run.
