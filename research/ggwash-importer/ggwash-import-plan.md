# GGWash Importer: Implementation Plan (as built)

This feature is **implemented and tested**. The code lives under `src/supabase/functions/server/` (files listed below). This doc is the design of record; cross-reference the flow diagram: [ggwash-import-flow.excalidraw](ggwash-import-flow.excalidraw).

> Changes made *after* this as-built plan was written (a later prompt-tuning + tooling pass) are listed under [Changes after the initial implementation](#changes-after-the-initial-implementation), kept separate so the original design stays distinguishable from subsequent edits.

## Context

[GGWash](https://ggwash.org/) (Greater Greater Washington) publishes daily articles about DC and exposes a public RSS feed at https://ggwash.org/rss. The importer turns that content into Heard discussion posts so the DC feed stays fresh without manual curation.

It is the structural sibling of the built **Reddit importer** (fetch → LLM transform → create a Heard post), with a **two-stage LLM flow**: a daily run first asks the LLM to pick the best DC articles out of the day's feed, then converts the top survivor into a topic + 3 responses. The result auto-publishes, with the article's lead image, exactly like a Reddit import.

Confirmed product decisions:
- **Auto-publish** directly to the feed (Reddit-style), no admin approval gate.
- **1 best post per day**: rank candidates, walk the ranked list, publish the first that survives the transform gate.
- **Permissive selection, DC-only.** Allow hot/timely topics, news, named people, and calls to action; exclude only benign/informational items, link roundups, and anything not focused on the District of Columbia itself (drop mixed DC+MD/VA pieces).
- **Hotlinked image** from the article onto the post.
- **Store every scraped article** (chosen or not) for later review of the LLM's choices.
- **Target community: `washington-dc`**, standalone post (no source link, no `DebateRoom` schema change).

## Key findings from exploration

1. **The full article body is already in the RSS feed.** 10 `<item>`s, each with `<title>`, `<link>`, `<guid>` (permalink), `<pubDate>`, `<dc:creator>`, and a CDATA `<description>` of complete article HTML (up to ~45k chars). No separate page-scrape needed; `rss-parser` gives `contentSnippet` (HTML-stripped) and `content` (raw HTML, used for image extraction).
2. **Images can be hotlinked.** The app renders `room.imageUrl` via a plain `<img src>` with no allowlist/proxy/validation ([RoomCard.tsx](../../src/components/RoomCard.tsx), [CoverCard.tsx](../../src/components/room/CoverCard.tsx)). Every GGWash article opens with `<figure><img src="https://ggwash.org/...">`.
3. **A dedup store is mandatory.** The feed shows the same ~10 articles for days; a daily run would otherwise re-post them. Keyed on `<guid>`.
4. **GGWash's "Breakfast links" roundup has a fixed title prefix.** The LLM is tempted by its substantive DC content, so it is excluded deterministically in code rather than by prompt.
5. **`completeJson` returns a raw string**, parsed via `JSON.parse(stripMarkdownFences(content))` in a try/catch ([debate-api.tsx](../../src/supabase/functions/server/debate-api.tsx) ~811-839). The selection parser mirrors this.

## Reference reading

1. [reddit-import-service.ts](../../src/supabase/functions/server/reddit-import-service.ts) — `RedditImporter`; the publish path (`createNewRoomData` + `createRoom` + `saveStatement`) the GGWash importer mirrors.
2. [reddit-scraper-utils.ts](../../src/supabase/functions/server/reddit-scraper-utils.ts) — `scrapeRssToXml` + `npm:rss-parser` usage.
3. [ai-prompt-utils.ts](../../src/supabase/functions/server/ai-prompt-utils.ts) — `makeTransformPromptFromRedditPost()`, the `Error` sentinel and per-provider "CRITICAL REMINDERS" pattern. **Reference only; this file is NOT modified** (GGWash's rules diverge, so its prompt is self-contained).
4. [enrichment-api.ts](../../src/supabase/functions/server/enrichment-api.ts) — cron endpoint shape. **The probability-skip and 3am-7am ET skip are deliberately NOT copied.**
5. [enrichment-service.ts](../../src/supabase/functions/server/enrichment-service.ts) — `EnrichmentService` base (`this.aiClient` / `this.provider`).
6. [kv-utils.tsx](../../src/supabase/functions/server/kv-utils.tsx) — `getParsedKvData` / `upsert` / `getByPrefixParsed` generic helpers.
7. [index.tsx](../../src/supabase/functions/server/index.tsx) — `enrichment/*` inherits `validateCronAuth` (Hono trailing `*` matches the nested route).
8. [debate-api.tsx](../../src/supabase/functions/server/debate-api.tsx) (~811-839) — `completeJson` + `stripMarkdownFences` parse pattern. `stripMarkdownFences` is in [rant-prompt-utils.ts](../../src/supabase/functions/server/rant-prompt-utils.ts).
9. [reddit-import-test.tsx](../../src/supabase/functions/server/reddit-import-test.tsx) — `jsr:@std/testing/bdd` test layout mirrored by `ggwash-import-test.tsx`.

## Reuse map

| Layer | What | Where |
|---|---|---|
| Reuse as-is | LLM client + provider | `createLlmClient` (via `EnrichmentService`); `complete` / `completeJson` record usage automatically |
| Reuse as-is | RSS fetch | `scrapeRssToXml` (sends a browser User-Agent) + `npm:rss-parser` |
| Reuse as-is | Persona randomization | `getRandomPersona` in [personas.tsx](../../src/supabase/functions/server/personas.tsx) |
| Reuse as-is | Cron auth | `validateCronAuth` (auto-applied to `enrichment/*`) |
| Reuse as-is | Route validation | `defineRoute` |
| Reuse as-is | Post creation | `createNewRoomData` (accepts `imageUrl`), `createRoom`, `saveStatement` |
| Reuse as-is | JSON parse | `stripMarkdownFences` + try/catch (pattern from [debate-api.tsx](../../src/supabase/functions/server/debate-api.tsx)) |
| New | RSS scraper + image/roundup helpers | `ggwash-scraper-utils.ts` (`fetchGGWashArticles`, `extractFirstImageUrl`, `isRoundupTitle`) |
| New | Prompts | `ggwash-prompt-utils.ts` (`makeGGWashSelectionPrompt`, `parseSelectionResponse`, `makeTransformPromptFromGGWashArticle`) |
| New | Importer service | `GGWashImporter` in `ggwash-import-service.ts` |
| New | Article store | `getGGWashArticle` / `saveGGWashArticle` / `getAllGGWashArticles` in `kv-utils.tsx` |
| New | Cron endpoint | `POST /make-server-f1a393b4/enrichment/ggwash-import/run` |

## Data model

No `DebateRoom` schema change. In [types.tsx](../../src/supabase/functions/server/types.tsx):

```ts
export interface GGWashArticle {
  title: string;
  body: string;        // HTML-stripped, capped to MAX_ARTICLE_CHARS
  url: string;
  guid: string;        // RSS <guid> permalink; the article-store key
  imageUrl?: string;   // first <img> in the article HTML, hotlinked onto the post
  publishedAt: number;
}

export type GGWashArticleStatus = "scraped" | "attempting" | "published" | "rejected";

export interface GGWashArticleRecord {
  guid: string; title: string; url: string; imageUrl?: string;
  publishedAt: number; scrapedAt: number;
  bodyExcerpt: string;            // trimmed body kept for review
  status: GGWashArticleStatus;
  rank?: number;                  // selection rank on the run that attempted it
  generatedTopic?: string; generatedStatements?: string[];
  publishedRoomId?: string; error?: string; decidedAt?: number;
}
```

**The article store doubles as the dedup/at-most-once flag.** One record per scraped article at KV key `ggwash-article:${guid}` (via `upsert`). The `status` field is the single source of truth:

- `scraped` — fetched, never attempted; the **only** status eligible for selection.
- `attempting` — committed to an attempt (set **before** the transform call).
- `published` / `rejected` — terminal.

**At-most-once semantics** (deliberate): an article is moved to `attempting` the instant *before* its transform call, not after publish. KV writes aren't transactional, so marking after publish leaves a window where a crash or a concurrent double-fire re-selects it and produces a **duplicate post**. Marking first closes that window; the cost is that a transient failure drops that one article (no retry), which self-heals next day. Articles fetched but never attempted (ranked below the winner) stay `scraped` and remain eligible as fresher rivals age out. Storing every scraped article (including the deterministically-rejected roundups) gives a full review trail of the LLM's choices.

## Two-stage flow

`GGWashImporter.runOnce(): Promise<{ posted, considered, skipped }>`:

1. `fetchGGWashArticles()` → up to 10 articles (each with `imageUrl`).
2. **Record + collect candidates.** For each article: if no record exists, store one (`scraped`); but if its title is a roundup (`isRoundupTitle`), store it `rejected` ("auto-excluded: links roundup") and skip it. Candidates = articles whose record status is `scraped`. `considered` = candidate count; if 0, return.
3. **Stage 1 — Selection.** `completeJson(makeGGWashSelectionPrompt(candidates))`. Candidates are numbered **0-based**, each shown as title + first `SELECTION_SNIPPET_CHARS` of body. Returns `{ "ranked": number[] }` best-first, or `[]`. `parseSelectionResponse` runs `JSON.parse(stripMarkdownFences(raw))` in a try/catch; on parse failure / non-object / non-array `ranked` it returns `[]`; otherwise it clamps to range and dedupes. **Indices map back into the same candidate array**, never the raw feed.
4. **Stage 2 — Walk the ranked list.** For each index, until `TARGET_POSTS_PER_RUN` posts:
   - Set the record `attempting` + `rank` and save (**mark-first**; never reconsidered again).
   - `complete(makeTransformPromptFromGGWashArticle(article, provider))`.
   - Parse: line 1 = topic, rest = statements. If the response is `Error`, topic is empty, or statement count is outside `MIN_STATEMENTS..MAX_STATEMENTS` → record `rejected` + error, `skipped++`, continue.
   - Else publish: `createNewRoomData({ ..., subHeard: DEFAULT_SUBHEARD, endTime: now + ONE_WEEK_MS, allowAnonymous: true, imageUrl: article.imageUrl })`, `createRoom`, `saveStatement` ×N (author `IMPORTER_AUTHOR`, round 1). Record `published` + topic/statements/roomId. `posted++`.
5. Return `{ posted, considered, skipped }`.

Selection and transform pass distinct `endpoint` tags (`ggwash-select`, `ggwash-transform`) for usage logging.

## LLM prompts

### Selection (`makeGGWashSelectionPrompt`)
- **System:** `HEARD_DESCRIPTION` (Heard is a DC discussion app; a good post is a specific, debatable, interesting DC topic) + "reply with JSON only."
- **User:** 0-based numbered list of `title` + body snippet, then the selection criteria, then "return ONLY `{"ranked": [<indices>]}` best-first, `[]` if none."
- **Permissive guidance:** hot/timely/mildly controversial DC topics are good (transit, housing, development, bike/car culture, local policy, a mayoral/council race, new tech like Waymo, neighborhood change); a topic need not be evergreen, open-ended, or experience-based; news, named people, elections, and CTAs are fine if DC-focused.
- **Exclusions:** benign/informational (staff/hiring announcements, intern intros, housekeeping, routine "breaks ground", awards, event listings, weekly games/puzzles); any "Breakfast links"/roundup; anything not focused on DC itself, strict, with explicit VA (Arlington, Alexandria, Fairfax, Falls Church) and MD (Montgomery, Prince George's, Bethesda, Silver Spring) place names, including mixed DC+MD/VA pieces; when unclear, exclude.
- Tuned against the live feed (see Verification). The "Breakfast links" prefix is also filtered in code, since the LLM kept overriding the rule for substantive roundups.

### Transform (`makeTransformPromptFromGGWashArticle`)
Self-contained (does **not** reuse the Reddit prompt). Keeps the Heard **format** but loosens the **subjects**:
- Persona system prompt + `Error` sentinel.
- Title + capped body, then a short `Error`-if list (benign/roundup; not-DC / mixed MD-VA; frames marginalized groups in opposition; medical-condition misinfo).
- **Topic rules (loosened):** one engaging question inviting a range of opinions; may be specific, timely, and directly phrased (e.g. "Should Waymo expand its robotaxis in DC?"); need not be evergreen/open-ended/experience-based; keep it about DC.
- **Response rules (unchanged Heard format):** exactly 3, ≤8 words each, no preamble/filler, speak for yourself, range of viewpoints incl. a minority one, complete thoughts, no quotes or trailing punctuation.
- Per-provider "CRITICAL REMINDERS" appended for gemini/anthropic (not openai), mirroring the Reddit pattern.

## API endpoint

`POST /make-server-f1a393b4/enrichment/ggwash-import/run`
- Inherits `validateCronAuth` from `enrichment/*` (uses `x-cron-secret`). The prefix is chosen purely for auth reuse; the importer shares none of the probabilistic enrichment config.
- No body params; `defineRoute` tolerates an empty body. Calls `new GGWashImporter().runOnce()`, returns `{ posted, considered, skipped }`.
- In `ggwash-import-api.ts`, routed in [index.tsx](../../src/supabase/functions/server/index.tsx) like `enrichmentApi`.

## Backend file map

New files (`src/supabase/functions/server/`): `ggwash-scraper-utils.ts`, `ggwash-prompt-utils.ts`, `ggwash-import-service.ts`, `ggwash-import-api.ts`, `ggwash-import-test.tsx`.

Modified: `types.tsx` (article types), `kv-utils.tsx` (article-store helpers), `index.tsx` (import/route). `ai-prompt-utils.ts` is **not** touched.

### Key constants
- `GGWASH_RSS_URL`, `MAX_ARTICLE_CHARS = 8000`, `MAX_ARTICLES = 10`, `ROUNDUP_TITLE_PREFIX = "breakfast links"` (scraper)
- `SELECTION_SNIPPET_CHARS = 200`, `LLM_ERROR_SENTINEL = "Error"` (prompts)
- `TARGET_POSTS_PER_RUN = 1`, `DEFAULT_SUBHEARD = "washington-dc"`, `IMPORTER_AUTHOR = "enrichment-service"`, `MIN_STATEMENTS = 2`, `MAX_STATEMENTS = 3`, `STORE_EXCERPT_CHARS = 2000`, `SELECT_ENDPOINT`, `TRANSFORM_ENDPOINT` (service)

## Testing

`ggwash-import-test.tsx` (offline, runs in `deno test`; 17 steps): selection prompt construction; `parseSelectionResponse` (clean / fenced / malformed / missing-or-non-array `ranked` / out-of-range+dupes → never throws); transform prompt construction (gemini/anthropic reminders only); `parseTransform` (topic+3, Error/empty/wrong-count rejected); `isRoundupTitle`; `extractFirstImageUrl` (absolute only, encodes spaces). A networked end-to-end block is gated behind `RUN_GGWASH_LLM_TESTS=1`.

## Externalities / gotchas

- **Image hotlinking.** `imageUrl` is the article's first `<img>`; spaces are `%20`-encoded. No re-hosting; if GGWash moves/referrer-blocks an image it just won't render (acceptable). Image rendering has no allowlist, so external URLs work.
- **Roundup filter is deterministic.** "Breakfast links" is excluded in code (`isRoundupTitle`); the prompt rule is a backstop for other roundup shapes. Roundups are still recorded (`rejected`) for the review trail.
- **DC-only required live tuning.** The selection prompt needed explicit VA/MD place names before it reliably dropped Arlington and mixed DC+MD pieces. Re-tune if GGWash coverage shifts.
- **Non-atomic publish.** `createRoom` then `saveStatement` ×N aren't transactional; a mid-publish failure can leave a room with <3 statements. Mark-first prevents duplicates (not partials); a partial room is a rare minor blemish at 1/day. No rollback.
- **Do not inherit enrichment scheduler quirks.** No probability-skip, no 3-7am ET skip.
- **No in-repo scheduler.** Add the external cron entry: daily early-morning (e.g. `0 6 * * *` ET → scheduler TZ), `POST`, header `x-cron-secret: <CRON_SECRET>`. DST is the scheduler's concern.
- **Two LLM calls/run**, tagged distinctly. Default provider is gemini (`GEMINI_API_KEY` required, already set).
- **Idempotency / no duplicates** via mark-first (at-most-once). Dry days (no candidates, or all transform to `Error`) correctly post nothing.

## Clean Code notes

- **SRP:** scraper / prompts / service / api each do one thing; `runOnce` delegates to small private methods (`recordAndCollectCandidates`, `selectRanked`, `attemptPublish`, `publish`).
- **No shared-rules extraction.** GGWash's transform rules diverged from Reddit's, so the prompt is self-contained and `ai-prompt-utils.ts` is left untouched (no drift into pre-existing code, no thin abstraction).
- **Parse inline** (the small transform split lives in the service as `parseTransform`); `parseSelectionResponse` is its own function because the JSON handling is substantive.
- **No defensive handling of impossible cases** (the record always exists when attempted, asserted with `!`). The `Error` sentinel and count/topic checks are real LLM-output validation. Named constants throughout; TS strict.

## Verification

1. **Offline tests + typecheck (done).** `deno test --allow-env --allow-net --no-check ggwash-import-test.tsx` → 17 steps pass. `deno check ggwash-*.ts` → clean.
2. **Live selection tuning (done).** Ran selection+transform against the live feed repeatedly: stable picks of the genuine single-topic DC opinion pieces; VA/MD, roundups, the intern intro, the puzzle, and mixed DC+MD endorsements all excluded; image URL extracted; transform yields a topic + 3 distinct-viewpoint responses. Re-run live with `RUN_GGWASH_LLM_TESTS=1 deno test --allow-env --allow-net --no-check ggwash-import-test.tsx`.
3. **Manual cron run.** `curl -X POST http://localhost:<port>/make-server-f1a393b4/enrichment/ggwash-import/run -H "x-cron-secret: <secret>"` → `{ posted, considered, skipped }`. Confirm a new `washington-dc` room with the image + 3 statements, and `ggwash-article:<guid>` records (status `published` for the winner, `scraped` for the rest, `rejected` for roundups).
4. **Dedup.** Re-run immediately → the winner is `published` (not re-attempted), no duplicate.

## Out of scope (deferred)

- Admin UI to browse the `ggwash-article:*` store (data is captured; reviewing it is currently raw-KV only).
- Admin approval gate, source attribution/link, multi-feed generalization, cross-source dedup, scheduled/future publishing, an on/off config flag (disable the cron entry to pause).

## Changes after the initial implementation

Everything above describes the feature as first built. The items below were changed **afterward**, during a prompt-tuning and tooling pass, and are listed as deltas — not folded into the design above as if they were always there:

- **Transform disqualifiers tightened** (`ggwash-prompt-utils.ts`). Added `Error`-if cases the first build lacked: a **call to action** urging a *specific civic action* (vote for/endorse a candidate or slate, sign a petition, attend a rally, donate, contact officials) — **with an explicit op-ed carve-out** so a piece that merely argues a position or proposes a policy is kept; **games/puzzles/quizzes**; and **photo essays / "Photo Friday"**. The roundup rule now also names **"National links"** alongside "Breakfast links". Net effect: the original "allow calls to action" decision (line 14) is narrowed — *opinion/advocacy* is allowed, but *mobilization* is rejected.
- **Punctuation normalized in code, not just the prompt** (`parseTransform`). The model was unreliable about punctuation, so the parser now forces a single trailing `?` on the topic (new `toQuestion` helper) and strips trailing punctuation from each response; the prompt's response rules were also hardened to forbid `!`/`?` anywhere in a response. Two tests were added — the suite is now **19 steps** (was 17).
- **Dry-run harness added** under `research/ggwash-importer/` (`dry-run.ts` + `README.md`). It runs the real fetch → select → transform against the live feed/LLM and writes a Markdown report for offline prompt iteration, but **never publishes**. A research tool, separate from the importer.
- **Code comments removed** from the importer (a later Clean-Code pass), keeping only two deliberate "why" comments: the mark-first ordering in `attemptPublish`, and the harness's `NODE_ENV=test`.
- **Flow diagram labels corrected.** [ggwash-import-flow.excalidraw](ggwash-import-flow.excalidraw) had been left showing the *first-draft* design — a boolean `ggwash-processed:{guid}` / `isGGWashProcessed` processed-set marked on publish — which the implementation had already replaced with the `ggwash-article:{guid}` status-record store (marked `attempting` before the transform). The labels were corrected to match the as-built system; the original-draft version is recoverable from git history.

## References
- Flow diagram: [ggwash-import-flow.excalidraw](ggwash-import-flow.excalidraw).
- Built sibling: [reddit-import-service.ts](../../src/supabase/functions/server/reddit-import-service.ts).
