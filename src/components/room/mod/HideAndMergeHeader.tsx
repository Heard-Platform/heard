import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DialogTitle } from "../../ui/dialog";

export function HideAndMergeHeader() {
  const { t } = useTranslation("mod");
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="px-6 pt-6 pb-4 border-b">
      <DialogTitle className="text-base font-semibold">{t("modTitle")}</DialogTitle>
      <p className="text-sm text-muted-foreground mt-1">
        {t("modSubtitle")}
      </p>
      <button
        className="flex items-center gap-1 text-xs text-muted-foreground mt-1"
        onClick={() => setShowHelp((v) => !v)}
      >
        {showHelp ? t("modShowLess") : t("modLearnMore")}
        {showHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {showHelp && (
        <p className="text-sm text-muted-foreground mt-1">
          {t("modHelp")}
        </p>
      )}
    </div>
  );
}
