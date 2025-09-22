import { motion } from "motion/react";
import { Users, Target, Zap, MessageCircle } from "lucide-react";

type Phase =
  | "lobby"
  | "initial"
  | "bridge"
  | "crux"
  | "plurality"
  | "results";
type SubPhase = "posting" | "voting" | "review";

interface RoundIndicatorProps {
  currentRound: Phase;
  currentSubPhase?: SubPhase;
  roundNumber: number;
}

export function RoundIndicator({
  currentRound,
  currentSubPhase,
  roundNumber,
}: RoundIndicatorProps) {
  const rounds = [
    {
      key: "initial" as Phase,
      label: "Initial Takes",
      icon: MessageCircle,
      color: "gray",
    },
    {
      key: "bridge" as Phase,
      label: "Bridges",
      icon: Users,
      color: "blue",
    },
    {
      key: "crux" as Phase,
      label: "Cruxes",
      icon: Target,
      color: "red",
    },
    {
      key: "plurality" as Phase,
      label: "Pluralities",
      icon: Zap,
      color: "purple",
    },
  ];

  const getCurrentRoundInfo = () => {
    if (currentRound === "initial") {
      if (currentSubPhase === "posting")
        return {
          title: "Initial Takes",
          subtitle: "Share your perspective",
          emoji: "💭",
        };
      if (currentSubPhase === "voting")
        return {
          title: "Initial Voting",
          subtitle: "Vote on initial takes",
          emoji: "🗳️",
        };
      if (currentSubPhase === "review")
        return {
          title: "Initial Review",
          subtitle: "See how it's shaping up",
          emoji: "📊",
        };
    }
    if (currentRound === "bridge") {
      if (currentSubPhase === "posting")
        return {
          title: "Bridge Building",
          subtitle: "Find common ground",
          emoji: "🌉",
        };
      if (currentSubPhase === "voting")
        return {
          title: "Bridge Voting",
          subtitle: "Vote on bridges",
          emoji: "🗳️",
        };
      if (currentSubPhase === "review")
        return {
          title: "Bridge Review",
          subtitle: "Review bridge progress",
          emoji: "📊",
        };
    }
    if (currentRound === "crux") {
      if (currentSubPhase === "posting")
        return {
          title: "Crux Hunting",
          subtitle: "Core disagreements",
          emoji: "⚡",
        };
      if (currentSubPhase === "voting")
        return {
          title: "Crux Voting",
          subtitle: "Vote on cruxes",
          emoji: "🗳️",
        };
      if (currentSubPhase === "review")
        return {
          title: "Crux Review",
          subtitle: "Review key disagreements",
          emoji: "📊",
        };
    }
    if (currentRound === "plurality") {
      if (currentSubPhase === "posting")
        return {
          title: "Plurality Mining",
          subtitle: "Underrepresented views",
          emoji: "💎",
        };
      if (currentSubPhase === "voting")
        return {
          title: "Plurality Voting",
          subtitle: "Vote on pluralities",
          emoji: "🗳️",
        };
      if (currentSubPhase === "review")
        return {
          title: "Plurality Review",
          subtitle: "Review diverse views",
          emoji: "📊",
        };
    }
    if (currentRound === "results")
      return {
        title: "Round Complete",
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
        <p className="text-muted-foreground">{roundInfo.subtitle}</p>
        <div className="text-sm text-muted-foreground">
          Round {roundNumber}
        </div>
      </motion.div>

      <div className="flex justify-center items-center gap-2 max-w-md mx-auto">
        {rounds.map((round, index) => {
          const Icon = round.icon;
          const isActive = round.key === currentRound;
          const isCompleted =
            rounds.findIndex((r) => r.key === currentRound) > index;

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
              {/* Sub-phase indicator */}
              {isActive && (
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
