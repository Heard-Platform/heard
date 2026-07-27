import enCommon from "./locales/en/common.json";
import esCommon from "./locales/es/common.json";
import enRoom from "./locales/en/room.json";
import esRoom from "./locales/es/room.json";
import enToast from "./locales/en/toast.json";
import esToast from "./locales/es/toast.json";
import enCreate from "./locales/en/create.json";
import esCreate from "./locales/es/create.json";
import enMenu from "./locales/en/menu.json";
import esMenu from "./locales/es/menu.json";
import enAccount from "./locales/en/account.json";
import esAccount from "./locales/es/account.json";
import enCommunity from "./locales/en/community.json";
import esCommunity from "./locales/es/community.json";
import enResults from "./locales/en/results.json";
import esResults from "./locales/es/results.json";
import enAnalysis from "./locales/en/analysis.json";
import esAnalysis from "./locales/es/analysis.json";
import enEvents from "./locales/en/events.json";
import esEvents from "./locales/es/events.json";
import enDialog from "./locales/en/dialog.json";
import esDialog from "./locales/es/dialog.json";
import enScreens from "./locales/en/screens.json";
import esScreens from "./locales/es/screens.json";

export const defaultNS = "common";

export const resources = {
  en: { common: enCommon, room: enRoom, toast: enToast, create: enCreate, menu: enMenu, account: enAccount, community: enCommunity, results: enResults, analysis: enAnalysis, events: enEvents, dialog: enDialog, screens: enScreens },
  es: { common: esCommon, room: esRoom, toast: esToast, create: esCreate, menu: esMenu, account: esAccount, community: esCommunity, results: esResults, analysis: esAnalysis, events: esEvents, dialog: esDialog, screens: esScreens },
} as const;
