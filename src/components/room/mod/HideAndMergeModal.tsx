// @ts-ignore
import { toast } from "sonner@2.0.3";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "../../ui/dialog";
import { useDebateSession } from "../../../hooks/useDebateSession";
import { Statement, StatementMerge } from "../../../types";
import { HideAndMergeHeader } from "./HideAndMergeHeader";
import { ActiveMergesSection } from "./ActiveMergesSection";
import { UnmergedStatementsList } from "./UnmergedStatementsList";
import { HideAndMergeFooter } from "./HideAndMergeFooter";

interface HideAndMergeModalProps {
  roomId: string;
  onClose: () => void;
}

export function HideAndMergeModal({ roomId, onClose }: HideAndMergeModalProps) {
  const { t } = useTranslation("toast");
  const [statements, setStatements] = useState<Statement[]>([]);
  const [merges, setMerges] = useState<StatementMerge[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<Statement | null>(null);
  const [target, setTarget] = useState<Statement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingHideIds, setPendingHideIds] = useState<Set<string>>(new Set());

  const {
    listStatementsForModeration,
    getStatementMerges,
    createStatementMerge,
    deleteStatementMerge,
    setStatementHidden,
  } = useDebateSession();

  const fetchData = useCallback(async () => {
    const [stmts, fetchedMerges] = await Promise.all([
      listStatementsForModeration(roomId),
      getStatementMerges(roomId),
    ]);
    setStatements(stmts);
    setMerges(fetchedMerges);
    setLoading(false);
  }, [roomId, listStatementsForModeration, getStatementMerges]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const sourceIds = new Set(merges.map((m) => m.sourceStatementId));
  const activeStatements = statements.filter((s) => !sourceIds.has(s.id));

  const handleStatementClick = (s: Statement) => {
    if (s.isHidden) return;
    if (!source) return setSource(s);
    if (source.id === s.id) {
      setSource(null);
      setTarget(null);
      return;
    }
    if (target?.id === s.id) return setTarget(null);
    setTarget(s);
  };

  const handleConfirm = async () => {
    if (!source || !target) return;
    setSubmitting(true);
    const result = await createStatementMerge(roomId, source.id, target.id);
    setSubmitting(false);
    if (result) {
      toast.success(t("statementsMerged"));
      setSource(null);
      setTarget(null);
      await fetchData();
    } else {
      toast.error(t("mergeFailed"));
    }
  };

  const handleClearSelection = () => {
    setSource(null);
    setTarget(null);
  };

  const handleDeleteMerge = async (mergeId: string) => {
    const ok = await deleteStatementMerge(roomId, mergeId);
    if (ok) {
      toast.success(t("mergeRemoved"));
      await fetchData();
    } else {
      toast.error(t("removeMergeFailed"));
    }
  };

  const handleToggleHidden = async (s: Statement) => {
    const nextHidden = !s.isHidden;
    if (
      nextHidden &&
      !window.confirm("Hide this response? It will no longer appear to anyone.")
    ) {
      return;
    }
    if (source?.id === s.id) setSource(null);
    if (target?.id === s.id) setTarget(null);

    setPendingHideIds((prev) => new Set(prev).add(s.id));
    const result = await setStatementHidden(roomId, s.id, nextHidden);
    setPendingHideIds((prev) => {
      const next = new Set(prev);
      next.delete(s.id);
      return next;
    });

    if (result?.success) {
      toast.success(nextHidden ? t("responseHidden") : t("responseRestored"));
      await fetchData();
    } else {
      toast.error(t("visibilityUpdateFailed"));
    }
  };

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[calc(100vh-4rem)] top-8 translate-y-0 flex flex-col gap-0 p-0 overflow-hidden">
        <HideAndMergeHeader />

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          <ActiveMergesSection
            statements={statements}
            merges={merges}
            onDeleteMerge={handleDeleteMerge}
          />

          <UnmergedStatementsList
            loading={loading}
            statements={activeStatements}
            source={source}
            target={target}
            pendingHideIds={pendingHideIds}
            onSelect={handleStatementClick}
            onToggleHidden={handleToggleHidden}
          />
        </div>

        <HideAndMergeFooter
          source={source}
          target={target}
          submitting={submitting}
          onClearSelection={handleClearSelection}
          onConfirmMerge={handleConfirm}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
