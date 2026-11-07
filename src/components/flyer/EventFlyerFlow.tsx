import { useState } from "react";
import type {
  DebateRoom,
  DemographicQuestion,
  FlyerIntro,
  Statement,
  VoteType,
} from "../../types";
import { HeardWordmark } from "../HeardWordmark";
import { EventOnboarding } from "../events/attendee/EventOnboarding";
import { RoomProgressBar } from "../room/RoomProgressBar";
import { SwipeableStatementStack } from "../room/SwipeableStatementStack";

const FLYER_VOTE_COUNT = 3;

type EventFlyerFlowStep = "voting" | "questions";

const doNothing = () => {};
const doNothingAsync = async () => {};

interface EventFlyerFlowProps {
  room: DebateRoom;
  flyerIntro: FlyerIntro;
  statements: Statement[];
  currentUserId: string;
  questions: DemographicQuestion[];
  answeredQuestionIds: string[];
  onVote: (statement: Statement, voteType: VoteType) => Promise<void>;
  onSubmitStatement: (text: string) => Promise<void>;
  onShowAccountSetupModal: (featureText: string) => void;
  onAnswer: (questionId: string, answers: string[]) => void;
  onFinished: () => void;
}

export function EventFlyerFlow({
  room,
  flyerIntro,
  statements,
  currentUserId,
  questions,
  answeredQuestionIds,
  onVote,
  onSubmitStatement,
  onShowAccountSetupModal,
  onAnswer,
  onFinished,
}: EventFlyerFlowProps) {
  const [step, setStep] = useState<EventFlyerFlowStep>("voting");
  const [votesAfterFlyer, setVotesAfterFlyer] = useState(0);
  const completedVotes = Math.min(
    1 + votesAfterFlyer,
    FLYER_VOTE_COUNT,
  );

  const handleVote = (statement: Statement, voteType: VoteType) => {
    setVotesAfterFlyer((count) => count + 1);
    return onVote(statement, voteType);
  };

  const handleKeepVoting = () => {
    const hasUnansweredQuestions = questions.some(
      (question) => !answeredQuestionIds.includes(question.id),
    );
    if (hasUnansweredQuestions) setStep("questions");
    else onFinished();
  };

  if (step === "questions") {
    return (
      <EventOnboarding
        questions={questions}
        welcomeVariant="keep-voting"
        answeredQuestionIds={answeredQuestionIds}
        onAnswer={onAnswer}
        onFinish={onFinished}
      />
    );
  }

  return (
    <div className="heard-feed-bg relative flex min-h-full flex-1 flex-col gap-4 overflow-clip px-5 pt-4 pb-5">
      <div className="flex h-10 items-center">
        <HeardWordmark />
      </div>
      <RoomProgressBar
        total={FLYER_VOTE_COUNT}
        completed={completedVotes}
      />
      <SwipeableStatementStack
        room={room}
        statements={statements}
        currentUserId={currentUserId}
        allowAnonymous
        isAnonymous
        chanceCardSwiped
        cover={null}
        coverCardSwiped
        demographicQuestions={[]}
        answeredQuestionIds={new Set()}
        feedbackStatement={null}
        flyerIntro={flyerIntro}
        onVote={handleVote}
        onSubmitStatement={onSubmitStatement}
        onShowAccountSetupModal={onShowAccountSetupModal}
        onCertifyDone={doNothing}
        onChanceCardSwiped={doNothingAsync}
        onCoverCardSwiped={doNothingAsync}
        onDemographicsAnswered={doNothing}
        onFeedbackVoted={doNothing}
        onFeedbackTellMore={doNothing}
        onKeepVoting={handleKeepVoting}
      />
    </div>
  );
}
