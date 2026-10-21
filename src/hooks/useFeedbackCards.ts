import { useCallback, useEffect, useState } from "react";
import type { VoteType } from "../types";
import { api } from "../utils/api";
import type { FeedbackStatement } from "../utils/constants/feedback-statements";
import { pickFeedbackStatement, type VotedFeedback } from "../utils/feedback-cards";
import { useDebateSession } from "./useDebateSession";

export function useFeedbackCards() {
  const { user } = useDebateSession();
  const userId = user?.id;
  const [votedFeedback, setVotedFeedback] = useState<VotedFeedback[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setVotedFeedback(null);
    api.getVotedFeedback().then((response) => {
      if (cancelled) return;
      if (response.success && response.data) {
        setVotedFeedback(response.data.votedFeedback);
      } else {
        console.error("Error loading voted feedback:", response.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const pickFeedbackForRoom = useCallback(
    (roomId: string): FeedbackStatement | null =>
      votedFeedback && userId ? pickFeedbackStatement(votedFeedback, userId, roomId, new Date()) : null,
    [votedFeedback, userId],
  );

  const recordVote = useCallback((statement: FeedbackStatement, vote: VoteType, roomId: string) => {
    setVotedFeedback((prev) => [...(prev ?? []), { statementKey: statement.key, votedAt: Date.now() }]);
    api.voteOnFeedbackCard(statement.key, vote, roomId).then((response) => {
      if (!response.success) {
        console.error("Error saving feedback card vote:", response.error);
      }
    });
  }, []);

  return { pickFeedbackForRoom, recordVote };
}
