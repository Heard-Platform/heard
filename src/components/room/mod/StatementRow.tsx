import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button";
import { Statement } from "../../../types";

interface StatementRowProps {
  statement: Statement;
  isSource: boolean;
  isTarget: boolean;
  isPending: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
}

export function StatementRow({
  statement,
  isSource,
  isTarget,
  isPending,
  onSelect,
  onToggleHidden,
}: StatementRowProps) {
  const { t } = useTranslation("mod");
  const isHidden = !!statement.isHidden;
  const voteSummary = t("modVoteSummary", {
    agrees: statement.agrees,
    disagrees: statement.disagrees,
    total: statement.agrees + statement.disagrees + statement.passes + statement.superAgrees,
  });

  const containerClass = [
    "rounded-lg border text-sm transition-colors flex items-stretch",
    isHidden
      ? "border-border bg-muted/40 opacity-60"
      : isSource
      ? "attention-border attention-bg"
      : isTarget
      ? "resolved-border resolved-bg"
      : "border-border bg-background",
  ].join(" ");

  return (
    <div className={containerClass}>
      <button
        type="button"
        onClick={onSelect}
        disabled={isHidden}
        className={[
          "flex-1 text-left px-4 py-3 rounded-l-lg",
          isHidden ? "cursor-not-allowed" : "hover:bg-muted",
        ].join(" ")}
      >
        <p className="font-medium leading-snug">{statement.text}</p>
        <p className="text-xs text-muted-foreground mt-1">{voteSummary}</p>
        {isHidden && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">{t("modHiddenLabel")}</p>
        )}
        {!isHidden && isSource && (
          <p className="text-xs attention-text mt-1 font-medium">
            {t("modMergingFrom")}
          </p>
        )}
        {!isHidden && isTarget && (
          <p className="text-xs resolved-text mt-1 font-medium">
            {t("modMergingInto")}
          </p>
        )}
      </button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleHidden}
        disabled={isPending}
        className="shrink-0 self-center mr-2"
        aria-label={isHidden ? t("modUnhide") : t("modHide")}
        title={isHidden ? t("modUnhideShort") : t("modHideShort")}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isHidden ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
