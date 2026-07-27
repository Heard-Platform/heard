import moment from "moment";
import "moment/locale/es";
import type { LangCode } from "./languages";

const MOMENT_LOCALE: Record<LangCode, string> = {
  en: "en",
  es: "es",
};

export const applyMomentLocale = (code: string): void => {
  moment.locale(MOMENT_LOCALE[code as LangCode] ?? "en");
};
