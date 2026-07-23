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

export const DEFAULT_LANG: LangCode = "en";

export const SUPPORTED_LANGUAGES: ReadonlyArray<{ code: LangCode; label: string }> = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

export const isLangCode = (value: string): value is LangCode =>
  SUPPORTED_LANGUAGES.some((l) => l.code === value);
```

- `src/i18n/locales/{en,es}/*.json` — resource catalogs, namespaced by area: `common`, `lobby`, `room`, `create`, `menu`, `results`, `toast`. Start each `es` file as a copy of `en` so nothing is missing during the sweep.
- `src/i18n/resources.ts` — imports the `en` JSON namespaces and exports a `resources` object plus `defaultNS`. This object also becomes the **type source** for typed keys.
- `src/i18n/index.ts` — initializes the singleton:

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, defaultNS } from "./resources";
import { DEFAULT_LANG, isLangCode, LangCode } from "./languages";
import { safelyGetStorageItem } from "../utils/localStorage";

export const LANGUAGE_STORAGE_KEY = "selectedLanguage";

const detectInitialLang = (): LangCode => {
  const stored = safelyGetStorageItem<string>(LANGUAGE_STORAGE_KEY, "");
  if (isLangCode(stored)) return stored;
  const browser = navigator.language.slice(0, 2);
  return isLangCode(browser) ? browser : DEFAULT_LANG;
};

i18n.use(initReactI18next).init({
  resources,
  defaultNS,
  lng: detectInitialLang(),
  fallbackLng: DEFAULT_LANG,
  interpolation: { escapeValue: false },
});

export default i18n;
```

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

- `src/hooks/useLanguageState.ts` — the logic: current language from `i18n.language`, plus `setLanguage()` that calls `i18n.changeLanguage`, persists to localStorage, and updates `<html lang>`. It also sets `<html lang>` once on mount to match the detected language.

```ts
import { useState, useEffect, useCallback } from "react";
import i18n, { LANGUAGE_STORAGE_KEY } from "../i18n";
import { LangCode } from "../i18n/languages";
import { safelySetStorageItem } from "../utils/localStorage";

export interface LanguageState {
  language: LangCode;
  setLanguage: (lang: LangCode) => void;
}

export const useLanguageState = (): LanguageState => {
  const [language, setLanguageValue] = useState(i18n.language as LangCode);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: LangCode) => {
    i18n.changeLanguage(lang);
    safelySetStorageItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    setLanguageValue(lang);
  }, []);

  return { language, setLanguage };
};
```

- `src/contexts/LanguageContext.tsx` — the provider + `useLanguage()` hook, modeled exactly on `RoomAlertsContext.tsx` (context, provider, hook that throws if used outside).
- Wire the provider in `src/App.tsx`, wrapping `<AppContent/>` alongside `DebateSessionProvider`:

```tsx
<DebateSessionProvider>
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
</DebateSessionProvider>
```

> `useTranslation()` already re-renders components on `changeLanguage`, so the context is a thin, single-API convenience (and the home for persistence + `<html lang>` side effects), not a re-render mechanism.

### Step 3 — Selector UI

- `src/components/LanguageSelector.tsx` — built from `ui/dropdown-menu`'s `DropdownMenuRadioGroup`/`DropdownMenuRadioItem`, driven by `SUPPORTED_LANGUAGES`, reading/writing via `useLanguage()`. Styled as a compact `rounded-full bg-white/90 …` pill to match the toolbar.
- **Flags:** two inline SVG components (`src/components/flags/EsFlag.tsx`, `EnFlag.tsx`) — trivial rectangles, no dependency, no CSP concern. The trigger shows the current flag; each row shows flag + label ("English" / "Español").
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

**Two smaller structural touches:**
3. **Relative time.** `moment(...).fromNow()` and countdown badges (`StatementCard`, `TimeLeftBadge`, `RealtimeCountdown`) → `import "moment/locale/es"` and call `moment.locale(lang)` from the language hook. `moment` is already a dependency.
4. **Native dialogs.** `window.confirm(...)` / `alert(...)` copy (e.g. StatementCard hide-confirm, LobbyScreen invite alert) → `t()` the strings; the dialogs stay native.

**P1 — secondary (non-blocking):** other `screens/*`, `components/results/*`, `components/analysis/*` (viewer side), `components/community/*`, `components/events/*`, dialogs/modals (`room/mod/*`, `FeedbackSheet`, `FlagResponseDialog`, `QRScanResultDialog`, community dialogs).

**P3 — deferred / skip for launch:** `components/devtools/*`, `components/admin/*`, `AdminPanel`, `AdminDashboard`, `PolisImporter`, `ComponentShowcase`, `stories/*`. Internal tooling — English is acceptable.

### Step 6 — Cross-device persistence (OPTIONAL)

localStorage covers the requirement for a single device. To make the choice follow a logged-in user across devices, add `language?: LangCode` to `UserSession` (`src/types/index.ts`) and the server user record (`user-utils.ts`, schemaless — no migration), persist on change through the existing user-update path, and hydrate on login. **Recommendation:** ship Phase 1 with localStorage only (pure frontend, zero backend risk); add this as a fast follow if wanted.

## 6. Conventions

- **Keys:** `t('namespace.descriptiveName')`, camelCase leaf (`room.respondButton`, `toast.responseSubmitted`). Namespaces match Step 1.
- **One key = one complete, standalone sentence or label.** Never assemble a sentence from multiple keys; use interpolation with **noun** variables only. This is the rule that keeps Spanish (and future languages) grammatical.
- **Interpolation:** `t('room.votesOnResponses', { votes, responses })`; pluralize with `count`.
- **Code style:** no code comments — the keys and helper names carry the meaning (consistent with the repo's self-documenting convention).
- **`es` starts as a copy of `en`,** then gets translated, so a namespace is never half-missing mid-edit; genuinely missing keys fall back to English by config.

## 7. Testing & verification

- **Unit (vitest):** `useLanguageState` — `setLanguage` changes `i18n.language`, writes localStorage, sets `document.documentElement.lang`. `LanguageSelector` — renders both options, selecting one calls `setLanguage`.
- **Render flip:** mount a small tree using `t()`, call `changeLanguage('es')`, assert visible text changed.
- **Fallback:** delete one `es` key → confirm the English value renders (not the raw key). Consider a temporary pseudo-locale run to spot un-extracted strings (anything still English on a fully-pseudo screen hasn't been extracted).
- **Manual walk (the DoD):** switch to Español, walk lobby → topic → vote → respond → create → menu, confirm **no English** on that path and that toasts are Spanish. Reload — language sticks. Check `<html lang="es">`.
- **Typecheck:** `tsc` must pass with typed keys (a mistyped key fails the build).

## 8. Risks & gotchas

- **Partial extraction still shows English.** Expected and safe — but "no English" is only true for screens whose strings are both extracted and translated. Track P0 to completion before claiming the core journey.
- **Fragment concatenation & plurals** (Step 5 refactors) are the two places a naive extraction produces broken Spanish. Handle them inline.
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

## 10. Open questions

- **Legal pages (Terms/Privacy):** translate now, or keep English with a note? (Recommend: defer — long-form, low-churn, separate from UI catalogs.)
- **Cross-device persistence** (Step 6): in Phase 1, or fast follow? (Recommend: fast follow.)
- **Pre-login surfaces:** anonymous users are auto-created and land in the lobby, so the header selector covers the main entry. Do the standalone landing screens (`orgs`, `fund`, `1billion`) need the selector in Phase 1, or is P1 fine? (Recommend: P1.)
