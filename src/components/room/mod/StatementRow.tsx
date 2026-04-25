import { Eye, EyeOff, Loader2 } from "lucide-react";
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

function voteSummary(s: Statement): string {
  const total = s.agrees + s.disagrees + s.passes + s.superAgrees;
  return `${s.agrees} agree · ${s.disagrees} disagree · ${total} total`;
}

export function StatementRow({
  statement,
  isSource,
  isTarget,
  isPending,
  onSelect,
  onToggleHidden,
}: StatementRowProps) {
  const isHidden = !!statement.isHidden;

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
        <p className="text-xs text-muted-foreground mt-1">{voteSummary(statement)}</p>
        {isHidden && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">Hidden</p>
        )}
        {!isHidden && isSource && (
          <p className="text-xs attention-text mt-1 font-medium">
            Merging from this statement
          </p>
        )}
        {!isHidden && isTarget && (
          <p className="text-xs resolved-text mt-1 font-medium">
            Merging into this statement
          </p>
        )}
      </button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleHidden}
        disabled={isPending}
        className="shrink-0 self-center mr-2"
        aria-label={isHidden ? "Unhide response" : "Hide response"}
        title={isHidden ? "Unhide" : "Hide"}
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
