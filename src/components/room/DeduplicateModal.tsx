// @ts-ignore
import { toast } from "sonner@2.0.3";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, Trash2, ChevronDown, ChevronUp, CornerLeftUp } from "lucide-react";
import { useDebateSession } from "../../hooks/useDebateSession";
import { Statement, StatementMerge } from "../../types";

interface DeduplicateModalProps {
  roomId: string;
  onClose: () => void;
}

function voteSummary(s: Statement): string {
  const total = s.agrees + s.disagrees + s.passes + s.superAgrees;
  return `${s.agrees} agree · ${s.disagrees} disagree · ${total} total`;
}

export function DeduplicateModal({ roomId, onClose }: DeduplicateModalProps) {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [merges, setMerges] = useState<StatementMerge[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<Statement | null>(null);
  const [target, setTarget] = useState<Statement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const { getRoomStatements, getStatementMerges, createStatementMerge, deleteStatementMerge } = useDebateSession();

  const fetchData = useCallback(async () => {
    const [stmts, fetchedMerges] = await Promise.all([
      getRoomStatements(roomId),
      getStatementMerges(roomId),
    ]);
    setStatements(stmts);
    setMerges(fetchedMerges);
    setLoading(false);
  }, [roomId, getRoomStatements, getStatementMerges]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const sourceIds = new Set(merges.map((m) => m.sourceStatementId));
  const activeStatements = statements.filter((s) => !sourceIds.has(s.id));

  const sourcesByTarget = new Map<string, StatementMerge[]>();
  for (const m of merges) {
    const group = sourcesByTarget.get(m.targetStatementId) ?? [];
    group.push(m);
    sourcesByTarget.set(m.targetStatementId, group);
  }
  const mergeTargetIds = [...sourcesByTarget.keys()];

  const handleStatementClick = (s: Statement) => {
    if (!source) {
      setSource(s);
      return;
    }
    if (source.id === s.id) {
      setSource(null);
      setTarget(null);
      return;
    }
    if (target?.id === s.id) {
      setTarget(null);
      return;
    }
    setTarget(s);
  };

  const handleConfirm = async () => {
    if (!source || !target) return;
    setSubmitting(true);
    const result = await createStatementMerge(roomId, source.id, target.id);
    setSubmitting(false);
    if (result) {
      toast.success("Statements merged.");
      setSource(null);
      setTarget(null);
      await fetchData();
    } else {
      toast.error("Failed to merge.");
    }
  };

  const handleDeleteMerge = async (mergeId: string) => {
    const ok = await deleteStatementMerge(roomId, mergeId);
    if (ok) {
      toast.success("Merge removed.");
      await fetchData();
    } else {
      toast.error("Failed to remove merge.");
    }
  };

  const footerPrompt = !source
    ? "Select the duplicate to merge, then select the statement to keep."
    : !target
    ? "Now tap the statement you want to keep."
    : null;

  const confirmText = source && target
    ? `Merge "${source.text.slice(0, 50)}${source.text.length > 50 ? "…" : ""}" into "${target.text.slice(0, 50)}${target.text.length > 50 ? "…" : ""}"?`
    : null;

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[calc(100vh-4rem)] top-8 translate-y-0 flex flex-col gap-0 p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-base font-semibold">Manage Duplicates</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Use this tool to consolidate similar statements.</p>
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground mt-1"
            onClick={() => setShowHelp((v) => !v)}
          >
            {showHelp ? "Show less" : "Learn more"}
            {showHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showHelp && (
            <p className="text-sm text-muted-foreground mt-1">
              When participants submit similar statements, you can merge one into another to
              consolidate them into a single statement. Votes are combined at analysis time —
              no data is deleted. Merges can be undone by removing them from the list below.
            </p>
          )}
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {mergeTargetIds.length > 0 && (
            <div className="info-bg rounded-lg px-3 py-3 space-y-3 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide">
                Active merges
              </p>
              {mergeTargetIds.map((targetId) => {
                const tgt = statements.find((s) => s.id === targetId);
                const targetMerges = sourcesByTarget.get(targetId) ?? [];
                return (
                  <div key={targetId} className="space-y-1">
                    <p className="text-sm font-medium leading-snug">
                      {tgt?.text ?? targetId}
                    </p>
                    {targetMerges.map((m) => {
                      const src = statements.find((s) => s.id === m.sourceStatementId);
                      return (
                        <div key={m.id} className="flex items-start gap-2 pl-2">
                          <CornerLeftUp className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span className="flex-1 text-sm line-clamp-2">
                            {src?.text ?? m.sourceStatementId}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMerge(m.id)}
                            className="hover:text-destructive shrink-0 w-8 h-8"
                            aria-label="Remove merge"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
          {!loading && activeStatements.length > 0 && (
            <div className="pb-1 pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                All Unmerged Statements
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Tap to start merging</p>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : activeStatements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No statements yet.</p>
          ) : (
            activeStatements.map((s) => {
              const isSource = source?.id === s.id;
              const isTarget = target?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleStatementClick(s)}
                  className={[
                    "w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors",
                    isSource
                      ? "attention-border attention-bg"
                      : isTarget
                      ? "resolved-border resolved-bg"
                      : "border-border bg-background hover:bg-muted",
                  ].join(" ")}
                >
                  <p className="font-medium leading-snug">{s.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{voteSummary(s)}</p>
                  {isSource && (
                    <p className="text-xs attention-text mt-1 font-medium">Merging from this statement</p>
                  )}
                  {isTarget && (
                    <p className="text-xs resolved-text mt-1 font-medium">Merging into this statement</p>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="border-t px-4 py-3 space-y-2">
          {footerPrompt && !confirmText && (
            <p className="text-sm text-muted-foreground">{footerPrompt}</p>
          )}
          {confirmText && (
            <p className="text-sm text-muted-foreground">{confirmText}</p>
          )}
          <div className="flex justify-end gap-2">
            {source && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSource(null); setTarget(null); }}
              >
                Clear selection
              </Button>
            )}
            {source && target && (
              <Button size="sm" onClick={handleConfirm} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Merge
              </Button>
            )}
            {!source && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
