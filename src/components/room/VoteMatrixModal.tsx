import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { api, safelyMakeApiCall } from "../../utils/api";
import { Statement, StatementMerge } from "../../types";
import { VoteMatrix } from "./VoteMatrix";

interface VoteMatrixModalProps {
  roomId: string;
  roomTopic: string;
  participantCount: number;
  onClose: () => void;
}

export function VoteMatrixModal({ roomId, roomTopic, participantCount, onClose }: VoteMatrixModalProps) {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [merges, setMerges] = useState<StatementMerge[]>([]);
  const [phoneVerified, setPhoneVerified] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await safelyMakeApiCall(() => api.getVoteMatrix(roomId));
      if (response?.success && response.data) {
        setStatements(response.data.statements);
        setMerges(response.data.merges);
        setPhoneVerified(response.data.phoneVerified ?? {});
      }
      setLoading(false);
    };
    load();
  }, [roomId]);

  const totalVotes = statements.reduce(
    (sum, s) => sum + s.agrees + s.superAgrees + s.disagrees + s.passes,
    0
  );

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] flex flex-col gap-2 overflow-hidden">
        <DialogTitle className="line-clamp-1 pr-8 shrink-0">{roomTopic}</DialogTitle>
        {loading ? (
          <div className="flex items-center justify-center h-48 inactive-text-soft text-sm">
            Loading matrix…
          </div>
        ) : (
          <>
            <p className="text-xs inactive-text-soft shrink-0">
              {statements.length} statements · {participantCount} participants · {totalVotes} votes
              {merges.length > 0 && ` · ${merges.length} merges`}
            </p>
            <div className="flex-1 overflow-hidden min-h-0">
              <VoteMatrix
                statements={statements}
                merges={merges}
                phoneVerified={phoneVerified}
                tableWrapperClassName="h-full"
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
