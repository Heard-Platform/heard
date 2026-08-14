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
