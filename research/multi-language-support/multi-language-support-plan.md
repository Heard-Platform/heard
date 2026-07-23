# Multi-Language Support (Spanish first) — Architecture Plan

> Companion diagram: [`multi-language-support-flow.excalidraw`](./multi-language-support-flow.excalidraw)
>
> Status: **architecture / design** — no product code written yet. This doc exists for review before implementation.

## 1. Goal

A visitor picks a language in a classic top-toolbar selector (flag + label) and uses the **entire** site in that language — reading every post, every piece of website copy, and creating new posts — **without ever seeing English** (barring a deliberate, rare exception). We start with **Spanish**, but the design must generalize to more languages.

A hard requirement threaded through everything: **determinism**. Every user must see the *same* translation of a given post. If translations were generated on the fly per page-load, two people could read subtly different versions of the same statement and a debate would lose its integrity. So we translate **once, at the moment content is written, and store the result** — never just-in-time at render.

## 2. What we're working with (why the design looks the way it does)

A quick tour of the relevant parts of the codebase, because each one shaped a decision:

- **Frontend:** Vite + React 18 + TypeScript, a **pure client-side SPA** (no Next.js / SSR). Routing is hand-rolled in `src/App.tsx` (`pathname.split("/")[1]`), not react-router. → *A `/es/…` URL-prefix scheme would mean rewriting that parser and every `updateUrlFor*` helper in `src/utils/url.tsx`. Not worth it; we keep language in state + storage instead of the URL.*
- **UI copy today:** hardcoded inline across 42+ `.tsx` files (button text, placeholders, `toast.*`, headings). There is **no** existing string catalog and **no** i18n library. → *System A is a genuine greenfield extraction effort — the single largest chunk of labor.*
- **Backend:** Supabase **Deno edge functions** (Hono). User content (topics, statements, users, votes) lives as **schemaless JSONB blobs** in one key-value table, `kv_store_f1a393b4`, keyed `room:{id}` and `statement:{roomId}:{id}`. → *Because it's schemaless, we can add translation fields to the blob with **no database migration**. Every read already loads the whole blob, so inline translations come along for free — no join, no second query.*
- **LLM abstraction already exists** (`src/supabase/functions/server/llm-provider.ts`): `createLlmClient().complete()/completeJson()` with automatic usage logging. Anthropic path uses `claude-haiku-4-5-20251001`. → *We reuse this for translation — injecting the client for testability and threading a `maxTokens` parameter — but add no new provider plumbing.*
- **State & persistence:** React Context (clean example: `src/contexts/RoomAlertsContext.tsx`); client persistence via `src/utils/localStorage.ts`. No user-level `language` field exists yet. → *We copy the context pattern and the storage helpers rather than inventing anything.*

## 3. Decisions (agreed with the user)

| Decision | Choice | Why |
|---|---|---|
| UI-copy tooling | **react-i18next** | Standard for React SPAs; gives interpolation, Spanish pluralization, missing-key fallback to English, and lazy-loaded language bundles — all the messy realities we'd otherwise hand-roll. |
| Content-translation timing | **Synchronous on submit** | Guarantees no untranslated post is ever visible — directly upholds the "never see English" goal. Haiku on one short string is fast (~1s). |
| Direction | **Bidirectional** | Detect the author's language and translate into every other supported language (just the other one while we have two), so each reader always sees their own — regardless of who wrote the post. Same LLM call, negligible extra cost; generalizes to N via the supported set. |

Two independent systems fall out of this, sharing one language selector. See the diagram.

---

## 4. System A — Website copy (react-i18next)

**Setup**
- Add deps: `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
- `src/i18n/index.ts` initializes i18next as the **single source of truth for the current language**. Resource files under `src/i18n/locales/{en,es}/*.json`, namespaced by area (`common`, `lobby`, `room`, `create`, `menu`, `results`). `fallbackLng: 'en'` so any missing `es` key shows English rather than a raw key.
- Set `document.documentElement.lang` whenever the language changes.

**Language state, selection & persistence**
- A thin `useLanguage()` hook (`src/contexts/LanguageContext.tsx`, modeled on `RoomAlertsContext.tsx`) exposing `language` (from `i18n.language`) and `setLanguage()` (calls `i18n.changeLanguage`, persists, updates `<html lang>`). Provided in `src/App.tsx` next to `DebateSessionProvider`.
- Persistence: localStorage key `selectedLanguage` via the existing `safelyGet/SetStorageItem` helpers. First-visit default derived from `navigator.language`. For **logged-in users**, also store `language` on the user record (add to `UserSession` in `src/types/index.ts` + server `user-utils.ts`) so the choice follows them across devices.

**Selector UI**
- `src/components/LanguageSelector.tsx` built from `src/components/ui/dropdown-menu.tsx` (`DropdownMenuRadioGroup`), styled as a `rounded-full bg-white/90 …` pill to match the toolbar. Mounted in the `LobbyScreen.tsx` floating header (≈ lines 345–424); reuse in other toolbars (e.g. EventView).
- **Flag caveat:** unicode flag emoji (🇪🇸/🇺🇸) render as plain letters ("ES"/"US") on Chrome-on-Windows. Recommend a small **SVG flag** set (`flag-icons` or inline SVG) **plus** the language name ("Español" / "English") — unambiguous everywhere. Confirm the look during build.

**The extraction sweep (largest effort — phase it)**
- Replace inline literals with `t('ns.key')`. Order of attack: the **core flow first** — `LobbyScreen`, `RoomCard`, `room/StatementCard`, `room/AddResponseModal`, `create-room/*` + `CreateRoomSheet`, `SidePanelMenu`/`HamburgerMenu`, and all `toast.*` calls — then a full sweep of remaining `src/components`, `src/screens`, and the copy in `src/utils/constants/*`.

---

## 5. System B — User content (stored, synchronous, idempotent, multi-language-ready)

**Language codes as an open set.** `type LangCode = 'en' | 'es'` — a third language is one edit to the union, not a rewrite. Everything below keys off `LangCode` instead of hardcoded `en`/`es` pairs.

**Schema — inline in the existing JSONB (no migration).** Extend both server `types.tsx` and frontend `src/types/index.ts`. These two definitions duplicate across a client/server boundary with no shared package — that is the one place duplication is accepted here, so treat them as a seam to keep in sync, not as independent types:
- `Statement`: `sourceLang?: LangCode`, `i18n?: Partial<Record<LangCode, { text: string }>>` (also translate `mergedFrom[].text`).
- `DebateRoom`: `sourceLang?: LangCode`, `i18n?: Partial<Record<LangCode, { topic: string; description: string }>>`.
- `needsTranslation?: boolean` on both — set when a translation attempt fails, so a missing translation lives **in the data** (queryable, backfillable) instead of only in a log line.

Modeling `i18n` as an open `Record<LangCode, …>` map — not named `{ en, es }` keys — is what keeps the "generalize to more languages" goal actually true: adding a language never migrates existing records.

**Translation service (server)** — new `src/supabase/functions/server/translation-service.ts`:
- `translateContent(fields, client, ctx)` — the `LlmClient` is **injected** (default `= createLlmClient()`), so the service is unit-testable with a fake and never has to reach a live LLM under `deno test`. It builds an `AiPrompt` (new builder in `ai-prompt-utils.ts`) instructing the model to **detect the source language and translate into every other language in the supported set**, returning strict JSON `{ sourceLang, translations: Partial<Record<LangCode, {…}>> }`.
- **Idempotent by design.** The service is keyed on the source text: if `i18n` already covers the current `text` for the needed targets, it is a no-op. This is what makes it safe to call from any authoring path without re-translating (or re-billing) on unrelated updates — see the write path.
- **Defensive parsing / graceful degradation.** Parse the JSON tolerantly; on any failure, save the original with `needsTranslation: true` and log — never block the post. Fix the two rough edges in the reused client **at the boundary, not globally**: thread a `maxTokens` **parameter** through the client call (default stays the current 500) rather than bumping the shared `max_tokens` constant that rant/enrichment/ask-the-data all depend on; and treat `completeJson` as best-effort JSON (parse tolerantly), since it does not truly force JSON.

**Write path — one idempotent step at the authoring choke point (not scattered per-endpoint).** `saveStatement` (`kv-utils.tsx:383`) has **six** callers and `saveDebate` (`:410`) several more, so "call the translator in each create handler" is shotgun surgery — miss one authoring path and untranslated content leaks. But translating *inside* `saveStatement` is equally wrong: `voting-utils` re-saves through it on **every vote**, which would re-translate on each click.
- Resolution: a thin **`createStatement` / `createRoom`** authoring wrapper (or an explicit `translateOnCreate` step) that the *authoring* paths flow through — `room-api.tsx` `POST /room/create` (≈ line 28), `debate-api.tsx` `POST /room/:roomId/statement` (≈ line 661), and the AI generators (`enrichment-service.ts`, `reddit-import-service.ts`, `ggwash-import-service.ts`, rant extraction) — while the vote/merge **update** paths keep calling `saveStatement` untouched. Because the step is idempotent (keyed on text), correctness does not hinge on enumerating every caller perfectly.
- **Edits are a write path too.** `EditRoomModal` mutates the source text, which makes the stored translation stale — so the edit endpoint must run the same translation step. Idempotency handles it for free: text changed → the existing translation no longer matches → re-translate. Editing is not a render-swap site alone.

**Read path — one selector, one algorithm.** New `src/utils/i18n/localizeContent.ts`:
- A single `localize(item, field, lang)` holds the rule (return `i18n[lang][field]` when present and `lang !== sourceLang`, else the original — always falling back to the original). `localizedTopic(room, lang)` and `localizedStatementText(statement, lang)` are one-line delegations to it, so the fallback logic lives in exactly one function.
- Swap render sites to call these with the current `useLanguage()` value: primary `RoomCard.tsx` (`room.topic`) and `room/StatementCard.tsx` (`statement.text`); secondary `SwipeableStatementStack.tsx`, `results/StatementMini.tsx`, `results/ConcludedResults.tsx`/`InProgressResults.tsx`, `analysis/StatementSpectrum*.tsx`, `room/mod/StatementRow.tsx`, `EditRoomModal.tsx`.

**Backfill existing content.** A dev/admin endpoint (or Deno script) iterates `getByPrefix('room:')` and `getByPrefix('statement:')`, prioritizes `needsTranslation` records, skips already-translated ones, translates, and re-saves — batched/rate-limited. It reuses the same idempotent `translateContent`, so backfill and live writes share one code path. Usage is logged automatically by the reused client.

---

## 6. Suggested implementation order

1. **Foundation** — i18next init, `LanguageContext`/`useLanguage`, `LanguageSelector` in the header, localStorage + user-record persistence, dynamic `<html lang>`. The switcher works end-to-end even before any copy is extracted.
2. **UI copy extraction** — core flow first, then the full sweep (largest effort).
3. **Content write path** — schema fields (`LangCode`, open `i18n` map, `needsTranslation`), idempotent `translation-service` with an injected client, a `createStatement`/`createRoom` authoring wrapper wired into the create endpoints + AI generators + the edit path (vote/update paths left untouched), `localizeContent` helpers, render swaps.
4. **Backfill** existing topics/statements.
5. **Polish** — locale-aware number/date formatting (`Intl`/moment), decide on emails (likely out of scope for v1), a future "report bad translation" review mechanism, and additional languages.

## 7. Deliberate non-goals / open questions

- **User nicknames, community names, avatar animals** — not translated in v1 (the "rare intentional exception").
- **Transactional emails** (debate-completion cron) — English-only for v1 unless we later store a per-user language for outbound mail.
- **Translation review** — machine translation can distort nuance in a debate; a future "report/fix translation" flow is worth considering, out of scope now.

## 8. How we'll verify (once implemented)

- Run Vite dev, switch to Spanish, walk the core flow (lobby → open topic → vote → add response → create topic) and confirm **no English** appears.
- Create a topic and a response; inspect the stored KV blob and confirm `sourceLang` + `i18n.es`/`i18n.en` are populated.
- **Bidirectional check:** author a response in Spanish, switch to English, confirm it renders in English.
- **Determinism check:** two sessions render an identical translation of the same post.
- **Fallback check:** remove one `es` key → confirm English fallback (react-i18next).
- **Idempotency check:** vote on a statement repeatedly → confirm no re-translation (no new LLM usage); re-submitting unchanged text is a no-op.
- **Edit check:** edit a topic → confirm the stored translation is refreshed, not left stale.
- **Failure check:** force a translation failure → confirm the post still saves with `needsTranslation: true`, and backfill later picks it up.
- `deno test` for `translation-service` **using an injected fake `LlmClient`** (no live LLM); unit tests for `localize`/`localizeContent` and the translation prompt builder.
