import enCommon from "./locales/en/common.json";
import esCommon from "./locales/es/common.json";
import enRoom from "./locales/en/room.json";
import esRoom from "./locales/es/room.json";
import enToast from "./locales/en/toast.json";
import esToast from "./locales/es/toast.json";

export const defaultNS = "common";

export const resources = {
  en: { common: enCommon, room: enRoom, toast: enToast },
  es: { common: esCommon, room: esRoom, toast: esToast },
} as const;
