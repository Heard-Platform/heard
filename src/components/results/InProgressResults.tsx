import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { VotesDrawer } from "./VotesDrawer";
import type { Statement, VoteType } from "../../types";

interface InProgressResultsProps {
  statements: Statement[];
  currentUserId?: string;
  onChangeVote?: (statementId: string, newVote: VoteType) => Promise<void>;
}

export function InProgressResults({
  statements,
  currentUserId,
  onChangeVote,
}: InProgressResultsProps) {
  const totalVotes = statements.reduce(
    (sum, s) => sum + s.agrees + s.disagrees + s.passes,
    0,
  );
  const maxVotes = Math.max(
    ...statements.map((s) => s.agrees),
    1,
  );

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <Card className="p-3 md:p-4 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-2 border-orange-300 overflow-hidden relative">
        {/* Animated background pulse */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 to-orange-200/20"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="relative z-10">
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h3 className="flex items-center gap-1.5 md:gap-2 text-base sm:text-lg md:text-2xl">
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                <span className="hidden sm:inline">
                  ⚡ VOTING IN PROGRESS! ⚡
                </span>
                <span className="sm:hidden">⚡ LIVE! ⚡</span>
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Badge className="bg-orange-500 text-white text-xs whitespace-nowrap">
                  {totalVotes} votes 🔥
                </Badge>
              </motion.div>
              <VotesDrawer
                statements={statements}
                currentUserId={currentUserId}
                onChangeVote={onChangeVote}
              />
            </div>
          </motion.div>

          {/* Live Leaderboard - Racing Bars */}
          <div className="space-y-3 md:space-y-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                <span className="hidden sm:inline">
                  Live Standings
                </span>
                <span className="sm:hidden">Standings</span>
              </h4>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                Most popular opinions
              </span>
            </div>

            {[...statements]
              .sort((a, b) => b.agrees - a.agrees)
              .slice(0, 3)
              .map((statement, index) => {
                const percentage =
                  maxVotes > 0
                    ? (statement.agrees / maxVotes) * 100
                    : 0;

                // Gradient colors for each position
                const gradients = [
                  { badge: "from-yellow-500 to-orange-500", bar: "from-yellow-400 to-orange-500" },
                  { badge: "from-orange-500 to-red-500", bar: "from-orange-400 to-red-500" },
                  { badge: "from-red-500 to-pink-500", bar: "from-red-400 to-pink-500" },
                ];

                return (
                  <motion.div
                    key={statement.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <span className="text-base sm:text-lg shrink-0">
                          {index === 0
                            ? "🥇"
                            : index === 1
                              ? "🥈"
                              : "🥉"}
                        </span>
                        <p className="text-[10px] sm:text-xs truncate">
                          {statement.text}
                        </p>
                      </div>
                      <motion.div
                        key={statement.agrees}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs sm:text-sm font-medium shrink-0 bg-gradient-to-r ${gradients[index].badge} text-white`}
                      >
                        {statement.agrees}
                      </motion.div>
                    </div>

                    {/* Racing bar */}
                    <div className="h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${gradients[index].bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{
                          duration: 0.8,
                          type: "spring",
                          stiffness: 50,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* Quick Stats - Fun metrics */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-2 sm:gap-3"
          >
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 bg-white/80 backdrop-blur rounded-lg border-2 border-yellow-300">
              <motion.div
                className="text-sm sm:text-base md:text-lg font-mono text-yellow-600"
                key={
                  [...statements].sort(
                    (a, b) => b.agrees - a.agrees,
                  )[0]?.agrees || 0
                }
                initial={{ scale: 1.5, color: "#ff6b00" }}
                animate={{ scale: 1, color: "#ca8a04" }}
              >
                {[...statements].sort(
                  (a, b) => b.agrees - a.agrees,
                )[0]?.agrees || 0}
              </motion.div>
              <div className="text-[9px] sm:text-[10px] md:text-xs text-yellow-700">
                👑{" "}
                <span className="hidden sm:inline">Leader</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 bg-white/80 backdrop-blur rounded-lg border-2 border-purple-300">
              <motion.div
                className="text-sm sm:text-base md:text-lg font-mono text-purple-600"
                key={totalVotes}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
              >
                {totalVotes}
              </motion.div>
              <div className="text-[9px] sm:text-[10px] md:text-xs text-purple-700">
                🗳️{" "}
                <span className="hidden sm:inline">Total</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 bg-white/80 backdrop-blur rounded-lg border-2 border-green-300">
              <motion.div
                className="text-sm sm:text-base md:text-lg font-mono text-green-600"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                {statements.filter((s) => s.agrees > 0).length}
              </motion.div>
              <div className="text-[9px] sm:text-[10px] md:text-xs text-green-700">
                ⭐{" "}
                <span className="hidden sm:inline">Liked</span>
              </div>
            </div>
          </motion.div>

          {/* Fun encouragement message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-3 md:mt-4 text-center"
          >
            <motion.p
              className="text-xs sm:text-sm text-orange-700 font-medium"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              {totalVotes === 0
                ? "🎯 Waiting for votes to roll in..."
                : totalVotes < 5
                  ? "🔥 The race is heating up!"
                  : totalVotes < 10
                    ? "⚡ Votes are pouring in!"
                    : "💥 EPIC voting battle in progress!"}
            </motion.p>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}