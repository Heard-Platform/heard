import { FC } from "react";
import { Globe } from "lucide-react";
import { LangCode } from "../../i18n/languages";
import { EnFlag } from "./EnFlag";
import { EsFlag } from "./EsFlag";

type FlagProps = { className?: string };

const FLAGS: Partial<Record<LangCode, FC<FlagProps>>> = {
  en: EnFlag,
  es: EsFlag,
};

export function LanguageFlag({ code, className }: { code: LangCode; className?: string }) {
  const Flag = FLAGS[code];
  if (!Flag) return <Globe className={className} aria-hidden="true" />;
  return <Flag className={className} />;
}
