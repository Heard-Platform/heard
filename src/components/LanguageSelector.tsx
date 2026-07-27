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

export function LanguageSelector() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("language")}
          className="flex items-center gap-1 h-9 px-3 rounded-full bg-white/90 backdrop-blur border border-black/5 shadow-sm hover:bg-white transition-colors"
        >
          <span className="text-sm font-medium tracking-wide text-gray-700">
            {language.slice(0, 2).toUpperCase()}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9rem]">
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(value: string) => setLanguage(value as LangCode)}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <DropdownMenuRadioItem key={lang.code} value={lang.code}>
              {lang.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
