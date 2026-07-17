import { useState } from "react";
import { Loader2, ChevronRight } from "lucide-react";
import { api } from "../../utils/api";
import { AnalysisData } from "../../types";
import { DebateAnalysisReport } from "./DebateAnalysisReport";

interface RoomAnalysisEmbedProps {
  roomId: string;
  triggerLabel: string;
}

export function RoomAnalysisEmbed({ roomId, triggerLabel }: RoomAnalysisEmbedProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const handleToggle = async () => {
    const next = !expanded;
    setExpanded(next);
    api.trackEvent(next ? "organizers_results_expanded" : "organizers_results_collapsed", roomId);

    if (next && !analysisData && !loading) {
      setLoading(true);
      setError(null);

      const response = await api.getRoomAnalysis(roomId);

      if (response.success && response.data) {
        setAnalysisData(response.data);
      } else {
        setError(response.error || "Failed to load results");
        api.trackEvent("organizers_results_load_error", roomId);
      }

      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border-2 border-indigo-100 bg-white/60 backdrop-blur-sm overflow-hidden text-left"
      style={{ textAlign: "left" }}
    >
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-6 py-5 text-left"
        aria-expanded={expanded}
      >
        <ChevronRight
          className={`w-5 h-5 text-indigo-600 flex-shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        <span className="text-lg font-semibold text-gray-900">{triggerLabel}</span>
      </button>

      {expanded && (
        <div className="border-t border-indigo-100 max-h-[600px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-sm text-gray-500">Loading results...</p>
            </div>
          )}
          {error && (
            <div className="py-16 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {analysisData && (
            <DebateAnalysisReport
              {...analysisData}
              debateId={roomId}
              debateTopic={analysisData.debateTopic}
              isDeveloper={false}
            />
          )}
        </div>
      )}
    </div>
  );
}
