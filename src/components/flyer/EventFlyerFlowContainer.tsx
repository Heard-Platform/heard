import { useEffect, useState } from "react";
import type {
  DebateRoom,
  FlyerIntro,
  StampedVote,
  Statement,
  VoteType,
} from "../../types";
import { useDebateSession } from "../../hooks/useDebateSession";
import { EventFlyerFlow } from "./EventFlyerFlow";
import type { FlyerCompleteReason } from "./FlyerSwipeContainer";

interface EventFlyerFlowContainerProps {
  room: DebateRoom;
  flyerStatementId: string;
  flyerVote: StampedVote;
  onComplete: (roomId: string, reason: FlyerCompleteReason) => void;
}

export function EventFlyerFlowContainer({
  room,
  flyerStatementId,
  flyerVote,
  onComplete,
}: EventFlyerFlowContainerProps) {
  const {
    user,
    getRoomStatements,
    voteOnStatement,
    saveDemographicAnswers,
  } = useDebateSession();
  const [statements, setStatements] = useState<Statement[] | null>(
    null,
  );
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<
    string[]
  >([]);

  useEffect(() => {
    loadStatements();
  }, []);

  const handleFinished = () => onComplete(room.id, "continue");

  const loadStatements = async () => {
    const roomStatements = await getRoomStatements(room.id);
    const hasFlyerStatement = roomStatements.some(
      (statement) => statement.id === flyerStatementId,
    );
    if (!hasFlyerStatement || !user) {
      handleFinished();
      return;
    }
    setStatements(roomStatements);
  };

  const handleVote = (statement: Statement, voteType: VoteType) =>
    voteOnStatement(statement.id, voteType, { isVoteFromFeed: true });

  const handleAnswer = (questionId: string, answers: string[]) => {
    saveDemographicAnswers(questionId, answers);
    setAnsweredQuestionIds((questionIds) => [
      ...questionIds,
      questionId,
    ]);
  };

  if (!statements || !user) return null;

  const flyerStatement = statements.find(
    (statement) => statement.id === flyerStatementId,
  );
  if (!flyerStatement) return null;

  const flyerIntro: FlyerIntro = {
    statement: flyerStatement,
    vote: flyerVote,
  };

  return (
    <div className="heard-feed-bg h-dvh overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-md flex-col">
        <EventFlyerFlow
          room={room}
          flyerIntro={flyerIntro}
          statements={statements}
          currentUserId={user.id}
          questions={room.demographicQuestions}
          answeredQuestionIds={answeredQuestionIds}
          onVote={handleVote}
          onAnswer={handleAnswer}
          onFinished={handleFinished}
        />
      </div>
    </div>
  );
}
