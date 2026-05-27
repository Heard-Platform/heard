# Log every external LLM API call to Supabase

## Context

The codebase makes external LLM calls through three swappable providers (OpenAI, Anthropic, Gemini), all routed through [src/supabase/functions/server/](src/supabase/functions/server/). Each provider's JSON response already contains token usage data, but every client currently discards it and returns only the string content. We want a persistent record of every call (timestamp + token counts + provider/model + calling user + endpoint) so we can later analyze cost, debug runaway usage, and attribute consumption per provider and per feature.

## Approach (Template Method)

Adopt the Template Method pattern so that "every LLM call gets logged" is enforced by an abstract base class, while provider-specific HTTP and token-extraction stays in each concrete subclass, and persistence lives in its own module. This satisfies ISP (the public `LlmClient` interface stays narrow), SRP (each layer owns one concern), DRY (insert plumbing exists once), and keeps provider response shapes from leaking across the abstraction boundary.

Layering:

```
LlmClient (interface)            public contract: complete, completeJson
  └─ BaseLlmClient (abstract)    template method: calls callApi then recordLlmUsage
       ├─ OpenAiClient           implements callApi
       ├─ AnthropicClient        implements callApi
       └─ GeminiClient           implements callApi

llm-usage-logger.ts (module)     persistence: recordLlmUsage + named constants
```

Decisions captured (from clarifying questions):
- Store input + output + total tokens, plus provider, model, userId (nullable), endpoint.
- Fire-and-forget insert (not awaited); accept that some rows may be dropped on edge-function teardown.
- Skip insert when `NODE_ENV === "test"` to avoid test pollution.
- Failed LLM calls (non-OK HTTP response) are intentionally NOT logged.

## Files to create

### `supabase/migrations/20260527000000_create_llm_api_calls.sql`

Match the column-naming convention in existing tables ([supabase/migrations/20260421000000_create_analytics_events.sql](supabase/migrations/20260421000000_create_analytics_events.sql), [supabase/migrations/20260423000000_create_votes.sql](supabase/migrations/20260423000000_create_votes.sql)): snake_case table name, quoted camelCase columns, `uuid` primary key, `timestamp with time zone default now()`.

```sql
create table if not exists llm_api_calls (
  id uuid primary key default gen_random_uuid(),
  "createdAt" timestamp with time zone default now(),
  provider text not null,
  model text not null,
  "userId" text,
  endpoint text not null,
  "inputTokens" int not null,
  "outputTokens" int not null,
  "totalTokens" int not null
);

create index if not exists llm_api_calls_created_at_idx on llm_api_calls ("createdAt");
create index if not exists llm_api_calls_provider_idx on llm_api_calls (provider);
create index if not exists llm_api_calls_user_id_idx on llm_api_calls ("userId");
create index if not exists llm_api_calls_endpoint_idx on llm_api_calls (endpoint);
```

Apply via the Supabase dashboard SQL editor (same workflow as existing migrations; the repo has no local CLI setup).

### `src/supabase/functions/server/llm-usage-logger.ts`

Owns the persistence concern and the magic strings around it. Becomes the sole home of the `LlmProvider` type (currently double-declared in [llm-provider.ts:9](src/supabase/functions/server/llm-provider.ts#L9); see the modification section below). Uses the existing `insert` helper from [src/supabase/functions/server/db-utils.ts](src/supabase/functions/server/db-utils.ts).

```ts
import process from "node:process";
import { insert } from "./db-utils.ts";

const LLM_API_CALLS_TABLE = "llm_api_calls";
const TEST_ENV = "test";

export type LlmProvider = "openai" | "anthropic" | "gemini";

export interface NormalizedUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface LlmUsageRecord extends NormalizedUsage {
  provider: LlmProvider;
  model: string;
  userId?: string;
  endpoint: string;
}

export const recordLlmUsage = (record: LlmUsageRecord): void => {
  if (process.env.NODE_ENV === TEST_ENV) return;
  void insert(LLM_API_CALLS_TABLE, record).catch(
    (err) => console.error("llm-usage-logger: insert threw", err),
  );
};
```

The record's keys match the column names exactly, and Supabase's JS client omits `undefined` from the request body, so the optional `userId` correctly produces a NULL row when absent — no manual reshape needed.

## Files to modify

### [src/supabase/functions/server/llm-client.ts](src/supabase/functions/server/llm-client.ts)

Replace the existing file with:

```ts
import { AiPrompt } from "./types.tsx";
import {
  LlmProvider,
  NormalizedUsage,
  recordLlmUsage,
} from "./llm-usage-logger.ts";

export interface LlmCallContext {
  userId?: string;
  endpoint: string;
}

export interface LlmClient {
  complete(prompt: AiPrompt, context: LlmCallContext): Promise<string>;
  completeJson(prompt: AiPrompt, context: LlmCallContext): Promise<string>;
}

export interface LlmApiResult {
  content: string;
  usage: NormalizedUsage;
}

export abstract class BaseLlmClient implements LlmClient {
  protected abstract readonly provider: LlmProvider;
  protected abstract readonly model: string;

  async complete(prompt: AiPrompt, context: LlmCallContext): Promise<string> {
    return this.run(prompt, false, context);
  }

  async completeJson(prompt: AiPrompt, context: LlmCallContext): Promise<string> {
    return this.run(prompt, true, context);
  }

  protected abstract callApi(prompt: AiPrompt, json: boolean): Promise<LlmApiResult>;

  private async run(
    prompt: AiPrompt,
    json: boolean,
    context: LlmCallContext,
  ): Promise<string> {
    const { content, usage } = await this.callApi(prompt, json);
    recordLlmUsage({
      provider: this.provider,
      model: this.model,
      userId: context.userId,
      endpoint: context.endpoint,
      ...usage,
    });
    return content;
  }
}
```

Notes:
- `LlmClient` (the public contract) stays at two methods, satisfying ISP.
- `BaseLlmClient` owns the template; concrete subclasses only implement `callApi`. There is no path through the base class that skips `recordLlmUsage`.
- A mock client in tests can still implement `LlmClient` directly without inheriting `BaseLlmClient` — this is the intended escape hatch.

### [src/supabase/functions/server/openai-client.ts](src/supabase/functions/server/openai-client.ts)

Convert from interface implementation to base-class subclass. Hoist the model string (matches the existing pattern in [gemini-client.ts:5](src/supabase/functions/server/gemini-client.ts#L5)). Rename `request` to `callApi`, change its return type to `LlmApiResult`, and have it map OpenAI's `usage` block to `NormalizedUsage`.

Key changes in the file:
- Add `const MODEL = "gpt-4o-mini";` at module scope.
- `export class OpenAiClient extends BaseLlmClient` with explicitly-typed fields: `protected readonly provider: LlmProvider = "openai";` and `protected readonly model: string = MODEL;`. Import `LlmProvider` from `./llm-usage-logger.ts`.
- The existing constructor must call `super()` as its first statement before validating `OPENAI_API_KEY`.
- Drop `complete` / `completeJson` (inherited).
- Rename private `request` to protected `callApi`; change return to `LlmApiResult`; at the end, return `{ content, usage: { inputTokens: data.usage?.prompt_tokens ?? 0, outputTokens: data.usage?.completion_tokens ?? 0, totalTokens: data.usage?.total_tokens ?? 0 } }`.
- All existing inline values (temperature, max_tokens, the chat URL) are pre-existing; leave them as-is to avoid drifting into untouched code.

### [src/supabase/functions/server/anthropic-client.ts](src/supabase/functions/server/anthropic-client.ts)

Same pattern as OpenAI:
- Add `const MODEL = "claude-haiku-4-5-20251001";`.
- Extend `BaseLlmClient` with explicitly-typed fields: `protected readonly provider: LlmProvider = "anthropic";` and `protected readonly model: string = MODEL;`. Import `LlmProvider` from `./llm-usage-logger.ts`.
- The existing constructor must call `super()` as its first statement before validating `ANTHROPIC_API_KEY`.
- Drop `complete` / `completeJson`; rename `request` to `callApi`.
- Anthropic returns separate input/output counts and (when prompt caching is enabled) additional `cache_creation_input_tokens` / `cache_read_input_tokens`, and no `total_tokens`. Sum all four input variants and compute the total:

```ts
const usage = data.usage ?? {};
const inputTokens =
  (usage.input_tokens ?? 0) +
  (usage.cache_creation_input_tokens ?? 0) +
  (usage.cache_read_input_tokens ?? 0);
const outputTokens = usage.output_tokens ?? 0;
return {
  content,
  usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
};
```

### [src/supabase/functions/server/gemini-client.ts](src/supabase/functions/server/gemini-client.ts)

Already has `const MODEL` at line 5, reuse.
- Extend `BaseLlmClient` with explicitly-typed fields: `protected readonly provider: LlmProvider = "gemini";` and `protected readonly model: string = MODEL;`. Import `LlmProvider` from `./llm-usage-logger.ts`.
- The existing constructor must call `super()` as its first statement before validating `GEMINI_API_KEY`.
- Drop `complete` / `completeJson`; rename `request` to `callApi`.
- Map `data.usageMetadata` to `NormalizedUsage`:

```ts
const usage = data.usageMetadata ?? {};
return {
  content,
  usage: {
    inputTokens: usage.promptTokenCount ?? 0,
    outputTokens: usage.candidatesTokenCount ?? 0,
    totalTokens: usage.totalTokenCount ?? 0,
  },
};
```

### [src/supabase/functions/server/llm-provider.ts](src/supabase/functions/server/llm-provider.ts)

Remove the local declaration of `LlmProvider` (line 9) and import it from `./llm-usage-logger.ts` instead. This eliminates the duplicate type definition and gives the codebase a single source of truth.

```ts
import { LlmProvider } from "./llm-usage-logger.ts";
```

(All existing uses of `LlmProvider` in this file continue to work unchanged.)

### [src/supabase/functions/server/debate-api.tsx](src/supabase/functions/server/debate-api.tsx) (around lines 789-805)

Read userId from the Hono context (the auth middleware at [index.tsx:87-102](src/supabase/functions/server/index.tsx#L87-L102) populates it from `X-Session-Id`) and pass context. Define the endpoint as a named constant at module scope:

```ts
const RANT_EXTRACT_ENDPOINT = "/rant/extract";
```

In the handler:

```ts
const userId = c.get("userId");
const aiClient = createLlmClient();
const prompt = makeRantExtractionPrompt(rant);
const content = await aiClient.completeJson(prompt, {
  userId,
  endpoint: RANT_EXTRACT_ENDPOINT,
});
```

No frontend change needed: every `api.tsx` request already attaches `X-Session-Id` via [api-client.ts:49-51](src/utils/api-client.ts#L49-L51). For anonymous calls userId is undefined and the row's `"userId"` column ends up NULL.

### [src/supabase/functions/server/reddit-import-service.ts](src/supabase/functions/server/reddit-import-service.ts) (line 40)

Define the endpoint as a named constant at module scope:

```ts
const REDDIT_IMPORT_ENDPOINT = "reddit-import";
```

Update the call site:

```ts
const aiResponse = await this.aiClient.complete(aiPrompt, {
  endpoint: REDDIT_IMPORT_ENDPOINT,
});
```

### Manual test scripts

[src/supabase/functions/server/rant-extraction-test.tsx](src/supabase/functions/server/rant-extraction-test.tsx) and [src/supabase/functions/server/reddit-import-test.tsx](src/supabase/functions/server/reddit-import-test.tsx) construct real provider clients and make real API calls. Each must:

1. Set `process.env.NODE_ENV = "test";` at the very top (before any imports of provider clients) so `recordLlmUsage` short-circuits.
2. Pass a context arg to each `complete()` / `completeJson()` call to satisfy the new signature. A named local constant in each file: `const TEST_ENDPOINT = "test:rant-extraction"` (or `"test:reddit-import"`), reused at every call site.

## Externalities consciously deferred

- **Fire-and-forget reliability**: Deno edge isolates can be torn down before the unawaited `insert` promise resolves. Accepted; dropped-row rate at current traffic expected to be negligible.
- **No retention/TTL**: the table grows unbounded. Acceptable for now.
- **No request-level correlation ID**: can't link a row to a specific HTTP request. Acceptable for now.
- **Failed LLM calls aren't logged**: `callApi` throws on `!response.ok` before returning, so `recordLlmUsage` is never reached. Accepted.
- **NODE_ENV guard depends on caller environment**: the two manual test scripts set `process.env.NODE_ENV = "test"` at their tops, which is sufficient today. If a future automated test file (e.g. a `.test.tsx`) starts exercising a real `LlmClient`, the test runner must also have `NODE_ENV=test` in its environment, or those runs will pollute `llm_api_calls`. Most JS test runners set this by default, but worth keeping in mind.

## Verification

1. Apply the migration via the Supabase dashboard SQL editor.
2. Confirm TypeScript compiles. If a provider client wasn't updated to extend `BaseLlmClient`, or a call site wasn't updated to pass `LlmCallContext`, this is where it fails.
3. Trigger a rant extraction end-to-end from the running app while signed in. This routes through `BaseLlmClient.completeJson` → concrete `callApi` → `recordLlmUsage`.
4. In the Supabase dashboard, run `select * from llm_api_calls order by "createdAt" desc limit 5;` — confirm a new row with non-zero `inputTokens` / `outputTokens` / `totalTokens`, the correct provider/model, the signed-in user's id in `"userId"`, and `endpoint = '/rant/extract'`.
5. Repeat the rant extraction while signed out. Confirm the row has `"userId" IS NULL`.
6. Cycle `LLM_PROVIDER` through `openai`, `anthropic`, `gemini` and repeat. For Anthropic, double-check `totalTokens === inputTokens + outputTokens` and that the row appears even though Anthropic's response has no `total_tokens` field.
7. Run one of the manual test scripts (e.g. `deno run ... rant-extraction-test.tsx`) and confirm NO new rows appear in `llm_api_calls` (NODE_ENV guard works).
8. Trigger the Reddit importer and confirm a row appears with `endpoint = 'reddit-import'` and `"userId" IS NULL`.
9. Confirm fire-and-forget behavior: in the edge function logs, the LLM response returns before any Supabase insert log appears.
