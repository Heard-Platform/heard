import { useTranslation } from "react-i18next";
import { Statement, StatementMerge } from "../../../types";
import { MergeGroup } from "./MergeGroup";

interface ActiveMergesSectionProps {
  statements: Statement[];
  merges: StatementMerge[];
  onDeleteMerge: (mergeId: string) => void;
}

export function ActiveMergesSection({
  statements,
  merges,
  onDeleteMerge,
}: ActiveMergesSectionProps) {
  const { t } = useTranslation("mod");
  if (merges.length === 0) return null;

  const sourcesByTarget = new Map<string, StatementMerge[]>();
  for (const m of merges) {
    const group = sourcesByTarget.get(m.targetStatementId) ?? [];
    group.push(m);
    sourcesByTarget.set(m.targetStatementId, group);
  }
  const targetIds = [...sourcesByTarget.keys()];

  const statementsById = new Map(statements.map((s) => [s.id, s]));

  return (
    <div className="info-bg rounded-lg px-3 py-3 space-y-3 mb-2">
      <p className="text-xs font-semibold uppercase tracking-wide">{t("modActiveMerges")}</p>
      {targetIds.map((targetId) => (
        <MergeGroup
          key={targetId}
          targetId={targetId}
          target={statementsById.get(targetId)}
          merges={sourcesByTarget.get(targetId) ?? []}
          sources={statementsById}
          onDeleteMerge={onDeleteMerge}
        />
      ))}
    </div>
  );
}
