import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, defaultNS } from "./resources";
import { DEFAULT_LANG, normalizeToLangCode, applyDocumentLanguage } from "./languages";
import { applyMomentLocale } from "./momentLocale";
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
applyMomentLocale(i18n.language);
i18n.on("languageChanged", applyDocumentLanguage);
i18n.on("languageChanged", applyMomentLocale);

export default i18n;
