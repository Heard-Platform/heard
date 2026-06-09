# GGWash Importer: Implementation Plan

A complete plan for an implementing agent. Read this end to end before writing any code. Cross-reference with the flow diagram in this folder: [ggwash-import-flow.excalidraw](ggwash-import-flow.excalidraw).

## Context

[GGWash](https://ggwash.org/) (Greater Greater Washington) publishes daily articles about the DC area (urbanism, transit, housing, local policy) and exposes a public RSS feed at https://ggwash.org/rss. We want an automated way to turn that high-quality local content into Heard discussion posts so the DC community feed stays fresh without manual curation.

This is the structural sibling of the existing, built **Reddit importer**: fetch external content, transform it with an LLM into a Heard topic plus response statements, and create a Heard post. The new twist is a **two-stage LLM flow**: a daily run first asks the LLM to pick the single best article out of the day's feed (given a description of Heard and what makes a good discussion topic), then asks the LLM to convert that one article into a topic + 3 responses. The result auto-publishes to the feed exactly like a Reddit import.

Confirmed product decisions:
- **Auto-publish** directly to the feed (Reddit-style), no admin approval gate.
- **1 best post per day**: rank candidates, walk the ranked list, publish the first that survives the transform quality gate.
- **Standalone post, no source link** (no `DebateRoom` schema change; the article is inspiration only).
- **Target community: `washington-dc`**.

## Key findings from exploration

These shaped the design and remove the obvious gotchas up front:

1. **The full article body is already in the RSS feed.** The live feed has 10 `<item>`s, each with `<title>`, `<link>`, `<guid>` (a permalink URL), `<pubDate>`, `<dc:creator>`, and a CDATA `<description>` containing the **complete article HTML** (the longest seen was ~45,000 chars). There is no `<content:encoded>`. Implication: **no separate page-scrape is needed**. We strip the HTML and cap length before sending to the transform LLM.
2. **The "newsletter importer" was never built as an RSS importer.** The `email-newsletter-*.ts` / `newsletter-utils.ts` files send outbound email; [../newsletter-importer/newsletter-import-plan.md](../newsletter-importer/newsletter-import-plan.md) is an unbuilt plan. The only built importer to mirror is the **Reddit importer**.
3. **A processed-set is mandatory.** The feed shows the same ~10 articles for days, and this runs daily. Without dedup we would re-post the same article every morning. The `<guid>` permalink is the natural dedup key.
4. **GGWash is an advocacy publication.** Much of its content is call-to-action / local DC politics and "Breakfast links" roundups, all of which the transform disqualifier list is designed to reject. The selection stage is the first filter; the transform disqualifier list is the second. Both need GGWash-specific tuning.

## Reference reading (do this first)

1. [../../src/supabase/functions/server/reddit-import-service.ts](../../src/supabase/functions/server/reddit-import-service.ts) — `RedditImporter`. The GGWash importer mirrors its shape and its `createNewRoomData` + `createRoom` + `saveStatement` publish path (lines 72-98).
2. [../../src/supabase/functions/server/reddit-scraper-utils.ts](../../src/supabase/functions/server/reddit-scraper-utils.ts) — `getRedditPosts()` and its use of `scrapeRssToXml` + `npm:rss-parser`. The GGWash scraper mirrors this. Note `item.contentSnippet` gives HTML-stripped plain text.
3. [../../src/supabase/functions/server/ai-prompt-utils.ts](../../src/supabase/functions/server/ai-prompt-utils.ts) — `makeTransformPromptFromRedditPost()`. Study the `"Error"` sentinel, the disqualifier list, the Topic/Response rules, and the per-provider "CRITICAL REMINDERS" blocks. The GGWash transform prompt reuses all of these with a different disqualifier list.
4. [../../src/supabase/functions/server/enrichment-api.ts](../../src/supabase/functions/server/enrichment-api.ts) — the cron endpoint shape. **Do NOT copy the probability-skip or the 3am-7am ET skip** (lines 26-49); a 3-7am skip would actively break an early-morning run.
5. [../../src/supabase/functions/server/enrichment-service.ts](../../src/supabase/functions/server/enrichment-service.ts) — `EnrichmentService` base (provides `this.aiClient` / `this.provider`). Extend it.
6. [../../src/supabase/functions/server/kv-utils.tsx](../../src/supabase/functions/server/kv-utils.tsx) — `getDebateEndedEmailSent` / `saveDebateEndedEmailSent` (lines 457-462) are the boolean-flag pattern for the processed-set; `getByPrefixParsed` / `getParsedKvData` / `upsert` are the generic helpers.
7. [../../src/supabase/functions/server/index.tsx](../../src/supabase/functions/server/index.tsx) — how `enrichmentApi` is imported/routed and how `enrichment/*` inherits `validateCronAuth`. The new route lives under that prefix to inherit auth.
8. [../../src/supabase/functions/server/room-utils.ts](../../src/supabase/functions/server/room-utils.ts) — `createNewRoomData()`.
9. [../../src/supabase/functions/server/route-wrapper.tsx](../../src/supabase/functions/server/route-wrapper.tsx) — wrap the endpoint with `defineRoute`.

## Reuse map

| Layer | What | Where |
|---|---|---|
| Reuse as-is | LLM provider abstraction | `createLlmClient`, `getLlmProvider` in [llm-provider.ts](../../src/supabase/functions/server/llm-provider.ts) (via `EnrichmentService`) |
| Reuse as-is | RSS fetch | `scrapeRssToXml` in [scraper-utils.ts](../../src/supabase/functions/server/scraper-utils.ts) + `npm:rss-parser` |
| Reuse as-is | Persona randomization | `getRandomPersona` in [personas.tsx](../../src/supabase/functions/server/personas.tsx) |
| Reuse as-is | Cron auth | `validateCronAuth` (auto-applied to `enrichment/*`) |
| Reuse as-is | Route validation | `defineRoute` |
| Reuse as-is | Post creation | `createNewRoomData`, `createRoom`, `saveStatement` |
| Reuse as-is | KV helpers | `getParsedKvData`, `upsert`, the boolean-flag pattern |
| Reuse as-is | Usage logging | `complete(prompt, { endpoint })` already records usage |
| Extract + reuse (DRY) | Shared Topic/Response rules + provider reminders | New `discussion-prompt-rules.ts`, consumed by both the Reddit and GGWash transform prompts (see "Clean Code" note) |
| Adapt | Transform prompt | New `makeTransformPromptFromGGWashArticle` with GGWash disqualifiers |
| New | Selection prompt | `makeGGWashSelectionPrompt` (titles → ranked indices or `None`) |
| New | RSS scraper | `ggwash-scraper-utils.ts` |
| New | Importer service | `GGWashImporter` in `ggwash-import-service.ts` |
| New | Processed-set helpers | `isGGWashProcessed`, `markGGWashProcessed` |
| New | Cron endpoint | `POST /make-server-f1a393b4/enrichment/ggwash-import/run` |

## Data model

No `DebateRoom` schema change (standalone posts). Add an internal type to [types.tsx](../../src/supabase/functions/server/types.tsx):

```ts
export interface GGWashArticle {
  title: string;
  body: string;        // HTML-stripped, truncated to MAX_ARTICLE_CHARS
  url: string;         // <link>
  guid: string;        // <guid> permalink; the processed-set key
  publishedAt: number;
}
```

KV key (new), boolean-flag pattern mirroring `getDebateEndedEmailSent` / `saveDebateEndedEmailSent`:

| Key pattern | Value | Helpers (in [kv-utils.tsx](../../src/supabase/functions/server/kv-utils.tsx)) |
|---|---|---|
| `ggwash-processed:${guid}` | `"true"` sentinel | `isGGWashProcessed(guid)`, `markGGWashProcessed(guid)` |

**Processed-set semantics** (deliberate): mark an article processed only when we (a) publish it, or (b) selected it and the transform returned `Error`. Articles that simply weren't the best today are **not** marked, so they stay eligible on future days as fresher rivals age out of the feed. This avoids permanently burning good-but-not-today articles while preventing repeated re-failure of bad ones.

## Two-stage flow

`GGWashImporter.runOnce(): Promise<{ posted: number; considered: number; skipped: number }>`:

1. `fetchGGWashArticles()` → up to 10 articles.
2. Filter out `isGGWashProcessed(guid)`. `considered` = remaining count. If 0, return early.
3. **Stage 1 — Selection.** One LLM call: `makeGGWashSelectionPrompt(articles)`. The prompt includes a short description of Heard and what makes a good discussion topic, then the numbered titles. The LLM returns a **ranked, comma-separated list of article indices** (best first), or the sentinel `None`. Parse leniently (extract integers, clamp to valid range, dedupe). `None`/empty → `posted: 0`, return.
4. **Stage 2 — Transform, walking the ranked list.** For each candidate index in order, up to `TARGET_POSTS_PER_RUN` successful posts:
   - One LLM call: `makeTransformPromptFromGGWashArticle(article, provider)`.
   - If the response trims to `Error`: `markGGWashProcessed(guid)`, `skipped++`, continue.
   - Else parse: line 1 = topic, remaining non-empty lines = statements. Validate `MIN_STATEMENTS..MAX_STATEMENTS`; if out of range, treat as `Error` (mark processed, skip).
   - Else publish: `createNewRoomData({ topic, participants: [], hostId: IMPORTER_AUTHOR, subHeard: DEFAULT_SUBHEARD, endTime: Date.now() + ONE_WEEK_MS, allowAnonymous: true })`, `createRoom`, `saveStatement` per statement (author `IMPORTER_AUTHOR`, round 1). `markGGWashProcessed(guid)`, `posted++`.
   - When `posted === TARGET_POSTS_PER_RUN` (1), stop.
5. Return `{ posted, considered, skipped }`.

Both LLM calls pass a distinct `endpoint` tag to `complete()` (`ggwash-select`, `ggwash-transform`) so usage logging separates the two.

## LLM prompts

### Selection prompt (`makeGGWashSelectionPrompt`)
- **System:** Heard is a place for short, open-ended, experience-based discussions; a good topic is evergreen, invites personal perspective (not analysis), and is not breaking news, not a call to action, and not about named individuals.
- **User:** numbered list of titles; instruction to return the indices of the articles best suited to become a Heard discussion, **ranked best-first, comma-separated, indices only**, or the single word `None` if none fit. Explicitly deprioritize "Breakfast links" / link-roundup digests (not single-topic).
- Constants: `HEARD_DESCRIPTION`, `SELECTION_NONE_SENTINEL = "None"`.

### Transform prompt (`makeTransformPromptFromGGWashArticle`)
Mirrors `makeTransformPromptFromRedditPost` exactly (same `Error` sentinel, same Topic rules, same Response rules, same per-provider reminder blocks), substituting a **GGWash-specific disqualifier list**: advocacy / call-to-action; local political figures/events/legislation; specific crime/accident; "Breakfast links" or any multi-link roundup; box-office/market/sports-score/weather pure-data items; reviews of a specific media title; content primarily about named real people. Request **3 responses** (accept `MIN_STATEMENTS..MAX_STATEMENTS`). The article body is the HTML-stripped, length-capped text.

## API endpoint

`POST /make-server-f1a393b4/enrichment/ggwash-import/run`
- Inherits `validateCronAuth` from the `enrichment/*` prefix (uses `x-cron-secret`).
- No required body params. Wrap with `defineRoute`. Calls `new GGWashImporter().runOnce()`.
- Returns `{ posted, considered, skipped }`.
- New file `ggwash-import-api.ts`; wire into [index.tsx](../../src/supabase/functions/server/index.tsx) the same way `enrichmentApi` is.

## Backend file map

New files (all under `src/supabase/functions/server/`):
- `ggwash-scraper-utils.ts` — `fetchGGWashArticles()`.
- `ggwash-prompt-utils.ts` — `makeGGWashSelectionPrompt`, `makeTransformPromptFromGGWashArticle`, exported constants.
- `discussion-prompt-rules.ts` — extracted shared Topic/Response rule blocks + provider reminders (see Clean Code note).
- `ggwash-import-service.ts` — `GGWashImporter extends EnrichmentService`.
- `ggwash-import-api.ts` — the cron endpoint.

Existing files to modify:
- `types.tsx` — add `GGWashArticle`.
- `kv-utils.tsx` — add `isGGWashProcessed` / `markGGWashProcessed`.
- `ai-prompt-utils.ts` — consume the extracted shared rule constants (behavior-preserving; see note).
- `index.tsx` — import/route `ggwashImportApi`.

### Implementation order
1. Types. 2. KV processed-set helpers. 3. Scraper. 4. Extract shared rules + GGWash prompts. 5. Service. 6. Endpoint + wiring.

### Key constants (no magic numbers/strings)
- `GGWASH_RSS_URL = "https://ggwash.org/rss"`
- `MAX_ARTICLE_CHARS = 8000` (transform body cap, token control)
- `TARGET_POSTS_PER_RUN = 1`
- `DEFAULT_SUBHEARD = "washington-dc"`
- `IMPORTER_AUTHOR = "enrichment-service"` (matches Reddit imports)
- `LLM_ERROR_SENTINEL = "Error"`, `SELECTION_NONE_SENTINEL = "None"`
- `MIN_STATEMENTS = 2`, `MAX_STATEMENTS = 3`
- `SELECT_ENDPOINT = "ggwash-select"`, `TRANSFORM_ENDPOINT = "ggwash-transform"`
- `GGWASH_PROCESSED_PREFIX = "ggwash-processed:"`

## Externalities / gotchas (and how this plan handles them)

- **Full HTML body, up to ~45k chars.** Strip HTML (use `rss-parser` `contentSnippet`) and truncate to `MAX_ARTICLE_CHARS` before the transform call. Controls token cost and latency.
- **Daily re-posting.** Processed-set keyed on `<guid>` permalink, marked on publish or transform-failure (semantics above).
- **Advocacy / local-politics content.** Two-layer filter: selection stage + GGWash-tuned transform disqualifiers. "Breakfast links" roundups explicitly excluded.
- **Do not inherit the enrichment scheduler quirks.** No probability-skip, no 3am-7am ET skip (would break an early-morning run). This run is deterministic; the external scheduler decides timing.
- **No in-repo scheduler.** Like the other crons, scheduling lives outside the repo. Leave a PR note: daily early-morning run (e.g. `0 6 * * *` ET, converted to the scheduler's TZ), `POST`, header `x-cron-secret: <CRON_SECRET>`. DST is the scheduler's concern.
- **Two LLM calls per run.** Tagged distinctly for usage logging; one selection (cheap, titles only) + one-or-few transforms.
- **Idempotency.** Re-running the endpoint is safe (processed-set). Concurrent double-fire is unlikely and at worst risks one duplicate; acceptable, not engineered against.
- **Dry days.** If selection returns `None` or every candidate transforms to `Error`, the run posts nothing. That is correct behavior, not an error.

## Clean Code (Uncle Bob) notes

- **SRP / one level of abstraction:** scraper (fetch), prompt-utils (prompt construction), service (orchestration), api (HTTP). Mirrors the Reddit importer's separation.
- **DRY — shared prompt rules:** the Topic rules, Response rules, and per-provider reminder blocks are ~40 identical lines shared by the Reddit and GGWash transform prompts. The Clean-Code-correct move is to extract them once into `discussion-prompt-rules.ts` and have both prompts consume them, rather than duplicate. This touches the pre-existing `ai-prompt-utils.ts`, so the change is strictly behavior-preserving and guarded: capture the Reddit prompt string before and after the refactor and assert it is byte-identical (the existing Reddit test exercises prompt construction). If you would rather not touch the Reddit file in this PR, the fallback is to duplicate the rule blocks in the GGWash prompt and extract later; this plan recommends the extraction.
- **Intention-revealing names, small functions, named constants** throughout; no magic values.
- **No defensive handling of impossible cases** (trust `generateId`, etc.). The `Error`/`None` sentinels and statement-count check are real input validation of LLM output, not defensive cruft.
- TypeScript strict, no `any`. No code comments unless the "why" is non-obvious.

## Verification

1. **Build + typecheck.** `npm run build` / `tsc --noEmit`. Fix errors first.
2. **Manual run.** `curl -X POST http://localhost:<port>/make-server-f1a393b4/enrichment/ggwash-import/run -H "x-cron-secret: <secret>"`. Confirm `{ posted, considered, skipped }`.
3. **Post created.** Confirm a new room in `washington-dc` with the generated topic and 3 statements (author `enrichment-service`). Confirm `ggwash-processed:<guid>` exists for the published article.
4. **Dedup.** Re-run immediately. Confirm the just-published article is not reconsidered and no duplicate post appears.
5. **Quality gate.** Confirm a "Breakfast links" item is either not selected, or transforms to `Error` (counted in `skipped`, marked processed, no post).
6. **Dry path.** Force a feed where selection returns `None` (or all unprocessed are roundups). Confirm `posted: 0` and nothing marked processed for non-attempted articles.
7. **Reddit prompt unchanged.** After the shared-rules extraction, confirm the Reddit prompt string is byte-identical (Reddit importer still produces the same prompt/output).

## Out of scope (deliberately deferred)

- Admin approval gate / editing UI (chose auto-publish).
- Source attribution / linking + any `DebateRoom` schema change (chose standalone).
- Generalizing into a multi-feed newsletter importer (separate effort; this is GGWash-specific).
- Cross-source dedup against Reddit-imported posts.
- Scheduled/future publishing.
- An on/off config flag like `EnrichmentConfig`. The external scheduler controls timing; to pause, disable the cron entry. (Add an internal-var kill switch later only if operationally needed.)

## References
- Flow diagram: [ggwash-import-flow.excalidraw](ggwash-import-flow.excalidraw) in this folder.
- Sibling built importer: [../../src/supabase/functions/server/reddit-import-service.ts](../../src/supabase/functions/server/reddit-import-service.ts).
- Unbuilt sibling plan: [../newsletter-importer/newsletter-import-plan.md](../newsletter-importer/newsletter-import-plan.md).
