import enCommon from "./locales/en/common.json";
import esCommon from "./locales/es/common.json";

export const defaultNS = "common";

export const resources = {
  en: { common: enCommon },
  es: { common: esCommon },
} as const;
