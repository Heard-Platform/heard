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
  SUPPORTED_LANGUAGES.some((language) => language.code === value);

export const normalizeToLangCode = (value: string): LangCode => {
  const base = value.slice(0, 2).toLowerCase();
  return isLangCode(base) ? base : DEFAULT_LANG;
};

export const applyDocumentLanguage = (code: string): void => {
  const language =
    SUPPORTED_LANGUAGES.find((entry) => entry.code === code) ?? SUPPORTED_LANGUAGES[0];
  document.documentElement.lang = language.code;
  document.documentElement.dir = language.dir;
};
