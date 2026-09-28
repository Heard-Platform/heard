import { useState } from "react";
import type { DebateRoom, Statement, VoteType } from "../../types";
import { FeedHeader, FEED_HEADER_HEIGHT_PX } from "../FeedHeader";
import { SwipeableStatementStack } from "../room/SwipeableStatementStack";
import { formatSubHeardDisplay } from "../../utils/subheard";
import { FlyerVoteIntroCard, type FlyerVote } from "./FlyerVoteIntroCard";

// @ts-ignore
import { toast } from "sonner@2.0.3";

const TOAST_TEXT_MAX_LENGTH = 50;

interface FlyerSwipeScreenProps {
  room: DebateRoom;
  statements: Statement[];
  flyerStatementId: string;
  flyerVote: FlyerVote;
  currentUserId: string;
  isAnonymous: boolean;
  onWordmarkClick: () => void;
  onVote: (statement: Statement, voteType: VoteType) => Promise<void>;
  onSubmitStatement: (text: string) => Promise<void>;
  onShowAccountSetupModal: (featureText: string) => void;
}

export function FlyerSwipeScreen({
  room,
  statements,
  flyerStatementId,
  flyerVote,
  currentUserId,
  isAnonymous,
  onWordmarkClick,
  onVote,
  onSubmitStatement,
  onShowAccountSetupModal,
}: FlyerSwipeScreenProps) {
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const [chanceCardSwiped, setChanceCardSwiped] = useState(false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());

  const flyerStatement = statements.find((s) => s.id === flyerStatementId);
  const remainingStatements = statements.filter((s) => s.id !== flyerStatementId);

  const handleIntroDismissed = () => {
    setIsIntroVisible(false);
    if (flyerStatement) showFlyerVoteToast(flyerStatement, flyerVote);
  };

  const handleDemographicsAnswered = (questionId: string) => {
    setAnsweredQuestionIds((prev) => new Set(prev).add(questionId));
  };

  return (
    <div className="heard-feed-bg relative min-h-full">
      <FeedHeader
        hidden={false}
        communityPicker={room.subHeard && <FlyerCommunityLabel subHeard={room.subHeard} />}
        onWordmarkClick={onWordmarkClick}
      />

      <div className="mx-auto max-w-2xl px-4 pb-8" style={{ paddingTop: FEED_HEADER_HEIGHT_PX + 16 }}>
        <h2 className="mb-4 text-xl font-bold leading-tight text-foreground">{room.topic}</h2>

        <div className="relative w-full max-w-md mx-auto">
          <SwipeableStatementStack
            room={room}
            statements={remainingStatements}
            currentUserId={currentUserId}
            allowAnonymous={!!room.allowAnonymous}
            isAnonymous={isAnonymous}
            chanceCardSwiped={chanceCardSwiped}
            cover={null}
            coverCardSwiped={true}
            demographicQuestions={room.demographicQuestions}
            answeredQuestionIds={answeredQuestionIds}
            isActive={!isIntroVisible}
            onVote={onVote}
            onSubmitStatement={onSubmitStatement}
            onShowAccountSetupModal={onShowAccountSetupModal}
            onCertifyDone={() => {}}
            onChanceCardSwiped={async () => setChanceCardSwiped(true)}
            onCoverCardSwiped={async () => {}}
            onDemographicsAnswered={handleDemographicsAnswered}
          />

          {isIntroVisible && flyerStatement && (
            <div className="absolute top-0 left-0 z-30 w-full">
              <FlyerVoteIntroCard
                statement={flyerStatement}
                room={room}
                vote={flyerVote}
                totalStatements={statements.length}
                onDismissed={handleIntroDismissed}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function showFlyerVoteToast(statement: Statement, vote: FlyerVote) {
  const truncatedText =
    statement.text.length > TOAST_TEXT_MAX_LENGTH
      ? `${statement.text.substring(0, TOAST_TEXT_MAX_LENGTH)}...`
      : statement.text;
  const options = { position: "bottom-center" as const, duration: 4000, richColors: true };

  if (vote === "agree") {
    toast.success(`You agreed with "${truncatedText}"`, options);
  } else {
    toast.error(`You disagreed with "${truncatedText}"`, options);
  }
}

function FlyerCommunityLabel({ subHeard }: { subHeard: string }) {
  return (
    <div className="flex h-9 max-w-full min-w-0 items-center rounded-full bg-[#E8E3D6] px-4">
      <span className="truncate text-sm font-semibold text-[#1C1B1F]">
        {formatSubHeardDisplay(subHeard)}
      </span>
    </div>
  );
}
