import { motion } from "motion/react";
import { Button } from "./ui/button";
import { X, Loader2, RefreshCw } from "lucide-react";
import { DebateAnalysisReport } from "./DebateAnalysisReport";
import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { AnalysisData } from "../types";
import { toast } from "sonner@2.0.3";

interface DebateAnalysisViewProps {
  roomId: string;
  isDeveloper: boolean;
  onClose: () => void;
}

export function DebateAnalysisView({
  roomId,
  isDeveloper,
  onClose,
}: DebateAnalysisViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    const response = await api.getRoomAnalysis(roomId);

    if (response.success && response.data) {
      setData(response.data as AnalysisData);
    } else {
      setError(response.error || "Failed to load analysis");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAnalysis();
  }, [roomId]);

  const handleRegenerateClusters = async () => {
    setRegenerating(true);
    toast.loading("Regenerating clusters...");

    const response = await api.recalculateClusters(roomId);

    toast.dismiss();

    if (response.success) {
      toast.success("Clusters regenerated successfully!");
      await fetchAnalysis();
    } else {
      toast.error(
        response.error || "Failed to regenerate clusters",
      );
    }

    setRegenerating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
        }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {isDeveloper && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg flex items-center gap-2"
              onClick={
                regenerating
                  ? () => {}
                  : handleRegenerateClusters
              }
              disabled={regenerating}
            >
              <RefreshCw
                className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`}
              />
              {regenerating
                ? "Regenerating..."
                : "Regenerate Clusters"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="h-full overflow-y-auto">
          {loading && (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <p className="text-sm text-muted-foreground">
                  Loading analysis...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-red-600">{error}</p>
                <Button onClick={onClose} className="mt-4">
                  Close
                </Button>
              </div>
            </div>
          )}

          {data && (
            <DebateAnalysisReport
              debateId={roomId}
              debateTopic={data.debateTopic}
              totalParticipants={data.totalParticipants}
              totalStatements={data.totalStatements}
              totalVotes={data.totalVotes}
              topPosts={data.topPosts}
              clusterConsensus={data.clusterConsensus}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}