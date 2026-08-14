import enPostControls from "./locales/en/postControls.json";
import esPostControls from "./locales/es/postControls.json";

export const defaultNS = "common";

export const resources = {
  en: { postControls: enPostControls, },
  es: { postControls: esPostControls, },
} as const;
