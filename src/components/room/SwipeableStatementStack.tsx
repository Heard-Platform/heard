import { useState } from "react";
import { PanInfo } from "motion/react";
import { useSwipeTutorialContext } from "../../contexts/SwipeTutorialContext";
import {
  type Statement,
  type VoteType,
  type Card,
  type ChanceCard,
  type YouTubeCard,
  type DemographicsCard,
  type CertifyCard,
  type DebateRoom,
  DemographicQuestion,
} from "../../types";
import { SwipeableCard } from "./SwipeableCard";
import { SwipeInstructions } from "../SwipeInstructions";
import { FlagResponseDialog } from "./FlagResponseDialog";
import { useDebateSession } from "../../hooks/useDebateSession";

// @ts-ignore
import { toast } from "sonner@2.0.3";

interface SwipeableStatementStackProps {
  room: DebateRoom;
  statements: Statement[];
  currentUserId?: string;
  allowAnonymous: boolean;
  isAnonymous: boolean;
  chanceCardSwiped: boolean;
  youtubeUrl?: string;
  youtubeCardSwiped: boolean;
  demographicQuestions: DemographicQuestion[];
  answeredQuestionIds: Set<string>;
  onVote: (
    id: string,
    voteType: VoteType,
  ) => Promise<void>;
  onSubmitStatement: (text: string) => Promise<void>;
  onShowAccountSetupModal: (featureText: string) => void;
  onCertifyDone: () => void;
  onChanceCardSwiped: () => Promise<void>;
  onYouTubeCardSwiped: () => Promise<void>;
  onDemographicsAnswered: (questionId: string) => void;
}

const SWIPE_THRESHOLD = 100;

export function SwipeableStatementStack({
  room,
  statements,
  currentUserId,
  allowAnonymous,
  isAnonymous,
  chanceCardSwiped,
  youtubeUrl,
  youtubeCardSwiped,
  demographicQuestions,
  answeredQuestionIds,
  onVote,
  onSubmitStatement,
  onShowAccountSetupModal,
  onCertifyDone,
  onChanceCardSwiped,
  onYouTubeCardSwiped,
  onDemographicsAnswered,
}: SwipeableStatementStackProps) {
  const { flagStatement, saveDemographicAnswer } = useDebateSession();

  const { showTutorial, recordSwipe, resetTutorialTimer } = useSwipeTutorialContext();
  const [certifyCardDismissed, setCertifyCardDismissed] = useState(false);
  const [votedStatementIds, setVotedStatementIds] = useState<
    Set<string>
  >(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const [swipedCardId, setSwipedCardId] = useState<
    string | null
  >(null);
  const [swipedNoopCard, setSwipedNoopCard] = useState<"certify" | "chance" | "youtube" | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<
    "left" | "right" | "down" | "up" | null
  >(null);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [statementToFlag, setStatementToFlag] = useState<Statement | null>(null);

  const unvotedStatements = statements.filter((statement) => {
    const hasVotedBefore =
      currentUserId && statement.voters?.[currentUserId];
    const justVoted = votedStatementIds.has(statement.id);
    return !hasVotedBefore && !justVoted;
  });

  const cards: Card[] = unvotedStatements.map((statement) => ({
    type: "statement",
    statement,
  }));

  let demogEndIndex = 0;
  if (demographicQuestions) {
    const unansweredDemos = demographicQuestions.filter(
      (q) => !answeredQuestionIds.has(q.id),
    );

    const demoCards: DemographicsCard[] = unansweredDemos.map((question) => ({
      type: "demographics",
      question,
    }));

    const insertAt = Math.min(3, cards.length);
    cards.splice(insertAt, 0, ...demoCards);
    demogEndIndex = insertAt + demoCards.length;
  }

  if (!chanceCardSwiped) {
    const chanceCard: ChanceCard = { type: "chance" };
    const naturalIndex = Math.min(5, statements.length) - votedStatementIds.size;
    const chanceCardIndex = Math.max(naturalIndex, demogEndIndex);
    cards.splice(chanceCardIndex, 0, chanceCard);
  }

  if (youtubeUrl && !youtubeCardSwiped) {
    const youtubeCard: YouTubeCard = { type: "youtube", url: youtubeUrl };
    cards.unshift(youtubeCard);
  }

  if (isAnonymous && !certifyCardDismissed) {
    const certifyCard: CertifyCard = { type: "certify" };
    cards.push(certifyCard);
  }

  const hasMoreCards = cards.length > 0;

  const handleVote = async (
    statementId: string,
    voteType: VoteType,
    direction: "left" | "right" | "down" | "up",
  ) => {
    if (isVoting) return;

    setIsVoting(true);
    setSwipedCardId(statementId);
    setSwipeDirection(direction);

    setVotedStatementIds((prev) =>
      new Set(prev).add(statementId),
    );

    recordSwipe();
    resetTutorialTimer();

    const statement = statements.find(
      (s) => s.id === statementId,
    );

    if (statement) {
      const { agrees, disagrees, superAgrees, passes, text } =
        statement;

      const truncatedText =
        text.length > 50 ? `${text.substring(0, 50)}...` : text;

      let newAgrees = agrees;
      let newDisagrees = disagrees;
      let newSuperAgrees = superAgrees;
      let newPasses = passes;

      if (voteType === "super_agree") {
        newSuperAgrees += 1;
      } else if (voteType === "agree") {
        newAgrees += 1;
      } else if (voteType === "disagree") {
        newDisagrees += 1;
      } else if (voteType === "pass") {
        newPasses += 1;
      }

      const totalVotes =
        newSuperAgrees + newAgrees + newDisagrees + newPasses;

      if (voteType === "super_agree") {
        const percentage =
          totalVotes > 0
            ? Math.round((newSuperAgrees / totalVotes) * 100)
            : 0;
        toast.success(
          <div className="flex flex-col gap-1">
            <div>
              🌟 You super agreed with "{truncatedText}"
            </div>
            <div className="text-xs text-muted-foreground">
              {percentage}% super agree
            </div>
          </div>,
          {
            duration: 5000,
          },
        );
      } else if (voteType === "agree") {
        const percentage =
          totalVotes > 0
            ? Math.round((newAgrees / totalVotes) * 100)
            : 0;
        toast.success(
          <div className="flex flex-col gap-1">
            <div>✅ You agreed with "{truncatedText}"</div>
            <div className="text-xs text-muted-foreground">
              {percentage}% agree
            </div>
          </div>,
          {
            duration: 5000,
          },
        );
      } else if (voteType === "disagree") {
        const percentage =
          totalVotes > 0
            ? Math.round((newDisagrees / totalVotes) * 100)
            : 0;
        toast.error(
          <div className="flex flex-col gap-1">
            <div>❌ You disagreed with "{truncatedText}"</div>
            <div className="text-xs text-muted-foreground">
              {percentage}% disagree
            </div>
          </div>,
          {
            duration: 5000,
          },
        );
      } else if (voteType === "pass") {
        const percentage =
          totalVotes > 0
            ? Math.round((newPasses / totalVotes) * 100)
            : 0;
        toast(
          <div className="flex flex-col gap-1">
            <div>⏭️ You passed on "{truncatedText}"</div>
            <div className="text-xs text-muted-foreground">
              {percentage}% passed
            </div>
          </div>,
          {
            duration: 5000,
          },
        );
      }
    }

    onVote(statementId, voteType).catch(() => {
      setVotedStatementIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(statementId);
        return newSet;
      });
    });

    setTimeout(() => {
      setSwipedCardId(null);
      setSwipeDirection(null);
      setIsVoting(false);
    }, 300);
  };

  const handleDragEnd = (
    card: Card,
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const { offset, velocity } = info;
    const swipeX = offset.x;
    const velocityX = velocity.x;
    const swipeDirection: "left" | "right" | null =
      swipeX < -SWIPE_THRESHOLD || velocityX < -500 ? "left" :
      swipeX > SWIPE_THRESHOLD || velocityX > 500 ? "right" :
      null;

    if (!swipeDirection) return;

    if (card.type === "demographics") {
      handleDemographicsAnswer(
        card.question.id,
        null,
        swipeDirection,
      );
      return;
    } else if (card.type === "certify" || card.type === "chance" || card.type === "youtube") {
      setIsVoting(true);
      setSwipedNoopCard(card.type);
      setSwipeDirection(swipeDirection);

      if (card.type === "certify") {
        setCertifyCardDismissed(true);
        onCertifyDone();
      } else if (card.type === "chance") {
        onChanceCardSwiped();
      } else if (card.type === "youtube") {
        onYouTubeCardSwiped && onYouTubeCardSwiped();
      }

      setTimeout(() => {
        setSwipedNoopCard(null);
        setSwipeDirection(null);
        setIsVoting(false);
      }, 300);
      return;
    } else if (card.type === "statement") {
      const statementId = card.statement.id;
      if (swipeDirection === "right") {
        handleVote(statementId, "agree", "right");
      } else if (swipeDirection === "left") {
        handleVote(statementId, "disagree", "left");
      }
    }
  };

  const swipeCertifyCard = (direction: "left" | "right") => {
    setSwipedNoopCard("certify");
    setSwipeDirection(direction);
    setTimeout(() => {
      setCertifyCardDismissed(true);
      setSwipedNoopCard(null);
      setSwipeDirection(null);
      onCertifyDone();
    }, 300);
  }

  const handleDismissCertifyCard = () => {
    swipeCertifyCard("left");
  };

  const handleSuccessCertifyCard = () => {
    swipeCertifyCard("right");
  };

  const handleSubmitFromChanceCard = async (text: string) => {
    resetTutorialTimer();
    onChanceCardSwiped();
    await onSubmitStatement(text);
  };

  const handleDemographicsAnswer = (
    questionId: string,
    answer: string | null,
    direction?: "left" | "right",
  ) => {
    setSwipeDirection(
      direction ?? (answer === null ? "left" : "right"),
    );
    setSwipedCardId(`demographics-${questionId}`);
    saveDemographicAnswer(questionId, answer);

    setTimeout(() => {
      onDemographicsAnswered(questionId);
      setSwipedCardId(null);
      setSwipeDirection(null);
    }, 500);
  };

  const handleFlagClick = (statement: Statement) => {
    setStatementToFlag(statement);
    setShowFlagDialog(true);
  };

  const handleConfirmFlag = async () => {
    if (!statementToFlag) return;

    setShowFlagDialog(false);
    handleVote(statementToFlag.id, "pass", "down");

    await flagStatement(statementToFlag.id, statementToFlag.roomId);
    toast.success("🙏 Thank you for reporting. Our team will review this shortly.");

    setStatementToFlag(null);
  };

  if (!hasMoreCards) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl text-primary">
            Loading results...
          </h3>
          <p className="text-muted-foreground">
            You've voted on all available statements.
          </p>
        </div>
      </div>
    );
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "bridge":
        return "border-blue-500 bg-blue-50";
      case "crux":
        return "border-red-500 bg-red-50";
      case "plurality":
        return "border-purple-500 bg-purple-50";
      default:
        return "border-border bg-card";
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "bridge":
        return "🌉";
      case "crux":
        return "⚡";
      case "plurality":
        return "💎";
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto space-y-4">
      <div className="relative">
        {showTutorial && cards[0]?.type === "statement" && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <SwipeInstructions />
          </div>
        )}
        {cards
          .slice(0, 3)
          .map((card, index) => {
            const isTopCard = index === 0;
            const isBeingSwiped =
              (card.type === "statement" &&
              swipedCardId === card.statement.id)
              || (card.type === swipedNoopCard)
              || (
                card.type === "demographics"
                && swipedCardId === `demographics-${card.question.id}`
              )

            const getCardKey = () => {
              if (card.type === "statement") return card.statement.id;
              if (card.type === "certify") return "certify";
              if (card.type === "chance") return "chance";
              if (card.type === "youtube") return "youtube";
              if (card.type === "demographics") return `demographics-${card.question.id}`;
              return "unknown";
            };

            return (
              <SwipeableCard
                key={getCardKey()}
                card={card}
                room={room}
                index={index}
                isTopCard={isTopCard}
                onDragEnd={(event, info) =>
                  handleDragEnd(card, event, info)
                }
                getTypeIcon={getTypeIcon}
                direction={
                  isBeingSwiped ? swipeDirection : null
                }
                currentIndex={
                  statements.length -
                  unvotedStatements.length +
                  1
                }
                totalStatements={statements.length}
                allowAnonymous={allowAnonymous}
                isAnonymous={isAnonymous}
                onSubmitStatement={handleSubmitFromChanceCard}
                onShowAccountSetupModal={onShowAccountSetupModal}
                onDemographicsAnswer={handleDemographicsAnswer}
                onCertifyDismiss={handleDismissCertifyCard}
                onCertifySuccess={handleSuccessCertifyCard}
                onSkip={() => {
                  if (card.type === "statement") {
                    handleVote(card.statement.id, "pass", "down");
                  }
                }}
                onSuperAgree={() => {
                  if (card.type === "statement") {
                    handleVote(card.statement.id, "super_agree", "up");
                  }
                }}
                onFlag={() => {
                  if (card.type === "statement") {
                    handleFlagClick(card.statement);
                  }
                }}
              />
            );
          })}
      </div>

      <FlagResponseDialog
        statement={statementToFlag}
        open={showFlagDialog}
        onOpenChange={setShowFlagDialog}
        onConfirm={handleConfirmFlag}
      />
    </div>
  );
}