import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu";
import { useLanguage } from "../contexts/LanguageContext";
import { SUPPORTED_LANGUAGES, LangCode } from "../i18n/languages";
import { LanguageFlag } from "./flags/LanguageFlag";

export function LanguageSelector() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("language")}
          className="flex items-center gap-1 h-9 px-2.5 rounded-full bg-white/90 backdrop-blur border border-black/5 shadow-sm hover:bg-white transition-colors"
        >
          <LanguageFlag
            code={language}
            className="w-5 h-[14px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
          />
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9rem]">
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(value: string) => setLanguage(value as LangCode)}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <DropdownMenuRadioItem key={lang.code} value={lang.code} className="gap-2">
              <LanguageFlag code={lang.code} className="w-5 h-[14px] rounded-[2px]" />
              <span>{lang.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
