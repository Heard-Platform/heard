import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Button } from "./ui/button";
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
  const currentLabel =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === language)?.label ??
    language;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          aria-label={t("language")}
          variant="outline"
          className="w-full"
        >
          <Globe className="w-4 h-4 mr-2" />
          Change Language ({currentLabel})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[9rem] z-600">
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
