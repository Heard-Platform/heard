# LLM providers

How the Heard backend picks an LLM provider and how to give a specific feature its own override.

## Supported providers

All providers implement [`LlmClient`](../src/supabase/functions/server/llm-client.ts) with `complete()` and `completeJson()`:

- **Gemini** (default): [`GeminiClient`](../src/supabase/functions/server/gemini-client.ts), model `gemini-2.5-flash`. Env key: `GEMINI_API_KEY`.
- **Anthropic**: [`AnthropicClient`](../src/supabase/functions/server/anthropic-client.ts), model `claude-haiku-4-5-20251001`. Env key: `ANTHROPIC_API_KEY`.
- **OpenAI**: [`OpenAiClient`](../src/supabase/functions/server/openai-client.ts), model `gpt-4o-mini`. Env key: `OPENAI_API_KEY`.

The factory is [`createLlmClient`](../src/supabase/functions/server/llm-provider.ts), which consults [`getLlmProvider`](../src/supabase/functions/server/llm-provider.ts) to decide which provider to instantiate.

## Default selection

`getLlmProvider()` reads the `LLM_PROVIDER` env var. Valid values: `"gemini"`, `"anthropic"`, `"openai"`. If unset, defaults to `"gemini"`.

`LLM_PROVIDER` controls the provider for the shared pipelines that do not opt into their own selection. Today those are:

- Rant extraction in [`debate-api.tsx`](../src/supabase/functions/server/debate-api.tsx) (`POST /rant/extract`)
- Reddit import enrichment via [`EnrichmentService`](../src/supabase/functions/server/enrichment-service.ts)

## Per-feature overrides

A feature that wants its own provider selection, independent of `LLM_PROVIDER`, passes a different env var name to `getLlmProvider`:

```ts
const client = createLlmClient(getLlmProvider("SCHEDULING_LLM_PROVIDER"));
```

The same validation and fallback apply: if the named env var is unset, the feature falls back to `"gemini"`. This lets each feature pivot providers independently (e.g. keep rant extraction on Gemini while experimenting with Anthropic on scheduling) without cross-impact.

Use a per-feature env var when:

- The feature is being actively spiked and may need to swap providers to evaluate quality.
- The feature has quality or cost requirements distinct from the shared default.

Prefer `LLM_PROVIDER` otherwise, so there is one knob to turn.

## Registered per-feature env vars

| Env var | Feature | Added in |
| --- | --- | --- |
| `SCHEDULING_LLM_PROVIDER` | Event-page scheduling rant availability extraction | Branch `feat/scheduling-rant-extraction` |

Add a row here when introducing a new per-feature env var.
