import enCommon from "./locales/en/common.json";
import esCommon from "./locales/es/common.json";
import enRoom from "./locales/en/room.json";
import esRoom from "./locales/es/room.json";

export const defaultNS = "common";

export const resources = {
  en: { common: enCommon, room: enRoom },
  es: { common: esCommon, room: esRoom },
} as const;
