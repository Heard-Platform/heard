import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { DebateAnalysisReport } from "./DebateAnalysisReport";
import { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/api";
import { useDebateSession } from "../../hooks/useDebateSession";
import { AnalysisData } from "../../types";

interface DebateAnalysisViewProps {
  roomId: string;
  isDeveloper: boolean;
  isModerator: boolean;
  onClose: () => void;
}

export function DebateAnalysisView({
  roomId,
  isDeveloper,
  isModerator,
  onClose,
}: DebateAnalysisViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { getStatementTags, addStatementTag, removeStatementTag } =
    useDebateSession();

  const applyStatementTags = useCallback(
    (data: AnalysisData, tagsByStatementId: Map<string, Array<{ id: string; name: string }>>) => ({
      ...data,
      allStatements: data.allStatements.map((s) => ({
        ...s,
        tags: tagsByStatementId.get(s.id) ?? [],
      })),
    }),
    [],
  );

  const fetchStatementTagsMap = useCallback(async () => {
    const { tags, links } = await getStatementTags(roomId);
    const tagsById = new Map(tags.map((t) => [t.id, t]));
    const tagsByStatementId = new Map<string, Array<{ id: string; name: string }>>();
    for (const link of links) {
      const tag = tagsById.get(link.tagId);
      if (!tag) continue;
      const existing = tagsByStatementId.get(link.statementId) ?? [];
      existing.push({ id: tag.id, name: tag.name });
      tagsByStatementId.set(link.statementId, existing);
    }
    return tagsByStatementId;
  }, [roomId, getStatementTags]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    const [response, tagsByStatementId] = await Promise.all([
      api.getRoomAnalysis(roomId, selectedTags),
      fetchStatementTagsMap(),
    ]);

    if (response.success && response.data) {
      setAnalysisData(applyStatementTags(response.data, tagsByStatementId));
    } else {
      setError(response.error || "Failed to load analysis");
    }

    setLoading(false);
  };

  const refreshStatementTags = useCallback(async () => {
    const tagsByStatementId = await fetchStatementTagsMap();
    setAnalysisData((prev) => (prev ? applyStatementTags(prev, tagsByStatementId) : prev));
  }, [fetchStatementTagsMap, applyStatementTags]);

  const handleAddStatementTag = useCallback(
    async (statementId: string, name: string) => {
      const result = await addStatementTag(roomId, statementId, name);
      if (result?.success) await refreshStatementTags();
      return !!result?.success;
    },
    [roomId, addStatementTag, refreshStatementTags],
  );

  const handleRemoveStatementTag = useCallback(
    async (statementId: string, tagId: string) => {
      const result = await removeStatementTag(roomId, statementId, tagId);
      if (result?.success) await refreshStatementTags();
      return !!result?.success;
    },
    [roomId, removeStatementTag, refreshStatementTags],
  );

  const handleRegenerateClusters = async () => {
    setRegenerating(true);
    
    try {
      const response = await api.regenerateClusters(roomId);
      
      if (response.success) {
        await fetchAnalysis();
      } else {
        console.error("Failed to regenerate clusters:", response.error);
        alert(`Failed to regenerate clusters: ${response.error}`);
      }
    } catch (error) {
      console.error("Error regenerating clusters:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    
    setRegenerating(false);
  };

  useEffect(() => {
    fetchAnalysis();
  }, [roomId, selectedTags]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 shadow-2xl max-w-screen-2xl h-[95vh] overflow-hidden">
        <DialogTitle className="sr-only">Conversation Analysis</DialogTitle>

        <div className="h-full overflow-y-auto bg-white">
          {loading && (
            <div className="heard-page-bg p-4 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <p className="text-sm text-muted-foreground">
                  Loading analysis...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="heard-page-bg p-4 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-red-600">{error}</p>
                <Button onClick={onClose} className="mt-4">
                  Close
                </Button>
              </div>
            </div>
          )}

          {analysisData && (
            <DebateAnalysisReport
              {...analysisData}
              debateId={roomId}
              debateTopic={analysisData.debateTopic}
              isDeveloper={isDeveloper}
              isModerator={isModerator}
              regenerating={regenerating}
              onRegenerateClusters={handleRegenerateClusters}
              onAddStatementTag={handleAddStatementTag}
              onRemoveStatementTag={handleRemoveStatementTag}
              selectedTags={selectedTags}
              onSelectedTagsChange={setSelectedTags}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}