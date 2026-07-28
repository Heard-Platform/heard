import { CornerLeftUp, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button";
import { Statement, StatementMerge } from "../../../types";

interface MergeGroupProps {
  targetId: string;
  target: Statement | undefined;
  merges: StatementMerge[];
  sources: Map<string, Statement>;
  onDeleteMerge: (mergeId: string) => void;
}

export function MergeGroup({
  targetId,
  target,
  merges,
  sources,
  onDeleteMerge,
}: MergeGroupProps) {
  const { t } = useTranslation("mod");
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium leading-snug">
        {target?.text ?? targetId}
        {target?.isHidden && (
          <span className="text-muted-foreground font-normal"> {t("modHidden")}</span>
        )}
      </p>
      {merges.map((m) => {
        const src = sources.get(m.sourceStatementId);
        return (
          <div key={m.id} className="flex items-start gap-2 pl-2">
            <CornerLeftUp className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="flex-1 text-sm line-clamp-2">
              {src?.text ?? m.sourceStatementId}
              {src?.isHidden && (
                <span className="text-muted-foreground"> {t("modHidden")}</span>
              )}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteMerge(m.id)}
              className="hover:text-destructive shrink-0 w-8 h-8"
              aria-label={t("modRemoveMerge")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
