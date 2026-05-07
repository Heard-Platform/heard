import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { api, safelyMakeApiCall } from "../../utils/api";
import { VoteMatrix } from "./VoteMatrix";
import { VoteMatrixData } from "./vote-matrix-utils";

interface VoteMatrixModalProps {
  roomId: string;
  roomTopic: string;
  participantCount: number;
  onClose: () => void;
}

export function VoteMatrixModal({ roomId, roomTopic, participantCount, onClose }: VoteMatrixModalProps) {
  const [matrix, setMatrix] = useState<VoteMatrixData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await safelyMakeApiCall(() => api.getVoteMatrix(roomId));
      if (response?.success && response.data) {
        setMatrix({
          statements: response.data.statements,
          merges: response.data.merges,
          phoneVerified: response.data.phoneVerified ?? {},
          userClusters: response.data.userClusters ?? {},
        });
      }
      setLoading(false);
    };
    load();
  }, [roomId]);

  const totalVotes = matrix?.statements.reduce(
    (sum, s) => sum + s.agrees + s.superAgrees + s.disagrees + s.passes,
    0
  ) ?? 0;

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col gap-2 overflow-hidden">
        <DialogTitle className="line-clamp-1 pr-8 shrink-0">{roomTopic}</DialogTitle>
        {loading || !matrix ? (
          <div className="flex items-center justify-center h-48 inactive-text-soft text-sm">
            {loading ? "Loading matrix…" : "No data."}
          </div>
        ) : (
          <>
            <p className="text-xs inactive-text-soft shrink-0">
              {matrix.statements.length} statements · {participantCount} participants · {totalVotes} votes
              {matrix.merges.length > 0 && ` · ${matrix.merges.length} merges`}
            </p>
            <div className="flex-1 overflow-hidden min-h-0">
              <VoteMatrix matrix={matrix} tableWrapperClassName="h-full" />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
