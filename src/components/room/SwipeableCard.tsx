import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
} from "motion/react";
import type { Card } from "../../types";
import { getPastelColor } from "../../utils/colors";
import { ChanceCard } from "./ChanceCard";
import { StatementCard } from "./StatementCard";
import { YouTubeCard } from "./YouTubeCard";

interface SwipeableCardProps {
  card: Card;
  index: number;
  isTopCard: boolean;
  direction: "left" | "right" | "down" | "up" | null;
  currentIndex: number;
  totalStatements: number;
  allowAnonymous: boolean;
  isAnonymous: boolean;
  getTypeIcon: (type?: string) => string | null;
  onDragEnd: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => void;
  onSubmitStatement: (text: string) => Promise<void>;
  onShowAccountSetupModal: (featureText: string) => void;
  onSkip: () => void;
}

export function SwipeableCard({
  card,
  index,
  isTopCard,
  direction,
  currentIndex,
  totalStatements,
  allowAnonymous,
  isAnonymous,
  getTypeIcon,
  onDragEnd,
  onSubmitStatement,
  onShowAccountSetupModal,
  onSkip,
}: SwipeableCardProps) {
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
      className="absolute top-0 left-0 w-full"
      style={{
        x: isTopCard ? x : 0,
        y: isTopCard ? y : 0,
        rotate: isTopCard ? rotate : 0,
        opacity: isTopCard ? cardOpacity : 1 - index * 0.2,
        zIndex: 10 - index,
        scale: 1 - index * 0.05,
        pointerEvents: isTopCard ? "auto" : "none",
      }}
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragEnd={isTopCard ? onDragEnd : undefined}
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
        className={`p-6 rounded-xl border-2 shadow-xl ${
          card.type === "chance"
            ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-300"
            : card.type === "youtube"
            ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300"
            : getPastelColor(card.statement.id)
        } ${
          isTopCard
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-default"
        }`}
      >
        {card.type === "chance" ? (
          <ChanceCard
            isTopCard={isTopCard}
            onSubmitStatement={onSubmitStatement}
            allowAnonymous={allowAnonymous}
            isAnonymous={isAnonymous}
            onShowAccountSetupModal={onShowAccountSetupModal}
          />
        ) : card.type === "youtube" ? (
          <YouTubeCard
            url={card.url}
            isTopCard={isTopCard}
          />
        ) : card.statement ? (
          <StatementCard
            statement={card.statement}
            isTopCard={isTopCard}
            currentIndex={currentIndex}
            totalStatements={totalStatements}
            getTypeIcon={getTypeIcon}
            disagreeOpacity={disagreeOpacity}
            agreeOpacity={agreeOpacity}
            superAgreeOpacity={superAgreeOpacity}
            passOpacity={passOpacity}
            onSkip={onSkip}
          />
        ) : null}
      </div>
    </motion.div>
  );
}