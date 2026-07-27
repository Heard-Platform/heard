import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ShowNumbersToggleProps {
  showNumbers: boolean;
  onShowNumbersChange: (show: boolean) => void;
}

export function ShowNumbersToggle({ showNumbers, onShowNumbersChange }: ShowNumbersToggleProps) {
  const { t } = useTranslation("analysis");
  return (
    <button
      type="button"
      onClick={() => onShowNumbersChange(!showNumbers)}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {showNumbers ? (
        <>
          <ChevronUp className="w-3 h-3" />
          {t("hideNumbers")}
        </>
      ) : (
        <>
          <ChevronDown className="w-3 h-3" />
          {t("showNumbers")}
        </>
      )}
    </button>
  );
}
