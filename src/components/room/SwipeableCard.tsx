import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
} from "motion/react";
import type { Card, DebateRoom } from "../../types";
import type { VoteReveal } from "../../utils/vote-reveal";
import { getPastelColor } from "../../utils/colors";
import { ChanceCard } from "./ChanceCard";
import { CoverCard } from "./CoverCard";
import { DemographicsCard } from "./DemographicsCard";
import { StatementCard } from "./StatementCard";
import { FeedbackCard, FEEDBACK_CARD_SHELL_CLASS } from "./FeedbackCard";
import { EventInviteCard } from "./EventInviteCard";

interface SwipeableCardProps {
  card: Card;
  room: DebateRoom;
  index: number;
  isTopCard: boolean;
  direction: "left" | "right" | "down" | "up" | null;
  currentIndex: number;
  totalStatements: number;
  voteReveal: VoteReveal | null;
  allowAnonymous: boolean;
  isAnonymous: boolean;
  getTypeIcon: (type?: string) => string | null;
  onDragEnd: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => void;
  onSubmitStatement: (text: string) => Promise<void>;
  onShowAccountSetupModal: (featureText: string) => void;
  onDemographicsAnswer?: (id: string, answers: string[]) => void;
  onFeedbackTellMore: () => void;
  onAgree: (card: Card) => void;
  onDisagree: (card: Card) => void;
  onPass: (card: Card) => void;
  onStartVoting: () => void;
  onGoToEvent: () => void;
  onKeepVoting: () => void;
  onSuperAgree: () => void;
  onFlag: () => void;
}

export function SwipeableCard({
  card,
  room,
  index,
  isTopCard,
  direction,
  currentIndex,
  totalStatements,
  voteReveal,
  allowAnonymous,
  isAnonymous,
  getTypeIcon,
  onDragEnd,
  onSubmitStatement,
  onShowAccountSetupModal,
  onDemographicsAnswer,
  onFeedbackTellMore,
  onAgree,
  onDisagree,
  onPass,
  onStartVoting,
  onGoToEvent,
  onKeepVoting,
  onSuperAgree,
  onFlag,
}: SwipeableCardProps) {
  const isDraggable = isTopCard && !card.isUndraggable;
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const cardOpacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0, 1, 1, 1, 0],
  );

  const disagreeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const agreeOpacity = useTransform(x, [0, 100], [0, 1]);
  const superAgreeOpacity = useTransform(y, [-100, 0], [1, 0]);
  const passOpacity = useTransform(y, [0, 100], [0, 1]);

  useEffect(() => {
    if (isTopCard) {
      x.set(0);
      y.set(0);
    }
  }, [isTopCard, x, y]);

  const getExitAnimation = () => {
    if (!direction) return {};

    switch (direction) {
      case "left":
        return { x: -500, rotate: -45, opacity: 0 };
      case "right":
        return { x: 500, rotate: 45, opacity: 0 };
      case "up":
        return { y: -500, opacity: 0, scale: 1.1 };
      case "down":
        return { y: 500, opacity: 0 };
      default:
        return {};
    }
  };

  return (
    <motion.div
      className={isTopCard ? "relative w-full" : "absolute top-0 left-0 w-full"}
      style={{
        x: isTopCard ? x : 0,
        y: isTopCard ? y : 0,
        rotate: isTopCard ? rotate : 0,
        opacity: isTopCard ? cardOpacity : 1,
        zIndex: 10 - index,
        scale: 1 - index * 0.05,
        pointerEvents: isTopCard ? "auto" : "none",
        touchAction: isDraggable ? "none" : "auto",
      }}
      drag={isDraggable ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragEnd={isDraggable ? onDragEnd : undefined}
      animate={
        isTopCard && direction
          ? getExitAnimation()
          : {
              scale: 1 - index * 0.05,
              y: index * 10,
            }
      }
      transition={{
        scale: { duration: 0.2 },
        y: { duration: 0.2 },
        opacity: { duration: 0.5 },
        x: { duration: 0.5 },
        rotate: { duration: 0.5 },
      }}
    >
      <div
        className={`${
          card.type === "demographics"
            ? "p-0"
            : card.type === "event-invite"
            ? "p-5"
            : "p-6"
        } rounded-xl border-2 shadow-xl ${
          card.type === "chance"
            ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-300"
            : card.type === "cover" && card.cover.type === "youtube"
            ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300"
            : card.type === "cover" && card.cover.type === "image"
            ? "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-300"
            : card.type === "demographics"
            ? "border-transparent p-0"
            : card.type === "feedback"
            ? FEEDBACK_CARD_SHELL_CLASS
            : card.type === "event-invite"
            ? "normal-bg"
            : card.type === "statement"
            ? getPastelColor(card.statement.id)
            : ""
        } ${
          isDraggable
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-default"
        }`}
        style={{
          touchAction: isDraggable ? "none" : "auto",
          height: !isTopCard ? "286px" : "auto",
          overflow: !isTopCard ? "hidden" : "visible",
        }}
      >
        {card.type === "chance" ? (
          <ChanceCard
            room={room}
            isTopCard={isTopCard}
            allowAnonymous={allowAnonymous}
            isAnonymous={isAnonymous}
            onSubmitStatement={onSubmitStatement}
            onShowAccountSetupModal={onShowAccountSetupModal}
          />
        ) : card.type === "cover" ? (
          <CoverCard
            cover={card.cover}
            isTopCard={isTopCard}
            onStartVoting={onStartVoting}
          />
        ) : card.type === "demographics" ? (
          <DemographicsCard
            question={card.question}
            onAnswer={(answers) => {
              onDemographicsAnswer &&
                onDemographicsAnswer(card.question.id, answers);
            }}
          />
        ) : card.type === "feedback" ? (
          <FeedbackCard
            roomId={room.id}
            statement={card.statement}
            isTopCard={isTopCard}
            disagreeOpacity={disagreeOpacity}
            agreeOpacity={agreeOpacity}
            superAgreeOpacity={superAgreeOpacity}
            passOpacity={passOpacity}
            onAgree={() => onAgree(card)}
            onDisagree={() => onDisagree(card)}
            onTellMore={onFeedbackTellMore}
          />
        ) : card.type === "event-invite" ? (
          <EventInviteCard
            invite={card.invite}
            onGoToEvent={onGoToEvent}
            onKeepVoting={onKeepVoting}
          />
        ) : card.type === "statement" ? (
          <StatementCard
            statement={card.statement}
            room={room}
            isTopCard={isTopCard}
            currentIndex={currentIndex}
            totalStatements={totalStatements}
            voteReveal={voteReveal}
            stampedVote={card.stampedVote ?? null}
            getTypeIcon={getTypeIcon}
            disagreeOpacity={disagreeOpacity}
            agreeOpacity={agreeOpacity}
            superAgreeOpacity={superAgreeOpacity}
            passOpacity={passOpacity}
            onAgree={() => onAgree(card)}
            onDisagree={() => onDisagree(card)}
            onPass={() => onPass(card)}
            onSuperAgree={onSuperAgree}
            onFlag={onFlag}
          />
        ) : null}
      </div>
    </motion.div>
  );
}