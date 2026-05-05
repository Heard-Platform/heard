# Newsletter Importer: Implementation Plan

A complete plan for an implementing agent. Read this end to end before writing any code. Cross-reference with the flow diagram in this folder: [newsletter-import-flow.excalidraw](newsletter-import-flow.excalidraw).

## Goal

Build a daily importer that scrapes a configured list of newsletter RSS feeds, asks an LLM to convert each story into a debate topic plus 2 to 3 response statements, queues the LLM output as `pending` candidate posts, and surfaces them to a developer in the Dev Tools admin panel for edit + approve or deny. Approved candidates create a Heard post immediately in the chosen subheard (default `washington-dc`).

The system is the structural sibling of the existing Reddit importer: both fetch external content, transform with an LLM, and produce Heard posts. The newsletter importer adds a human approval gate between transform and publish; the Reddit importer publishes directly.

## Reference reading (do this first)

Read every file below before writing any code. They establish the patterns this plan depends on.

1. [src/supabase/functions/server/reddit-import-service.ts](../../src/supabase/functions/server/reddit-import-service.ts): the `RedditImporter` class. The newsletter importer mirrors its shape.
2. [src/supabase/functions/server/reddit-scraper-utils.ts](../../src/supabase/functions/server/reddit-scraper-utils.ts): `getRedditPosts()`. The newsletter scraper mirrors this for RSS.
3. [src/supabase/functions/server/ai-prompt-utils.ts](../../src/supabase/functions/server/ai-prompt-utils.ts): `makeTransformPromptFromRedditPost()`. Specifically, study the system prompt's "Error" sentinel pattern and the user prompt's disqualifier list. The newsletter prompt uses the same pattern with a different disqualifier list.
4. [src/supabase/functions/server/enrichment-api.ts](../../src/supabase/functions/server/enrichment-api.ts): the cron endpoint shape. **Do not copy the probability-skip or 3am-7am ET overnight skip.** The newsletter importer is deterministic and runs whenever the external scheduler calls it.
5. [src/supabase/functions/server/cron-api.tsx](../../src/supabase/functions/server/cron-api.tsx): `validateCronAuth()` and the celebration-SMS endpoint as a sample of a cron handler that reads/writes KV in a loop.
6. [src/supabase/functions/server/index.tsx](../../src/supabase/functions/server/index.tsx) lines 100 to 135: how route namespaces are protected. `enrichment/*` and `admin/*` are already in their respective `protect(...)` lists, so new routes under those prefixes inherit auth automatically.
7. [src/supabase/functions/server/kv-utils.tsx](../../src/supabase/functions/server/kv-utils.tsx): KV helper conventions. Pay attention to `getCelebrationSmsSent` / `saveCelebrationSmsSent` (the boolean-flag pattern, used for the seen-set) and `saveFeedback` / `getFeedbackList` (the keyed-record pattern, used for the candidate store).
8. [src/supabase/functions/server/room-utils.ts](../../src/supabase/functions/server/room-utils.ts): `createNewRoomData()`. Use this when an approval creates a Heard post.
9. [src/supabase/functions/server/route-wrapper.tsx](../../src/supabase/functions/server/route-wrapper.tsx): `defineRoute()`. Wrap every new endpoint with it.
10. [src/components/AdminPanel.tsx](../../src/components/AdminPanel.tsx): host page for the new tab. Look at how the existing "Newsletter" tab and the "Dev Tools" tab are wired in.
11. [src/components/devtools/EnrichmentTab.tsx](../../src/components/devtools/EnrichmentTab.tsx): example of a Dev Tools sub-tab that talks to a server endpoint.

## Reuse map

| Layer | What | Where |
|---|---|---|
| Reuse as-is | LLM provider abstraction | `createLlmClient` in [llm-provider.ts](../../src/supabase/functions/server/llm-provider.ts) |
| Reuse as-is | Persona randomization for the LLM system prompt | `getRandomPersona` in [personas.tsx](../../src/supabase/functions/server/personas.tsx) |
| Reuse as-is | Cron auth | `validateCronAuth` (auto-applied to `enrichment/*` and `cron/*` via [index.tsx:134](../../src/supabase/functions/server/index.tsx#L134)) |
| Reuse as-is | Route input validation | `defineRoute` in [route-wrapper.tsx](../../src/supabase/functions/server/route-wrapper.tsx) |
| Reuse as-is | Heard post creation primitives | `createNewRoomData`, `createRoom`, `saveStatement` |
| Reuse as-is | Subheard slug normalization | `normalizeCommunityName` in [utils.tsx](../../src/supabase/functions/server/utils.tsx) |
| Reuse as-is | KV helpers | `upsert`, `getParsedKvData`, `getByPrefixParsed` |
| Adapt | Transform prompt | New `makeTransformPromptFromNewsletterStory` with newsletter-specific disqualifiers (see "LLM prompt" section below) |
| New | RSS scraper for newsletter feeds | `newsletter-scraper-utils.ts` |
| New | Importer service class | `NewsletterImporter` in `newsletter-import-service.ts` |
| New | Seen-set KV helpers | `isNewsletterSeen`, `markNewsletterSeen` |
| New | Candidate store types + KV helpers | `NewsletterCandidate`, `saveNewsletterCandidate`, `getNewsletterCandidate`, `getAllNewsletterCandidates`, `getPendingNewsletterCandidates` |
| New | Cron endpoint | `POST /make-server-f1a393b4/enrichment/newsletter-import/run` |
| New | Admin endpoints | list, update, approve, deny on `/admin/newsletter-candidates/*` |
| New | Dev Tools tab + UI | `NewsletterCandidatesTab` component, list + edit form + Create Post / Discard buttons |

## Data model

Add to [src/supabase/functions/server/types.tsx](../../src/supabase/functions/server/types.tsx):

```ts
export type NewsletterCandidateStatus = "pending" | "approved" | "denied";

export interface NewsletterCandidate {
  id: string;
  status: NewsletterCandidateStatus;

  source: string;          // newsletter name or feed slug
  sourceUrl: string;       // article URL
  sourceGuid: string;      // RSS <guid> if present, else URL (used as seen-set key)
  originalTitle: string;
  originalSummary: string;

  generatedTopic: string;
  generatedStatements: string[];   // 2 or 3 entries
  suggestedSubheard: string;       // defaults to "washington-dc"
  suggestedCoverImageUrl?: string; // optional, may be derived from RSS or absent

  createdAt: number;
  decidedBy?: string;              // userId who approved or denied
  decidedAt?: number;
  publishedRoomId?: string;        // set on approve
}
```

Also add an internal type for parsed RSS items (not stored in KV, just passed within the importer):

```ts
export interface NewsletterRssItem {
  source: string;
  title: string;
  body: string;        // article body or RSS description, whichever is richer
  url: string;
  guid: string;        // <guid> if present, else URL
  publishedAt: number;
}
```

KV key conventions, both new:

| Key pattern | Value | Helpers (in [kv-utils.tsx](../../src/supabase/functions/server/kv-utils.tsx)) |
|---|---|---|
| `newsletter-seen:${guid}` | `"true"` (sentinel) | `isNewsletterSeen(guid)`, `markNewsletterSeen(guid)` |
| `newsletter-candidate:${id}` | JSON-stringified `NewsletterCandidate` | `saveNewsletterCandidate(c)`, `getNewsletterCandidate(id)`, `getAllNewsletterCandidates()`, `getPendingNewsletterCandidates()` |

`getPendingNewsletterCandidates` filters by `status === "pending"` after `getByPrefixParsed("newsletter-candidate:")`. Sort newest first by `createdAt` for the UI.

## Configured feeds

Hard-code the initial feed list as a constant in `newsletter-scraper-utils.ts`:

```ts
export const NEWSLETTER_FEEDS: ReadonlyArray<{
  source: string;       // human-readable name, also stored on the candidate
  feedUrl: string;
}> = [
  // Example: { source: "Politico Playbook", feedUrl: "https://..." },
  // Confirm the actual list with the product owner before merging.
];
```

The product owner will provide the actual feeds. Do not invent URLs. If the constant is empty when running, log a warning and exit with `processed: 0`.

## API endpoints

All under the existing prefix `/make-server-f1a393b4`. Use `defineRoute` for every handler.

### Cron endpoint

`POST /make-server-f1a393b4/enrichment/newsletter-import/run`

- Inherits `validateCronAuth` from the `enrichment/*` prefix.
- No body parameters required. Optional `forceRun: boolean` is unused for this endpoint (kept for parity if you want, but ignore it; this run is always deterministic).
- Returns `{ saved: number, skipped: number, considered: number }`.
- Implementation lives in a new file `newsletter-import-api.ts` next to `enrichment-api.ts`. Wire the Hono app into [index.tsx](../../src/supabase/functions/server/index.tsx) the same way `enrichmentApi` is.

### Admin endpoints

Auth: each path lives under `admin/*`, which is already protected by `validateAdmin` via [index.tsx:131](../../src/supabase/functions/server/index.tsx#L131). Implementation in a new file `newsletter-candidates-admin-api.ts`.

| Method + Path | Body | Returns | Behavior |
|---|---|---|---|
| `GET /admin/newsletter-candidates?status=pending` | none | `{ candidates: NewsletterCandidate[] }` | Defaults to `pending`. Sorted newest first. |
| `PATCH /admin/newsletter-candidates/:id` | partial `NewsletterCandidate` (only `generatedTopic`, `generatedStatements`, `suggestedSubheard`, `suggestedCoverImageUrl` editable) | the updated candidate | Saves edits in place. Status stays `pending`. |
| `POST /admin/newsletter-candidates/:id/approve` | none | `{ roomId: string }` | Reads the candidate, calls the existing room-create path with the candidate's edited fields, normalizes the subheard via `normalizeCommunityName`, sets `status = "approved"`, `decidedBy = userId`, `decidedAt = now`, `publishedRoomId = roomId`, saves. |
| `POST /admin/newsletter-candidates/:id/deny` | none | `{ id: string }` | Sets `status = "denied"`, `decidedBy`, `decidedAt`, saves. No post created. |

For the approve handler, do not POST to `/room/create` over HTTP. Call the underlying create logic directly (extract a shared function from [debate-api.tsx](../../src/supabase/functions/server/debate-api.tsx) if necessary) so the importer's approval is server-side and atomic.

## Backend implementation

### File map

New files:

- `src/supabase/functions/server/newsletter-scraper-utils.ts`
- `src/supabase/functions/server/newsletter-prompt-utils.ts`
- `src/supabase/functions/server/newsletter-import-service.ts`
- `src/supabase/functions/server/newsletter-import-api.ts`
- `src/supabase/functions/server/newsletter-candidates-admin-api.ts`

Existing files to modify:

- `src/supabase/functions/server/types.tsx`: add `NewsletterCandidate`, `NewsletterCandidateStatus`, `NewsletterRssItem`.
- `src/supabase/functions/server/kv-utils.tsx`: add the seen-set and candidate-store helpers.
- `src/supabase/functions/server/index.tsx`: import and route the two new Hono apps.

### Implementation order

Doing this in order avoids dead-end refactors.

1. **Types.** Add the new types to `types.tsx`.
2. **KV helpers.** Add `isNewsletterSeen` / `markNewsletterSeen` (mirror `getCelebrationSmsSent` / `saveCelebrationSmsSent`) and the candidate-store helpers (mirror `saveFeedback` / `getFeedbackList`).
3. **RSS scraper.** Implement `fetchNewsletterFeeds(): Promise<NewsletterRssItem[]>` that hits each entry in `NEWSLETTER_FEEDS`, parses RSS, and returns flattened items. Use the same XML/RSS parsing approach as `reddit-scraper-utils.ts`. Use `<guid>` if present, else fall back to the item URL.
4. **Prompt builder.** Implement `makeTransformPromptFromNewsletterStory(item, provider, persona?)` mirroring `makeTransformPromptFromRedditPost`. Same "Error" sentinel rule. New disqualifier list (see "LLM prompt" below). Reuse the topic-rules and response-rules sections from the Reddit version verbatim, except for any parts that explicitly say "Reddit post" (rephrase to "newsletter article").
5. **Importer service.** Create `NewsletterImporter` class with one public method `runOnce(): Promise<{ saved, skipped, considered }>`.
   1. Call `fetchNewsletterFeeds()`.
   2. Filter out items where `isNewsletterSeen(item.guid)` is true.
   3. Loop through the remaining items in order. For each:
      1. `markNewsletterSeen(item.guid)` first.
      2. Build prompt, call `createLlmClient(provider).complete(prompt)`.
      3. If the response trims to `"Error"`, increment skipped, continue.
      4. Else parse: line 1 is the topic, lines 2+ are statements (2 or 3). Validate 2 to 3 statements; if not, treat as Error and continue.
      5. Build a `NewsletterCandidate` with `id = generateId()`, `status: "pending"`, `suggestedSubheard: "washington-dc"`, `createdAt: Date.now()`, fields from the LLM output.
      6. `saveNewsletterCandidate(candidate)`. Increment saved.
      7. If saved equals 5, break.
   4. Return the counts.
6. **Cron endpoint.** New Hono app in `newsletter-import-api.ts` with the route from "API endpoints" above. Calls `new NewsletterImporter().runOnce()`. Wire into `index.tsx`.
7. **Admin endpoints.** New Hono app in `newsletter-candidates-admin-api.ts` with the four routes from "API endpoints" above. Wire into `index.tsx`.

### Key constants

Extract these to named constants in their files. Do not inline magic numbers or strings.

- `TARGET_CANDIDATES_PER_RUN = 5` (in `newsletter-import-service.ts`)
- `DEFAULT_SUBHEARD = "washington-dc"` (in `newsletter-import-service.ts`)
- `LLM_ERROR_SENTINEL = "Error"` (in `newsletter-prompt-utils.ts`, exported and used in the service)
- `MIN_STATEMENTS = 2`, `MAX_STATEMENTS = 3` (in `newsletter-import-service.ts`)

## Frontend implementation

### Admin client

In [src/utils/admin-api.ts](../../src/utils/admin-api.ts), add four methods mirroring the existing admin API style:

- `adminListNewsletterCandidates(adminKey, status?)`
- `adminUpdateNewsletterCandidate(adminKey, id, patch)`
- `adminApproveNewsletterCandidate(adminKey, id)`
- `adminDenyNewsletterCandidate(adminKey, id)`

### Tab and component

1. In [src/components/AdminPanel.tsx](../../src/components/AdminPanel.tsx), add a new tab button "Newsletter Candidates" alongside the existing "Newsletter" and "Dev Tools" tabs. Update the URL-tab sync logic the same way other tabs are.
2. Create `src/components/admin/NewsletterCandidatesTab.tsx`. Receive `adminKey` as a prop in line with sibling components.
3. Component behavior:
   - On mount, call `adminListNewsletterCandidates(adminKey)` and render the returned list newest first. The server already sorts; the client should not re-sort defensively.
   - Each list item is an editable card with: topic input, 2 or 3 statement inputs, subheard input (default filled in from `suggestedSubheard`), cover image URL input, and two buttons "Create Post" and "Discard".
   - "Create Post" sends edits via `adminUpdateNewsletterCandidate` first if the form is dirty, then calls `adminApproveNewsletterCandidate`. On success, remove the card from the local list and toast the new room id.
   - "Discard" calls `adminDenyNewsletterCandidate` and removes the card from the local list on success.
   - Handle errors with `toast.error` like sibling tabs do.
4. Reuse the existing UI primitives in `src/components/ui/` (Button, Input, Textarea, Card). Do not introduce new design tokens.

## LLM prompt

The prompt is the quality gate. The LLM either returns a topic plus 2 to 3 statements, or the literal word `Error`. The handler treats `Error` as "skip and do not count toward the target."

Carry over from the Reddit prompt verbatim:

- The `Error`-sentinel system-prompt instruction.
- All "Topic rules" (open-ended question form, no yes/no, no leading "Should/Is/Are/Do/...", subject preservation, etc.).
- All "Response rules" (8-word max, no preambles, no trailing qualifiers, complete thoughts, etc.).
- The provider-specific reminder blocks for Gemini and Anthropic.

Replace the disqualifier list. Initial draft to refine with the product owner before shipping:

- The article is a paid promotion, sponsored placement, or affiliate roundup.
- The article is newsletter housekeeping (editor introduction, hiring notice, "manage your subscription", anniversary or milestone post).
- The article is a news headline or report about a specific political figure, political event, or political organization.
- The article is a news report or account of a specific crime, accident, or violent incident.
- The article dismisses, minimizes, or misrepresents a recognized medical or psychological condition.
- The article frames any number of marginalized or vulnerable groups in opposition to each other.
- The article is a review of, or primarily discusses or compares, a specific film, TV show, book, game, music track, song, album, or other media title, including posts that share or link to a specific piece of content.
- The article is a news headline or article about box office results, streaming numbers, entertainment industry statistics, or award show results.
- The article contains quotes from, or is primarily about, named real people (celebrities, public figures, politicians, athletes, etc.).
- The article makes or comments on allegations or claims about named real people.
- The article is a stock-price update, market move, or other purely numeric market report.
- The article is a weather report, sports score, or other purely informational item with no opinion-bearing angle.
- The article is too breaking-news to convert into an evergreen discussion (e.g. "results so far tonight").
- The article is too local or transactional to yield a universal discussion question (e.g. neighborhood event listings, single-business announcements, restaurant openings limited to one zip code).

The Reddit prompt's full text is in [ai-prompt-utils.ts](../../src/supabase/functions/server/ai-prompt-utils.ts). The newsletter version copies its structure exactly: same system prompt header, same "BEFORE DOING ANYTHING ELSE" preamble, then the substituted disqualifier list, then the unchanged topic and response rules and the unchanged Format line.

## External cron configuration

Out of repository scope, but the implementing agent should leave a TODO note in the PR description. The team's existing cron service (whatever schedules `/enrichment/run` and `/cron/send-completion-celebrations`) needs a new entry:

- Schedule: `0 5 * * *` (daily at 05:00 server time, or convert to UTC for the scheduler in use).
- Method: POST.
- Path: `/make-server-f1a393b4/enrichment/newsletter-import/run`.
- Header: `x-cron-secret: <CRON_SECRET>`.

## Verification

Local end-to-end check, in order:

1. **Build and typecheck.** Whatever `npm run build` and `tsc --noEmit` map to in this repo. Fix any errors before continuing.
2. **Manual cron invocation.** `curl -X POST http://localhost:<port>/make-server-f1a393b4/enrichment/newsletter-import/run -H "x-cron-secret: <secret>"`. Confirm the response shape `{ saved, skipped, considered }`. Confirm the seen-set has new entries (`kv list newsletter-seen:` or equivalent). Confirm the candidate store has new entries with `status: "pending"` (`kv list newsletter-candidate:`).
3. **Re-run.** Hit the same endpoint a second time. Confirm `considered` is 0 or only includes feed items that arrived between the two runs. The seen-set must prevent re-processing.
4. **Quality gate.** Temporarily inject a junk RSS item (e.g. an ad disqualifier match) into the feed list or feed-stub. Confirm the LLM returns `Error` and the item is counted in `skipped`, not `saved`, and the seen-set still records it.
5. **Admin UI list.** Open the Dev Tools panel. Confirm the new "Newsletter Candidates" tab is visible and lists the candidates from step 2 newest first.
6. **Admin UI edit.** Edit the topic on one card. Click "Create Post". Confirm a new Heard post appears in the chosen subheard with the edited topic and statements. Confirm the candidate's status flipped to `approved` and the card disappeared from the queue.
7. **Admin UI deny.** Click "Discard" on another card. Confirm no Heard post is created, the candidate's status is `denied`, and the card disappeared from the queue.
8. **Default subheard.** Approve a candidate without changing the subheard field. Confirm the post lands in `washington-dc`.

## Out of scope (explicit)

The implementing agent should not build any of the following. They have been considered and deliberately deferred.

- **Scheduled posts (publishing in the future).** The "Create Post" button publishes immediately. There is no "publish at" field, no scheduled-posts queue, and no publisher worker. A separate research doc on scheduled posts will be created in a different branch and integrated later.
- **Cross-feed deduplication.** The same story syndicated across multiple feeds may produce multiple candidates. The dev can deny duplicates manually. No similarity check, no embedding compare.
- **An on/off config like the Reddit `EnrichmentConfig`.** The newsletter cron always runs when called; the external scheduler decides timing. Do not introduce an enabled flag, average-interval-mins, or overnight skip window.
- **A "force run" or "manual run now" button in the admin UI.** Devs can hit the cron endpoint directly with `x-cron-secret` if they need an out-of-band run.
- **Editing the source article fields** (`originalTitle`, `originalSummary`, `sourceUrl`). These are immutable references. Only `generatedTopic`, `generatedStatements`, `suggestedSubheard`, and `suggestedCoverImageUrl` are editable in the UI.

## Conventions to follow

- TypeScript strict mode. No `any` in new code.
- No magic numbers or strings. All thresholds, sentinels, and defaults extracted to named constants.
- No defensive error handling for impossible cases. Trust internal guarantees (e.g. if `generateId` produces a string, do not validate it).
- Edit existing files where the pattern fits; create new files only for new modules.
- No code comments unless the why is non-obvious.
- Match the style of sibling files (e.g. `newsletter-import-api.ts` should look like `enrichment-api.ts`, not invent its own structure).

## References

- Flow diagram: [newsletter-import-flow.excalidraw](newsletter-import-flow.excalidraw) in this folder. Open in Excalidraw to see the full system at a glance.
- Sibling research doc for the deferred scheduled-posts feature: not yet written.
