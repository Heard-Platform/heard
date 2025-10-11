import { motion } from "motion/react";
import {
  Users,
  Target,
  Zap,
  MessageCircle,
} from "lucide-react";

type Round =
  | "lobby"
  | "round1"
  | "round2"
  | "round3"
  | "results";
type SubPhase = "posting" | "voting" | "review";

interface RoundIndicatorProps {
  currentRound: Round;
  currentSubPhase?: SubPhase;
  gameNumber: number;
  mode?: "realtime" | "host-controlled";
}

export function RoundIndicator({
  currentRound,
  currentSubPhase,
  gameNumber,
  mode = "realtime",
}: RoundIndicatorProps) {
  const rounds = [
    {
      key: "round1" as Round,
      label: "Round 1",
      icon: MessageCircle,
      color: "blue",
    },
    {
      key: "round2" as Round,
      label: "Round 2",
      icon: Users,
      color: "green",
    },
    {
      key: "round3" as Round,
      label: "Round 3",
      icon: Zap,
      color: "purple",
    },
  ];

  const getCurrentRoundInfo = () => {
    // For host-controlled mode, don't show subphase in title
    if (mode === "host-controlled") {
      if (currentRound === "round1")
        return {
          title: "Round 1",
          subtitle: "Post and vote on statements",
          emoji: "💭",
        };
      if (currentRound === "round2")
        return {
          title: "Round 2",
          subtitle: "Keep the discussion going",
          emoji: "💬",
        };
      if (currentRound === "round3")
        return {
          title: "Round 3",
          subtitle: "Final statements and votes",
          emoji: "🔥",
        };
      if (currentRound === "results")
        return {
          title: "Game Complete",
          subtitle: "See the results",
          emoji: "🏆",
        };
      return {
        title: "Debate",
        subtitle: "Express yourself",
        emoji: "💬",
      };
    }

    // For realtime mode, show subphase in title
    if (currentRound === "round1") {
      if (currentSubPhase === "posting")
        return {
          title: "Round 1 - Post",
          subtitle: "Drop your takes!",
          emoji: "💭",
        };
      if (currentSubPhase === "voting")
        return {
          title: "Round 1 - Vote",
          subtitle: "React to statements",
          emoji: "🗳️",
        };
      if (currentSubPhase === "review")
        return {
          title: "Round 1 - Results",
          subtitle: "See what's happening",
          emoji: "📊",
        };
    }
    if (currentRound === "round2") {
      if (currentSubPhase === "posting")
        return {
          title: "Round 2 - Post",
          subtitle: "Keep the discussion going",
          emoji: "💬",
        };
      if (currentSubPhase === "voting")
        return {
          title: "Round 2 - Vote",
          subtitle: "Shape the conversation",
          emoji: "🗳️",
        };
      if (currentSubPhase === "review")
        return {
          title: "Round 2 - Results",
          subtitle: "Track the momentum",
          emoji: "📊",
        };
    }
    if (currentRound === "round3") {
      if (currentSubPhase === "posting")
        return {
          title: "Round 3 - Post",
          subtitle: "Final statements",
          emoji: "🔥",
        };
      if (currentSubPhase === "voting")
        return {
          title: "Round 3 - Vote",
          subtitle: "Last chance to vote",
          emoji: "🗳️",
        };
      if (currentSubPhase === "review")
        return {
          title: "Round 3 - Results",
          subtitle: "Wrap it up",
          emoji: "📊",
        };
    }
    if (currentRound === "results")
      return {
        title: "Game Complete",
        subtitle: "See the results",
        emoji: "🏆",
      };
    return {
      title: "Debate",
      subtitle: "Express yourself",
      emoji: "💬",
    };
  };

  const roundInfo = getCurrentRoundInfo();

  return (
    <div className="text-center space-y-4">
      <motion.div
        key={`${currentRound}-${currentSubPhase}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="space-y-2"
      >
        <motion.div
          className="text-4xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          {roundInfo.emoji}
        </motion.div>
        <h2 className="text-2xl font-semibold text-primary">
          {roundInfo.title}
        </h2>
        <p className="text-muted-foreground">
          {roundInfo.subtitle}
        </p>
        <div className="text-sm text-muted-foreground">
          Game {gameNumber}
        </div>
      </motion.div>

      <div className="flex justify-center items-center gap-2 max-w-md mx-auto">
        {rounds.map((round, index) => {
          const Icon = round.icon;
          const isActive = round.key === currentRound;
          const isCompleted =
            rounds.findIndex((r) => r.key === currentRound) >
            index;

          return (
            <motion.div
              key={round.key}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isActive
                  ? `bg-${round.color}-100 border-2 border-${round.color}-500`
                  : isCompleted
                    ? "bg-green-100 border-2 border-green-500"
                    : "bg-muted border-2 border-transparent"
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: isActive ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive
                    ? `text-${round.color}-600`
                    : isCompleted
                      ? "text-green-600"
                      : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-xs ${
                  isActive
                    ? `text-${round.color}-700`
                    : isCompleted
                      ? "text-green-700"
                      : "text-muted-foreground"
                }`}
              >
                {round.label}
              </span>
              {/* Sub-phase indicator - only for realtime mode */}
              {isActive && mode === "realtime" && (
                <div className="flex gap-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentSubPhase === "posting"
                        ? "bg-orange-400"
                        : "bg-gray-300"
                    }`}
                  />
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentSubPhase === "voting"
                        ? "bg-blue-400"
                        : "bg-gray-300"
                    }`}
                  />
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentSubPhase === "review"
                        ? "bg-green-400"
                        : "bg-gray-300"
                    }`}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}