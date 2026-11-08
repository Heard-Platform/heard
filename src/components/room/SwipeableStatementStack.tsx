import { useEffect, useState } from "react";
import { PanInfo } from "motion/react";
import {
  type Statement,
  type VoteType,
  type Card,
  type ChanceCard,
  type CoverCard,
  type DemographicsCard,
  type FlyerIntro,
  type EventInvite,
  type DebateRoom,
  DemographicQuestion,
  FullCoverData,
} from "../../types";
import { SwipeableCard } from "./SwipeableCard";
import { FlagResponseDialog } from "./FlagResponseDialog";
import { useDebateSession } from "../../hooks/useDebateSession";
import type { FeedbackStatement } from "../../utils/constants/feedback-statements";
import { FeatureFlags, isFeatureEnabled } from "../../utils/constants/feature-flags";
import { useVoteResultSnackbar } from "../../contexts/VoteResultSnackbarContext";
import { buildVoteReveal, type VoteReveal } from "../../utils/vote-reveal";
import { VOTE_REVEAL_CROWD_DURATION_MS } from "./VoteRevealCrowd";
import { VOTE_STAMP_TOTAL_MS } from "./VoteStamp";
import { api } from "../../utils/api";


// @ts-ignore
import { toast } from "sonner@2.0.3";

interface SwipeableStatementStackProps {
  room: DebateRoom;
  statements: Statement[];
  currentUserId?: string;
  allowAnonymous: boolean;
  isAnonymous: boolean;
  chanceCardSwiped: boolean;
  cover: FullCoverData | null;
  coverCardSwiped: boolean;
  demographicQuestions: DemographicQuestion[];
  answeredQuestionIds: Set<string>;
  targetStatementId?: string;
  feedbackStatement: FeedbackStatement | null;
  flyerIntro?: FlyerIntro;
  eventInvite?: EventInvite;
  onVote: (
    statement: Statement,
    voteType: VoteType,
  ) => Promise<void>;
  onSubmitStatement: (text: string) => Promise<void>;
  onShowAccountSetupModal: (featureText: string) => void;
  onCertifyDone: () => void;
  onChanceCardSwiped: () => Promise<void>;
  onCoverCardSwiped: () => Promise<void>;
  onDemographicsAnswered: (questionId: string) => void;
  onFeedbackVoted: (statement: FeedbackStatement, vote: VoteType) => void;
  onFeedbackTellMore: (statement: FeedbackStatement) => void;
  onKeepVoting: () => void;
}

const SWIPE_THRESHOLD = 100;
const STATEMENTS_BEFORE_EVENT_INVITE = 3;
const FLYER_REVEAL_HOLD_MS = 1500;
const CARD_EXIT_MS = 300;

type CardExitDirection = "left" | "right" | "down" | "up";
type VoteMethod = "tap" | "swipe";

const VOTE_METHOD_EVENT_NAMES: Record<VoteMethod, string> = {
  tap: "vote_tapped",
  swipe: "vote_swiped",
};

export function SwipeableStatementStack({
  room,
  statements,
  currentUserId,
  allowAnonymous,
  isAnonymous,
  chanceCardSwiped,
  cover,
  coverCardSwiped,
  demographicQuestions,
  answeredQuestionIds,
  targetStatementId,
  feedbackStatement,
  flyerIntro,
  eventInvite,
  onVote,
  onSubmitStatement,
  onShowAccountSetupModal,
  onCertifyDone,
  onChanceCardSwiped,
  onCoverCardSwiped,
  onDemographicsAnswered,
  onFeedbackVoted,
  onFeedbackTellMore,
  onKeepVoting,
}: SwipeableStatementStackProps) {
  const { flagStatement, saveDemographicAnswers } =
    useDebateSession();

  const [certifyCardDismissed, setCertifyCardDismissed] = useState(false);
  const [votedStatementIds, setVotedStatementIds] = useState<
    Set<string>
  >(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const [swipedCardId, setSwipedCardId] = useState<
    string | null
  >(null);
  const [swipedNoopCard, setSwipedNoopCard] = useState<
    | "certify"
    | "chance"
    | "cover"
    | "feedback"
    | "event-invite"
    | null
  >(null);
  const [swipeDirection, setSwipeDirection] = useState<
    "left" | "right" | "down" | "up" | null
  >(null);
  const [voteReveal, setVoteReveal] = useState<VoteReveal | null>(null);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [statementToFlag, setStatementToFlag] = useState<Statement | null>(null);
  const [isFlyerStampDone, setIsFlyerStampDone] = useState(false);
  const [isEventInviteDismissed, setIsEventInviteDismissed] =
    useState(false);
  const { showVoteResult } = useVoteResultSnackbar();
  const isFlyerIntro = flyerIntro !== undefined;

  useEffect(() => {
    if (!flyerIntro) return;
    const revealTimer = setTimeout(
      () => revealFlyerVote(flyerIntro),
      VOTE_STAMP_TOTAL_MS,
    );
    const sendOffTimer = setTimeout(
      () => sendFlyerCardOff(flyerIntro),
      VOTE_STAMP_TOTAL_MS +
        VOTE_REVEAL_CROWD_DURATION_MS +
        FLYER_REVEAL_HOLD_MS,
    );
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(sendOffTimer);
    };
  }, []);

  const unvotedStatements = statements
    .filter((statement) => {
      const hasVotedBefore = currentUserId && statement.voters?.[currentUserId];
      const justVoted = votedStatementIds.has(statement.id);
      const isRevealingVote = statement.id === voteReveal?.statement.id;
      const isFlyerStatement =
        statement.id === flyerIntro?.statement.id;
      if (isFlyerStatement) return false;
      return (!hasVotedBefore && !justVoted) || isRevealingVote;
    })
    .sort((a, b) =>
      targetStatementId
        ? a.id === targetStatementId ? -1 : b.id === targetStatementId ? 1 : 0
        : 0,
    );

  const cards: Card[] = unvotedStatements.map((statement) => ({
    type: "statement",
    statement,
  }));

  let demogEndIndex = 0;
  if (demographicQuestions && !isFlyerIntro && !eventInvite) {
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

  if (eventInvite && !isEventInviteDismissed) {
    const inviteIndex = findEventInviteIndex(
      votedStatementIds,
      voteReveal,
      isFlyerIntro,
      cards.length,
    );
    cards.splice(inviteIndex, 0, {
      type: "event-invite",
      invite: eventInvite,
      isUndraggable: true,
    });
  }

  if (
    isFeatureEnabled(FeatureFlags.CHANCE_CARD) &&
    !chanceCardSwiped &&
    !isFlyerIntro
  ) {
    const chanceCard: ChanceCard = { type: "chance" };
    const naturalIndex = Math.min(5, statements.length) - votedStatementIds.size;
    const chanceCardIndex = Math.max(naturalIndex, demogEndIndex);
    cards.splice(chanceCardIndex, 0, chanceCard);
  }

  if (cover && !coverCardSwiped && !isFlyerIntro) {
    const coverCard: CoverCard = {
      type: "cover",
      cover,
    };
    cards.unshift(coverCard);
  }

  if (feedbackStatement && !isFlyerIntro) {
    cards.push({ type: "feedback", statement: feedbackStatement });
  }

  if (isAnonymous && !certifyCardDismissed && !isFlyerIntro) {
    const certifyCard: Card = { type: "certify" };
    cards.push(certifyCard);
  }

  if (flyerIntro && !isFlyerStampDone) {
    cards.unshift({
      type: "statement",
      statement: flyerIntro.statement,
      stampedVote: flyerIntro.vote,
      isUndraggable: true,
    });
  }

  const hasMoreCards = cards.length > 0;

  const recordVote = (statement: Statement, voteType: VoteType) => {
    setVotedStatementIds((prev) =>
      new Set(prev).add(statement.id),
    );

    onVote(statement, voteType).catch(() => {
      setVotedStatementIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(statement.id);
        return newSet;
      });
    });
  };

  const sendCardOff = (
    statementId: string,
    direction: CardExitDirection,
    onCardGone: () => void = () => {},
  ) => {
    setSwipedCardId(statementId);
    setSwipeDirection(direction);

    setTimeout(() => {
      setSwipedCardId(null);
      setSwipeDirection(null);
      setIsVoting(false);
      onCardGone();
    }, CARD_EXIT_MS);
  };

  const startStatementVote = (statement: Statement, voteMethod: VoteMethod): boolean => {
    if (isVoting) return false;

    setIsVoting(true);
    api.trackEvent(VOTE_METHOD_EVENT_NAMES[voteMethod], statement.roomId);
    return true;
  };

  const handleSwipeVote = (statement: Statement, voteType: VoteType, direction: CardExitDirection) => {
    if (!startStatementVote(statement, "swipe")) return;

    showVoteResult(statement, voteType, currentUserId);
    recordVote(statement, voteType);
    sendCardOff(statement.id, direction);
  };

  const handleTapVote = (statement: Statement, voteType: VoteType, direction: CardExitDirection) => {
    if (!startStatementVote(statement, "tap")) return;

    setVoteReveal(buildVoteReveal(statement, voteType, currentUserId));
    recordVote(statement, voteType);
    setTimeout(
      () => sendCardOff(statement.id, direction, () => setVoteReveal(null)),
      VOTE_REVEAL_CROWD_DURATION_MS,
    );
  };

  const revealFlyerVote = ({ statement, vote }: FlyerIntro) => {
    setVoteReveal(buildVoteReveal(statement, vote, currentUserId));
  };

  const sendFlyerCardOff = ({ statement, vote }: FlyerIntro) => {
    const direction = vote === "agree" ? "right" : "left";
    sendCardOff(statement.id, direction, () => {
      setIsFlyerStampDone(true);
      setVoteReveal(null);
    });
  };

  const handleGoToEvent = () => {
    api.trackEvent("event_invite_event_tapped", room.id);
  };

  const handleKeepVoting = () => {
    api.trackEvent("event_invite_keep_voting_tapped", room.id);
    setSwipedNoopCard("event-invite");
    setSwipeDirection("right");
    setTimeout(() => {
      setIsEventInviteDismissed(true);
      setSwipedNoopCard(null);
      setSwipeDirection(null);
      onKeepVoting();
    }, CARD_EXIT_MS);
  };

  const handleAgreeTapped = (card: Card) => {
    if (card.type === "statement") {
      handleTapVote(card.statement, "agree", "right");
    } else if (card.type === "feedback") {
      sendFeedbackCardOff(card.statement, "right", "tap");
    }
  };

  const handleDisagreeTapped = (card: Card) => {
    if (card.type === "statement") {
      handleTapVote(card.statement, "disagree", "left");
    } else if (card.type === "feedback") {
      sendFeedbackCardOff(card.statement, "left", "tap");
    }
  };

  const handlePassTapped = (card: Card) => {
    if (card.type === "statement") {
      handleTapVote(card.statement, "pass", "up");
    }
  };

  const passWithoutReveal = (statement: Statement) => {
    if (isVoting) return;

    setIsVoting(true);
    sendCardOff(statement.id, "down");
    recordVote(statement, "pass");
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
        [],
        swipeDirection,
      );
      return;
    } else if (card.type === "certify") {
      swipeCertifyCard(swipeDirection);
      return;
    } else if (card.type === "chance") {
      sendNoopCardOff("chance", swipeDirection, onChanceCardSwiped);
      return;
    } else if (card.type === "cover") {
      sendCoverCardOff(swipeDirection);
      return;
    } else if (card.type === "feedback") {
      sendFeedbackCardOff(card.statement, swipeDirection, "swipe");
      return;
    } else if (card.type === "statement") {
      if (swipeDirection === "right") {
        handleSwipeVote(card.statement, "agree", "right");
      } else if (swipeDirection === "left") {
        handleSwipeVote(card.statement, "disagree", "left");
      }
    }
  };

  const sendNoopCardOff = (
    noopCard: "chance" | "cover",
    direction: "left" | "right",
    onCardSwiped: () => void,
  ) => {
    setIsVoting(true);
    setSwipedNoopCard(noopCard);
    setSwipeDirection(direction);
    onCardSwiped();

    setTimeout(() => {
      setSwipedNoopCard(null);
      setSwipeDirection(null);
      setIsVoting(false);
    }, CARD_EXIT_MS);
  };

  const sendCoverCardOff = (direction: "left" | "right") => {
    if (isVoting) return;

    sendNoopCardOff("cover", direction, onCoverCardSwiped);
  };

  const handleStartVotingTapped = () => sendCoverCardOff("right");

  const sendFeedbackCardOff = (
    statement: FeedbackStatement,
    direction: "left" | "right",
    voteMethod: VoteMethod,
  ) => {
    if (isVoting) return;

    setIsVoting(true);
    api.trackEvent(VOTE_METHOD_EVENT_NAMES[voteMethod], room.id);
    setSwipedNoopCard("feedback");
    setSwipeDirection(direction);
    const vote: VoteType = direction === "right" ? "agree" : "disagree";

    setTimeout(() => {
      onFeedbackVoted(statement, vote);
      setSwipedNoopCard(null);
      setSwipeDirection(null);
      setIsVoting(false);
    }, CARD_EXIT_MS);
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

  const handleSuccessCertifyCard = () => {
    swipeCertifyCard("right");
  };

  const handleSubmitFromChanceCard = async (text: string) => {
    await onSubmitStatement(text);
    onChanceCardSwiped();
  };

  const handleDemographicsAnswer = (
    questionId: string,
    answers: string[],
    direction?: "left" | "right",
  ) => {
    const isDeclined = answers.length === 0;
    setSwipeDirection(direction ?? (isDeclined ? "left" : "right"));
    setSwipedCardId(`demographics-${questionId}`);
    saveDemographicAnswers(questionId, answers);

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

  const handleConfirmFlag = async (reason: string) => {
    if (!statementToFlag) return;

    setShowFlagDialog(false);
    passWithoutReveal(statementToFlag);

    await flagStatement(statementToFlag.id, statementToFlag.roomId, reason);
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
              if (card.type === "cover") return "cover";
              if (card.type === "demographics") return `demographics-${card.question.id}`;
              if (card.type === "feedback") return "feedback";
              if (card.type === "event-invite") return "event-invite";
              return "unknown";
            };

            return (
              <SwipeableCard
                key={getCardKey()}
                card={card}
                room={room}
                statements={statements}
                index={index}
                isTopCard={isTopCard}
                onDragEnd={(event, info) => handleDragEnd(card, event, info)}
                getTypeIcon={getTypeIcon}
                direction={isBeingSwiped ? swipeDirection : null}
                currentIndex={
                  statements.length - unvotedStatements.length + 1
                }
                totalStatements={statements.length}
                voteReveal={
                  card.type === "statement" &&
                  voteReveal?.statement.id === card.statement.id
                    ? voteReveal
                    : null
                }
                allowAnonymous={allowAnonymous}
                isAnonymous={isAnonymous}
                onSubmitStatement={handleSubmitFromChanceCard}
                onShowAccountSetupModal={onShowAccountSetupModal}
                onDemographicsAnswer={handleDemographicsAnswer}
                onCertifySuccess={handleSuccessCertifyCard}
                onFeedbackTellMore={() => {
                  if (card.type === "feedback") {
                    onFeedbackTellMore(card.statement);
                  }
                }}
                onAgree={handleAgreeTapped}
                onDisagree={handleDisagreeTapped}
                onPass={handlePassTapped}
                onStartVoting={handleStartVotingTapped}
                onGoToEvent={handleGoToEvent}
                onKeepVoting={handleKeepVoting}
                onSuperAgree={() => {
                  if (card.type === "statement") {
                    handleTapVote(
                      card.statement,
                      "super_agree",
                      "up",
                    );
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

function findEventInviteIndex(
  votedStatementIds: Set<string>,
  voteReveal: VoteReveal | null,
  hasFlyerStatement: boolean,
  cardCount: number,
): number {
  const isRevealingVotedStatement =
    voteReveal !== null &&
    votedStatementIds.has(voteReveal.statement.id);
  const statementsLeftDeck =
    votedStatementIds.size - (isRevealingVotedStatement ? 1 : 0);
  const flyerStatementCount = hasFlyerStatement ? 1 : 0;
  const statementsStillBeforeInvite = Math.max(
    STATEMENTS_BEFORE_EVENT_INVITE -
      flyerStatementCount -
      statementsLeftDeck,
    0,
  );
  return Math.min(statementsStillBeforeInvite, cardCount);
}
