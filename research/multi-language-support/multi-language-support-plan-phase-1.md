# Multi-Language Support — Phase 1: Website Copy Only (System A)

> Parent design: [`multi-language-support-plan.md`](./multi-language-support-plan.md) · Diagram: [`multi-language-support-flow.excalidraw`](./multi-language-support-flow.excalidraw)
>
> Status: **implementation plan** — this is the scoped, buildable slice we intend to ship first.

## 1. Scope

Phase 1 is **System A only**: the user's language choice changes the **website's own copy** (buttons, labels, placeholders, menus, toasts, native `alert`/`confirm` dialogs). Starting with **Spanish**.

**Explicitly out of scope for Phase 1** (deferred to a later phase — see the parent plan's System B):
- Translating **user-generated content** — topics, descriptions, response statements. Those keep rendering exactly as authored, in whatever language the author wrote them. No `translation-service`, no `i18n`/`sourceLang` fields on `Statement`/`DebateRoom`, no backfill, no write-path changes, no LLM calls.
- Legal long-form copy (`terms-of-service.ts`, `privacy-policy.ts`) — English-only for now (open question in §10).
- Transactional emails — English-only.

This means a Spanish user will read every **button, label, and system message** in Spanish, but a topic someone wrote in English still appears in English. That is the intended Phase 1 boundary.

## 2. Definition of done

Phase 1 ships when:
1. A language selector (flag + label) sits in the lobby toolbar; picking **Español** switches all extracted UI copy instantly, with **no reload**.
2. The choice **persists** across reloads (localStorage) and sets `<html lang>` correctly.
3. The **core user journey is fully Spanish** with zero English leaking: lobby → open a topic → vote → add a response → create a conversation → main menu, including all toasts on those paths.
4. Everything **not yet extracted falls back to English** gracefully (never a raw `key` string, never a crash).
5. Unit tests cover the language hook and selector; a render test proves a flip from `en`→`es` changes visible text.

The long tail (secondary screens, dialogs, dev/admin) is tracked but **not blocking** — react-i18next's English fallback makes partial extraction safe to ship.

> Note on "never see English": that goal is met **per screen, as each screen's strings are both extracted and translated.** An un-extracted literal always shows English regardless of language. So the P0 set (§6) must be extracted *and* have `es` values before we claim the core journey is done.

## 3. Grounded findings (from the codebase)

| Fact | Source | Implication |
|---|---|---|
| No i18n of any kind exists | repo-wide search: 0 hits for `i18next`/`useTranslation`/`t(` | Greenfield; we set the conventions. |
| ~1,200–1,800 user-facing literals across ~150–190 files; **108 `toast.*` in 24 files** | inventory sweep | Extraction must be phased (§6); it is the bulk of the labor. |
| Providers: `<DebateSessionProvider>` inside a Sentry boundary; `main.tsx` renders `<App/>` | `src/App.tsx:782`, `src/main.tsx:13` | Clean spots to init i18n and add the provider. |
| `<html lang="en">` hardcoded | `index.html:3` | Set `document.documentElement.lang` dynamically. |
| `UserSession` has no `language` field | `src/types/index.ts:182` | Cross-device persistence needs a (small, schemaless) user-record touch — kept **optional** (§7). |
| Versioned import aliases (`sonner@2.0.3` → `sonner`) | `vite.config.ts:30` | Figma-Make artifact. **Our new deps import plainly** (`from "react-i18next"`); no alias entry needed. |
| Dropdown primitives export `DropdownMenuRadioGroup`/`DropdownMenuRadioItem` | `src/components/ui/dropdown-menu.tsx:250` | The selector reuses these — no new UI primitive. |
| Context pattern: `createContext` + provider + hook-that-throws | `src/contexts/RoomAlertsContext.tsx` | Copy this shape for `LanguageContext`. |
| `vitest` + `@vitest/browser` + `playwright` configured; `npm test` → `vitest run` | `package.json:88` | Tests use vitest. |
| Body font is Nunito | `index.html:19` | Supports Spanish diacritics (á, ñ, ¿, ¡) — no font change needed. |

## 4. Dependencies

Add to `package.json` and import **plainly** (the versioned-alias convention in `vite.config.ts` is only for Figma-generated imports; real bare specifiers resolve normally):

- **`i18next`** — the core engine (interpolation, plurals, fallback).
- **`react-i18next`** — React bindings (`useTranslation`, re-render on language change).

**Deliberately skipped:** `i18next-browser-languagedetector`. With only two languages and our own persistence, first-visit detection is a three-line read of `navigator.language`. Skipping the package keeps dependencies minimal and the detection logic explicit and self-documenting.

No flag-icon dependency either — we inline two small SVGs (§5, Step 3). Unicode flag emoji render as bare letters ("ES"/"US") on Chrome-on-Windows, so emoji are not an option.

## 5. Build order

Build the **switching machinery first and prove it end-to-end on a few strings** (a walking skeleton), *then* do the bulk extraction. That way the risky wiring is validated before the tedious sweep.

### Step 1 — i18n bootstrap

- `src/i18n/languages.ts` — the single source of truth for supported languages (drives both the selector and i18next):

```ts
export type LangCode = "en" | "es";
export type Direction = "ltr" | "rtl";

export interface LanguageConfig {
  code: LangCode;
  label: string;
  dir: Direction;
}

export const DEFAULT_LANG: LangCode = "en";

export const SUPPORTED_LANGUAGES: ReadonlyArray<LanguageConfig> = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
];

export const isLangCode = (value: string): value is LangCode =>
  SUPPORTED_LANGUAGES.some((l) => l.code === value);

export const normalizeToLangCode = (value: string): LangCode => {
  const base = value.slice(0, 2).toLowerCase();
  return isLangCode(base) ? base : DEFAULT_LANG;
};

export const applyDocumentLanguage = (code: string): void => {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? SUPPORTED_LANGUAGES[0];
  document.documentElement.lang = lang.code;
  document.documentElement.dir = lang.dir;
};
```

`dir` and `normalizeToLangCode` are the cheap-now, painful-later hooks: they keep the door open for a right-to-left language and for collapsing regional variants (`es-419` → `es`) without touching call sites. `label` is the primary affordance in the selector — **the flag is optional decoration** (see Step 3), because "one flag per language" is both code-per-language and a country≠language UX trap.

- `src/i18n/locales/{en,es}/*.json` — resource catalogs, namespaced by area: `common`, `lobby`, `room`, `create`, `menu`, `results`, `toast`. Start each `es` file as a copy of `en` so nothing is missing during the sweep.
- `src/i18n/resources.ts` — imports the `en` JSON namespaces and exports a `resources` object plus `defaultNS`. This object also becomes the **type source** for typed keys.
- `src/i18n/index.ts` — initializes the singleton:

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, defaultNS } from "./resources";
import { DEFAULT_LANG, normalizeToLangCode, applyDocumentLanguage } from "./languages";
import { safelyGetStorageItem } from "../utils/localStorage";

export const LANGUAGE_STORAGE_KEY = "selectedLanguage";

const detectInitialLang = () =>
  normalizeToLangCode(
    safelyGetStorageItem<string>(LANGUAGE_STORAGE_KEY, "") || navigator.language,
  );

i18n.use(initReactI18next).init({
  resources,
  defaultNS,
  lng: detectInitialLang(),
  fallbackLng: DEFAULT_LANG,
  interpolation: { escapeValue: false },
});

applyDocumentLanguage(i18n.language);
i18n.on("languageChanged", applyDocumentLanguage);

export default i18n;
```

The `<html lang>`/`<html dir>` side effect is registered here, once, as the **single owner** — no component and no React effect writes it. When lazy-loading is added later, route the `resources` import through a single `loadCatalog(lang)` indirection so the call sites never change.

- Import it for its side effect in `src/main.tsx`, **before** `createRoot(...).render`:

```ts
import "./i18n";
```

- `src/react-i18next.d.ts` — typed keys via module augmentation, so `t('room.respond')` autocompletes and a missing key is a compile error:

```ts
import { resources, defaultNS } from "./i18n/resources";

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["en"];
  }
}
```

### Step 2 — Language state, persistence, `<html lang>`

- `src/hooks/useProvideLanguage.ts` — the logic. The i18next singleton is the **single source of truth**; we subscribe to it with `useSyncExternalStore` (React 18's idiom for an external store) rather than mirroring `i18n.language` into a `useState` that could drift. `setLanguage` only persists and delegates — the DOM side effect is owned by the init listener (Step 1), not here.

```ts
import { useCallback, useSyncExternalStore } from "react";
import i18n, { LANGUAGE_STORAGE_KEY } from "../i18n";
import { LangCode } from "../i18n/languages";
import { safelySetStorageItem } from "../utils/localStorage";

export interface LanguageState {
  language: LangCode;
  setLanguage: (lang: LangCode) => void;
}

const subscribe = (onChange: () => void) => {
  i18n.on("languageChanged", onChange);
  return () => i18n.off("languageChanged", onChange);
};

export const useProvideLanguage = (): LanguageState => {
  const language = useSyncExternalStore(subscribe, () => i18n.language as LangCode);

  const setLanguage = useCallback((lang: LangCode) => {
    safelySetStorageItem(LANGUAGE_STORAGE_KEY, lang);
    i18n.changeLanguage(lang);
  }, []);

  return { language, setLanguage };
};
```

- `src/contexts/LanguageContext.tsx` — the provider (calls `useProvideLanguage`) + `useLanguage()` consumer hook, modeled exactly on `RoomAlertsContext.tsx` (context, provider, hook that throws if used outside). Components import **`useLanguage()` only** — never the `i18n` singleton directly; that keeps the third-party surface at one seam.
- Wire the provider in `src/App.tsx`, wrapping `<AppContent/>` alongside `DebateSessionProvider`:

```tsx
<DebateSessionProvider>
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
</DebateSessionProvider>
```

> `useTranslation()` already re-renders components on `changeLanguage`; the context is a thin, single-API convenience over that, with **one** source of truth (the singleton, read via `useSyncExternalStore`) and **one** owner of the DOM side effect (the init listener). No mirrored state, no duplicated `<html lang>` write.

### Step 3 — Selector UI

- `src/components/LanguageSelector.tsx` — built from `ui/dropdown-menu`'s `DropdownMenuRadioGroup`/`DropdownMenuRadioItem`, driven by `SUPPORTED_LANGUAGES`, reading/writing via `useLanguage()`. Styled as a compact `rounded-full bg-white/90 …` pill to match the toolbar.
- **Label-primary, flag-optional.** Each row shows the **native label** ("English" / "Español") as the primary affordance, with an optional decorative flag. Keep two inline SVG flags (`src/components/flags/EsFlag.tsx`, `EnFlag.tsx`) for the current pair if desired — trivial, no dependency, no CSP concern — but the selector must render fine for a language that has *no* flag (a neutral globe glyph is the fallback). Rationale: "one flag per language" is both code-per-language and a country≠language trap (Spanish isn't only Spain; English isn't only the US/UK). This keeps the selector open for the many-languages future.
- **Placement:** the lobby floating header (`src/screens/LobbyScreen.tsx:350–423`) is crowded on mobile (`max-w-[420px]`: `SubHeardBrowser` + `NewItemButton` + `SidePanelMenu`). Use a **compact flag-only trigger** to fit. If it's too tight, the fallback is a language row **inside `SidePanelMenu`** (still a `DropdownMenuRadioGroup`). Primary recommendation: compact pill in the header, matching the user's "classic top-toolbar dropdown" vision.
- Also mount it in the `EventView` toolbar (secondary; P1). Standalone landing screens (`OrgsLanding`, `FundingPage`, etc.) render without the lobby header — they're P1 and can get the selector when their copy is extracted.

### Step 4 — Walking skeleton (prove the loop)

Before the sweep: extract ~5 strings from `RoomCard` (e.g. "Respond", "Results") into `room.json`, translate them, switch to Español, and confirm they flip live and survive a reload. This validates init, context, persistence, `<html lang>`, typed keys, and the selector as one working unit.

### Step 5 — Extraction sweep (the bulk; phased by the real inventory)

Replace inline literals with `t('ns.key')`. Order by user impact:

**P0 — core journey (ship-blocking):** ~8 files + the toast layer.
- `RoomCard.tsx` (~15), `room/StatementCard.tsx` (~11), `room/AddResponseModal.tsx` (~11), `CreateRoomSheet.tsx` (~28) + `create-room/*` (the high-density steps: `WriteRantStep`, `ReviewExtractionStep`, `ComposePostStep`, `ShareDebateStep`), `SidePanelMenu.tsx`, `LobbyScreen.tsx` (incl. its `alert()` copy).
- **Toast layer:** the 108 `toast.*` calls (concentrated in `App.tsx`, `RoomCardMenu.tsx`, `SwipeableStatementStack.tsx`, `CreateRoomSheet.tsx`, and the create/room flow) → a `toast` namespace. High value, mechanical.

**Two structural refactors — do these *as* you extract, not after:**
1. **Sentence fragments → whole sentences.** `AnonAccountSetupModal`'s `featureText` pattern injects fragments ("voting in this conversation", "responding to this post") into a surrounding sentence. Grammatical concatenation breaks in Spanish. Restructure so each **complete sentence** is one key (e.g. distinct keys per call site, or an interpolated key where the *variable* is a noun, not a clause).
2. **Pluralization.** `${totalVotes} votes`, `{totalVotes} votes on {n} responses` (`StatementCard.tsx:163`, `RoomCard.tsx:275`) → i18next plural keys (`votes_one`/`votes_other`) with `count`. Spanish has its own plural rules; let i18next handle them.

**Three smaller structural touches:**
3. **Module-scope constant copy.** `menuItems` (`HamburgerMenu.tsx:10`), `MODE_LABELS` (`StatementSpectrum.tsx:48`), `topicExamples` (`WriteRantStep.tsx:12`), `VOTE_LABELS` (`VoteMatrix.tsx:17`), `VERIFY_TEXT` (`constants/text.ts:1`), etc. are evaluated at **import time** and cannot call `t()` there — it would run before init and never update on a language switch. Convert each to a render-time getter (`getMenuItems(t)`) or an array of catalog **keys** resolved inside the component. This is a real trap, not a style nit.
4. **Relative time.** `moment(...).fromNow()` and countdown badges (`StatementCard`, `TimeLeftBadge`, `RealtimeCountdown`) → a single `applyMomentLocale(lang)` (map of `LangCode` → imported moment locale) called from the init listener; `moment` is already a dependency. (Ticket for later: moment is in maintenance mode — a move to `Intl`/`date-fns` is worth doing eventually, not in Phase 1.)
5. **Native dialogs.** `window.confirm(...)` / `alert(...)` copy (e.g. StatementCard hide-confirm, LobbyScreen invite alert) → `t()` the strings; the dialogs stay native.

**P1 — secondary (non-blocking):** other `screens/*`, `components/results/*`, `components/analysis/*` (viewer side), `components/community/*`, `components/events/*`, dialogs/modals (`room/mod/*`, `FeedbackSheet`, `FlagResponseDialog`, `QRScanResultDialog`, community dialogs).

**P3 — deferred / skip for launch:** `components/devtools/*`, `components/admin/*`, `AdminPanel`, `AdminDashboard`, `PolisImporter`, `ComponentShowcase`, `stories/*`. Internal tooling — English is acceptable.

### Step 6 — Cross-device persistence (OPTIONAL)

localStorage covers the requirement for a single device. To make the choice follow a logged-in user across devices, add `language?: LangCode` to `UserSession` (`src/types/index.ts`) and the server user record (`user-utils.ts`, schemaless — no migration), persist on change through the existing user-update path, and hydrate on login. **Recommendation:** ship Phase 1 with localStorage only (pure frontend, zero backend risk); add this as a fast follow if wanted.

## 6. Conventions

- **Keys:** `t('namespace.descriptiveName')`, camelCase leaf (`room.respondButton`, `toast.responseSubmitted`). Namespaces match Step 1.
- **One key = one complete, standalone sentence or label.** Never assemble a sentence from multiple keys; use interpolation with **noun** variables only. This is the rule that keeps Spanish (and future languages) grammatical.
- **Interpolation:** `t('room.votesOnResponses', { votes, responses })`; pluralize with `count`.
- **`t()` runs only inside render or an event handler — never at module scope.** Module-level copy becomes a getter or a catalog-key list (see Step 5 refactor #3).
- **Components never import the `i18n` singleton directly** — only the provider hook does. Components use `useLanguage()` / `useTranslation()`. One third-party seam.
- **Code style:** no code comments — the keys and helper names carry the meaning (consistent with the repo's self-documenting convention).
- **`es` starts as a copy of `en`,** then gets translated, so a namespace is never half-missing mid-edit; genuinely missing keys fall back to English by config.

## 7. Testing & verification

- **Test harness (do this first):** there is a `vitest.config.ts` but **no setup that initializes i18n**, so component tests that call `t()` would render raw keys or throw. Add `src/test/renderWithI18n.tsx` (wraps `I18nextProvider`) and a `setupFiles` entry importing `./i18n`. Clean tests need a clean fixture.
- **Unit (vitest):** `useProvideLanguage` — `setLanguage` changes `i18n.language` and writes localStorage; the hook re-reports the new language via its store subscription. `applyDocumentLanguage` — sets `<html lang>` and `<html dir>`. `LanguageSelector` — renders both options, selecting one calls `setLanguage`.
- **`en`/`es` key parity:** a small CI check that the two catalogs have identical key sets (typed keys already guarantee no missing `en` key at compile time; this catches `es` drift).
- **Render flip:** mount a small tree using `t()`, call `changeLanguage('es')`, assert visible text changed.
- **Fallback:** delete one `es` key → confirm the English value renders (not the raw key). Consider a temporary pseudo-locale run to spot un-extracted strings (anything still English on a fully-pseudo screen hasn't been extracted).
- **Manual walk (the DoD):** switch to Español, walk lobby → topic → vote → respond → create → menu, confirm **no English** on that path and that toasts are Spanish. Reload — language sticks. Check `<html lang="es">`.
- **Typecheck:** `tsc` must pass with typed keys (a mistyped key fails the build).

## 8. Risks & gotchas

- **Partial extraction still shows English.** Expected and safe — but "no English" is only true for screens whose strings are both extracted and translated. Track P0 to completion before claiming the core journey.
- **Fragment concatenation & plurals** (Step 5 refactors) are the two places a naive extraction produces broken Spanish. Handle them inline.
- **Module-scope `t()`** is a silent trap — top-level constants can't translate and won't react to a switch. The Step 5 #3 refactor and the §6 rule exist to catch this; watch for it in every constants file and label map.
- **One source of truth, enforced.** The language lives only in the i18next singleton (read via `useSyncExternalStore`); the `<html lang>`/`dir` write has one owner (the init listener). Don't reintroduce a mirrored `useState` or a second DOM write.
- **Crowded mobile header** — mitigated by a compact flag-only trigger; in-menu fallback exists.
- **`moment` global locale** — `moment.locale()` is global; set it from the language hook so relative times match the UI.
- **Scale** — ~1,200–1,800 literals is a real effort. Phase 1's *shippable* milestone is the P0 core journey, not 100% coverage; the rest lands incrementally behind the English fallback.

## 9. Suggested commit breakdown

1. deps + `src/i18n/*` bootstrap + typed-keys augmentation + init in `main.tsx`.
2. `useLanguageState` + `LanguageContext` + provider in `App.tsx`.
3. `LanguageSelector` + inline flag SVGs + mount in lobby header.
4. Walking skeleton (RoomCard ~5 strings, en+es).
5. P0 extraction: toast namespace.
6. P0 extraction: core-flow files, incl. the fragment + plural refactors and moment locale.
7. (optional) cross-device persistence via user record.
8+. P1 screens/dialogs, incrementally.

## 10. Decisions (resolved)

- **Legal pages (Terms/Privacy):** **deferred** — English-only for Phase 1; long-form, low-churn, handled separately from UI catalogs.
- **Cross-device persistence** (Step 6): **fast follow** — Phase 1 ships localStorage-only (pure frontend, zero backend risk).
- **Standalone landing screens** (`orgs`, `fund`, `1billion`): **P1**, not ship-blocking. The lobby header selector covers the main entry (anon users are auto-created and land there).
- **`LangCode` granularity:** language-only 2-letter codes; regional variants normalized down centrally (`normalizeToLangCode`).
- **Catalog loading:** bundle both languages for Phase 1, behind a `loadCatalog(lang)` seam so lazy-loading is a later one-file change.
- **RTL:** `dir` carried in the language config now (all `ltr`); the DOM write handles it. No RTL language yet, but the seam exists.
- **Selector:** label-primary, flag-optional.
- **Key hygiene:** typed keys (compile-time) + an `en`/`es` parity check in CI. Unused-key detection deferred.

**Still genuinely open (one, and it's a process call, not code):**
- **Who authors the Spanish, and to what quality bar** — recommend LLM-seeding the `es` catalog and then a fluent-human review pass over the **P0** strings before we call the core journey "done." UI copy is short but brand-sensitive. This gates the DoD, not the build.

## 11. Extensibility checklist — cost to add language *N*

The design is built so a new language is a bounded, mostly-data change. To add one:
1. Add the code to the `LangCode` union and an entry (with `dir`) to `SUPPORTED_LANGUAGES` — the selector picks it up automatically.
2. Add a `src/i18n/locales/<code>/` folder (seed from `en`, translate). `fallbackLng` covers any gaps.
3. If the language needs relative-time formatting, add its moment locale to the `applyMomentLocale` map (one line).
4. Optionally add a flag SVG — **or don't** (label + globe fallback).
5. Nothing else. No component edits, no render-site changes, no schema.

The three spots that are *code* per language (not pure data) — the moment-locale map, an optional flag, and (at scale) the lazy-load registration — are each centralized to one file, so this list stays short as languages accumulate.
