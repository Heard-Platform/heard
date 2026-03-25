import { useState } from "react";
import { PanInfo } from "motion/react";
import { useSwipeTutorial } from "../../hooks/useSwipeTutorial";
import {
  type Statement,
  type VoteType,
  type Card,
  type ChanceCard,
  type YouTubeCard,
  type DemographicsCard,
  type CertifyCard,
  DemographicQuestion,
} from "../../types";
import { SwipeableCard } from "./SwipeableCard";
import { SwipeInstructions } from "../SwipeInstructions";
import { NewStatementInput } from "../NewStatementInput";
import { FlagResponseDialog } from "./FlagResponseDialog";
import { useDebateSession } from "../../hooks/useDebateSession";

// @ts-ignore
import { toast } from "sonner@2.0.3";

interface SwipeableStatementStackProps {
  statements: Statement[];
  currentUserId?: string;
  allowAnonymous: boolean;
  isAnonymous: boolean;
  chanceCardSwiped: boolean;
  youtubeUrl?: string;
  youtubeCardSwiped: boolean;
  demographicQuestions?: DemographicQuestion[];
  demographicsAnswered?: Set<string>;
  onVote: (
    id: string,
    voteType: VoteType,
  ) => Promise<void>;
  onSubmitStatement: (text: string) => Promise<void>;
  onShowAccountSetupModal: (featureText: string) => void;
  onCertifyDone: () => void;
  onChanceCardSwiped: () => Promise<void>;
  onYouTubeCardSwiped: () => Promise<void>;
  onDemographicsAnswer?: (questionId: string, answer: string) => void;
}

const SWIPE_THRESHOLD = 100;

export function SwipeableStatementStack({
  statements,
  currentUserId,
  allowAnonymous,
  isAnonymous,
  chanceCardSwiped,
  youtubeUrl,
  youtubeCardSwiped,
  demographicQuestions,
  demographicsAnswered,
  onVote,
  onSubmitStatement,
  onShowAccountSetupModal,
  onCertifyDone,
  onChanceCardSwiped,
  onYouTubeCardSwiped,
  onDemographicsAnswer,
}: SwipeableStatementStackProps) {
  const { flagStatement } = useDebateSession();
  const { showTutorial, recordSwipe } = useSwipeTutorial();
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
  const [demographicsAnsweredInternal, setDemographicsAnsweredInternal] = useState<Set<string>>(new Set());
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

  if (demographicQuestions) {
    const unansweredDemos = demographicQuestions.filter(
      (q) =>
        !demographicsAnswered ||
        (!demographicsAnswered.has(q.id) &&
        !demographicsAnsweredInternal.has(q.id)),
    );

    const demoCards: DemographicsCard[] =
      unansweredDemos.map((question) => ({
        type: "demographics",
        question,
        isUnswipeable: true,
      }));

    cards.unshift(...demoCards);
  }
  
  if (!chanceCardSwiped) {
    const chanceCard: ChanceCard = { type: "chance" };
    const chanceCardIndex = Math.min(5, statements.length) - votedStatementIds.size;
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

    const swipingLeft = swipeX < -SWIPE_THRESHOLD || velocityX < -500;
    const swipingRight = swipeX > SWIPE_THRESHOLD || velocityX > 500;

    if (card.type === "certify" || card.type === "chance" || card.type === "youtube") {
      if (swipingLeft || swipingRight) {
        setIsVoting(true);
        setSwipedNoopCard(card.type);
        setSwipeDirection(swipingLeft ? "left" : "right");

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
      }
      return;
    } else if (card.type === "statement") {
      const statementId = card.statement.id;

      if (swipingRight) {
        handleVote(statementId, "agree", "right");
      }
      else if (swipingLeft) {
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
    onChanceCardSwiped();
    await onSubmitStatement(text);
  };

  const handleDemographicsAnswer = (questionId: string, answer: string) => {
    const direction = answer === "skip" ? "left" : "right";
    setSwipeDirection(direction);
    setSwipedCardId(`demographics-${questionId}`);
    
    setTimeout(() => {
      setDemographicsAnsweredInternal((prev) => {
        const newSet = new Set(prev);
        newSet.add(questionId);
        return newSet;
      });
      onDemographicsAnswer!(questionId, answer);
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

  const topCard = cards[0];
  const isSpecialCardOnTop = topCard?.type === "chance" || topCard?.type === "certify";

  return (
    <div className="relative w-full max-w-md mx-auto space-y-4">
      <div className="relative min-h-[320px]">
        {showTutorial && (
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

      {!isSpecialCardOnTop && (
        <NewStatementInput
          onSubmitStatement={onSubmitStatement}
          allowAnonymous={allowAnonymous}
          isAnonymous={isAnonymous}
          onShowAccountSetupModal={onShowAccountSetupModal}
        />
      )}

      <FlagResponseDialog
        statement={statementToFlag}
        open={showFlagDialog}
        onOpenChange={setShowFlagDialog}
        onConfirm={handleConfirmFlag}
      />
    </div>
  );
}