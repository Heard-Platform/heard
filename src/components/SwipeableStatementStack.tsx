import { useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
} from "motion/react";
import {
  CheckCircle,
  XCircle,
  Ban,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Star,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import type { Statement, VoteType } from "../types";

interface SwipeableStatementStackProps {
  statements: Statement[];
  onVote: (
    id: string,
    voteType: VoteType,
  ) => Promise<Statement | null>;
  currentUserId?: string;
}

const SWIPE_THRESHOLD = 100;

export function SwipeableStatementStack({
  statements,
  onVote,
  currentUserId,
}: SwipeableStatementStackProps) {
  const [votedStatementIds, setVotedStatementIds] = useState<
    Set<string>
  >(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const [swipedCardId, setSwipedCardId] = useState<
    string | null
  >(null);
  const [swipeDirection, setSwipeDirection] = useState<
    "left" | "right" | "down" | "up" | null
  >(null);

  // Filter out statements the user has already voted on (either previously or just now)
  const unvotedStatements = statements.filter((statement) => {
    const hasVotedBefore =
      currentUserId && statement.voters?.[currentUserId];
    const justVoted = votedStatementIds.has(statement.id);
    return !hasVotedBefore && !justVoted;
  });

  // Reset voted IDs when statements list changes significantly
  useEffect(() => {
    setVotedStatementIds(new Set());
    setSwipedCardId(null);
    setSwipeDirection(null);
  }, [statements.length]);

  const currentStatement = unvotedStatements[0];
  const hasMoreCards = unvotedStatements.length > 0;

  const handleVote = async (
    statementId: string,
    voteType: VoteType,
    direction: "left" | "right" | "down" | "up",
  ) => {
    if (isVoting) return;

    setIsVoting(true);
    setSwipedCardId(statementId);
    setSwipeDirection(direction);

    // Immediately mark as voted locally to prevent reappearance
    setVotedStatementIds((prev) =>
      new Set(prev).add(statementId),
    );

    // Find the statement to get current vote counts
    const statement = statements.find(
      (s) => s.id === statementId,
    );

    if (statement) {
      const { agrees, disagrees, superAgrees, passes, text } =
        statement;

      // Truncate statement text for toast
      const truncatedText =
        text.length > 50 ? `${text.substring(0, 50)}...` : text;

      // Calculate optimistic vote counts (adding the user's vote)
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

      // Calculate total votes and percentage with optimistic counts
      const totalVotes =
        newSuperAgrees + newAgrees + newDisagrees + newPasses;

      // Show toast immediately with optimistic data
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

    try {
      await onVote(statementId, voteType);
      // Reset after animation completes
      setTimeout(() => {
        setSwipedCardId(null);
        setSwipeDirection(null);
        setIsVoting(false);
      }, 600);
    } catch (error) {
      console.error("Error voting:", error);
      // Remove from voted set if vote failed
      setVotedStatementIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(statementId);
        return newSet;
      });
      setSwipedCardId(null);
      setSwipeDirection(null);
      setIsVoting(false);
    }
  };

  const handleDragEnd = (
    statementId: string,
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const { offset, velocity } = info;
    const swipeX = offset.x;
    const swipeY = offset.y;
    const velocityX = velocity.x;
    const velocityY = velocity.y;

    // Up swipe - Super Agree
    if (swipeY < -90 || velocityY < -500) {
      handleVote(statementId, "super_agree", "up");
    }
    // Down swipe - Pass
    else if (swipeY > 90 || velocityY > 500) {
      handleVote(statementId, "pass", "down");
    }
    // Right swipe - Agree
    else if (swipeX > SWIPE_THRESHOLD || velocityX > 500) {
      handleVote(statementId, "agree", "right");
    }
    // Left swipe - Disagree
    else if (swipeX < -SWIPE_THRESHOLD || velocityX < -500) {
      handleVote(statementId, "disagree", "left");
    }
  };

  if (!hasMoreCards) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl text-primary">
            All caught up!
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
    <div className="relative w-full max-w-md mx-auto">
      {/* Instructions */}
      <div className="mb-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Swipe to vote
        </p>
        <div className="flex justify-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1 text-red-600">
            <ArrowLeft className="w-4 h-4" />
            <span>Disagree</span>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <ArrowRight className="w-4 h-4" />
            <span>Agree</span>
          </div>
          <div className="flex items-center gap-1 text-green-700 font-semibold">
            <ArrowUp className="w-4 h-4" />
            <span>Super Agree</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <ArrowDown className="w-4 h-4" />
            <span>Pass</span>
          </div>
        </div>
      </div>

      {/* Card Stack Container */}
      <div className="relative h-[500px]">
        {/* Show next 3 cards in stack */}
        {unvotedStatements
          .slice(0, 3)
          .map((statement, index) => {
            const isTopCard = index === 0;
            const isBeingSwiped = swipedCardId === statement.id;

            return (
              <SwipeableCard
                key={statement.id}
                statement={statement}
                index={index}
                isTopCard={isTopCard}
                onDragEnd={(event, info) =>
                  handleDragEnd(statement.id, event, info)
                }
                getTypeColor={getTypeColor}
                getTypeIcon={getTypeIcon}
                direction={
                  isBeingSwiped ? swipeDirection : null
                }
              />
            );
          })}
      </div>

      {/* Card counter */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        {statements.length - unvotedStatements.length + 1} /{" "}
        {statements.length}
      </div>
    </div>
  );
}

interface SwipeableCardProps {
  statement: Statement;
  index: number;
  isTopCard: boolean;
  onDragEnd: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => void;
  getTypeColor: (type?: string) => string;
  getTypeIcon: (type?: string) => string | null;
  direction: "left" | "right" | "down" | "up" | null;
}

function SwipeableCard({
  statement,
  index,
  isTopCard,
  onDragEnd,
  getTypeColor,
  getTypeIcon,
  direction,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const cardOpacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0, 1, 1, 1, 0],
  );

  // Visual indicator opacities - must be defined at top level
  const disagreeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const agreeOpacity = useTransform(x, [0, 100], [0, 1]);
  const superAgreeOpacity = useTransform(y, [-100, 0], [1, 0]);
  const passOpacity = useTransform(y, [0, 100], [0, 1]);

  // Reset motion values when this card becomes the top card
  useEffect(() => {
    if (isTopCard) {
      x.set(0);
      y.set(0);
    }
  }, [isTopCard, x, y]);

  // Calculate exit animation based on direction
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
      drag={isTopCard ? true : false}
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
        className={`p-6 rounded-xl border-2 shadow-xl ${getTypeColor(statement.type)} ${
          isTopCard
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-default"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Anonymous
            </span>
            {statement.isSpicy && (
              <span className="text-lg">🌶️</span>
            )}
            {getTypeIcon(statement.type) && (
              <span className="text-lg">
                {getTypeIcon(statement.type)}
              </span>
            )}
          </div>
          {statement.type && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground">
              {statement.type.toUpperCase()}
            </span>
          )}
        </div>

        {/* Statement Text */}
        <div className="mb-6 min-h-[200px] flex items-center justify-center">
          <p className="text-lg leading-relaxed text-center">
            {statement.text}
          </p>
        </div>

        {/* Visual indicators for swipe direction */}
        {isTopCard && (
          <>
            <motion.div
              className="absolute top-8 left-8 bg-red-500 text-white px-4 py-2 rounded-lg text-xl rotate-[-25deg] shadow-lg"
              style={{
                opacity: disagreeOpacity,
              }}
            >
              <XCircle className="w-8 h-8" />
            </motion.div>
            <motion.div
              className="absolute top-8 right-8 bg-green-500 text-white px-4 py-2 rounded-lg text-xl rotate-[25deg] shadow-lg"
              style={{
                opacity: agreeOpacity,
              }}
            >
              <CheckCircle className="w-8 h-8" />
            </motion.div>
            <motion.div
              className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-xl shadow-lg"
              style={{
                opacity: superAgreeOpacity,
              }}
            >
              <Star className="w-8 h-8 fill-white" />
            </motion.div>
            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-500 text-white px-4 py-2 rounded-lg text-xl shadow-lg"
              style={{
                opacity: passOpacity,
              }}
            >
              <Ban className="w-8 h-8" />
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}