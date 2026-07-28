import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Statement } from "../../../types";
import { StatementRow } from "./StatementRow";

interface UnmergedStatementsListProps {
  loading: boolean;
  statements: Statement[];
  source: Statement | null;
  target: Statement | null;
  pendingHideIds: Set<string>;
  onSelect: (statement: Statement) => void;
  onToggleHidden: (statement: Statement) => void;
}

export function UnmergedStatementsList({
  loading,
  statements,
  source,
  target,
  pendingHideIds,
  onSelect,
  onToggleHidden,
}: UnmergedStatementsListProps) {
  const { t } = useTranslation("mod");
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {t("modNoStatements")}
      </p>
    );
  }

  return (
    <>
      <div className="pb-1 pt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {t("modAllUnmerged")}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("modTapToMerge")}
        </p>
      </div>
      {statements.map((s) => (
        <StatementRow
          key={s.id}
          statement={s}
          isSource={source?.id === s.id}
          isTarget={target?.id === s.id}
          isPending={pendingHideIds.has(s.id)}
          onSelect={() => onSelect(s)}
          onToggleHidden={() => onToggleHidden(s)}
        />
      ))}
    </>
  );
}
