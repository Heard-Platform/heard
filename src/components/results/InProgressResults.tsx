import { motion } from "motion/react";
import { Card } from "../ui/card";
import { VotesDrawer } from "./VotesDrawer";
import type { Statement, VoteType } from "../../types";
import { LiveHighlights, buildLiveHighlights } from "./LiveHighlights";

interface InProgressResultsProps {
  statements: Statement[];
  debateTitle: string;
  isAnonymous?: boolean;
  onFollowDiscussion?: () => void;
  onChangeVote: (
    statementId: string,
    newVote: VoteType,
  ) => Promise<void>;
}

export function InProgressResults({
  statements,
  debateTitle,
  isAnonymous,
  onFollowDiscussion,
  onChangeVote,
}: InProgressResultsProps) {
  const totalVotes = statements.reduce(
    (sum, s) => sum + s.agrees + s.superAgrees + s.disagrees + s.passes,
    0,
  );

  const highlights = buildLiveHighlights(statements);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="relative"
      style={{ zIndex: 1 }}
    >
      <Card className="p-3 md:p-4 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-2 border-orange-300 overflow-hidden relative">
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
            className="flex flex-row items-center justify-between gap-2 mb-4"
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
            <VotesDrawer
              statements={statements}
              debateTitle={debateTitle}
              onChangeVote={onChangeVote}
            />
          </motion.div>

          <div className="mb-4">
            <LiveHighlights highlights={highlights} />

            {highlights.length === 0 && (
              <p className="text-xs sm:text-sm text-center text-muted-foreground py-2">
                Waiting for the first decisive votes…
              </p>
            )}
          </div>

          {isAnonymous && onFollowDiscussion && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full mt-4 py-3 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onFollowDiscussion}
            >
              <motion.div
                className="absolute inset-0 bg-white/30"
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <motion.span
                className="relative z-10 flex items-center justify-center gap-2"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                Certify your vote
              </motion.span>
            </motion.button>
          )}

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
                    : "💥 EPIC vote-fest in progress!"}
            </motion.p>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}