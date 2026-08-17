import { motion } from "motion/react";
import { Card } from "../ui/card";
import { VotesDrawer } from "./VotesDrawer";
import { RenderedStatement } from "../RenderedStatement";
import type { Statement, VoteType } from "../../types";
import { isDefined } from "../../utils/array";

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

function TugBar({
  side,
  percentage,
}: {
  side: "agree" | "disagree";
  percentage: number;
}) {
  const isAgree = side === "agree";
  return (
    <motion.div
      className={
        isAgree
          ? "absolute left-0 top-0 h-full bg-gradient-to-r agree-gradient-from agree-gradient-to"
          : "absolute right-0 top-0 h-full bg-gradient-to-l disagree-gradient-from disagree-gradient-to"
      }
      initial={{ width: 0 }}
      animate={{ width: `${percentage}%` }}
      transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
    />
  );
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

  const decisiveStmts = statements
    .map((s) => ({
      statement: s,
      agrees: s.agrees + s.superAgrees,
      disagrees: s.disagrees,
      decisive: s.agrees + s.superAgrees + s.disagrees,
    }))
    .filter((s) => s.decisive > 0);

  const topAgreed = [...decisiveStmts].sort((a, b) => {
    const pctDiff = b.agrees / b.decisive - a.agrees / a.decisive;
    return pctDiff !== 0 ? pctDiff : b.decisive - a.decisive;
  })[0];

  const remainingAfterAgreed = decisiveStmts.filter(
    (s) => s.statement.id !== topAgreed?.statement.id,
  );

  const topDisagreed = [...remainingAfterAgreed].sort((a, b) => {
    const pctDiff = b.disagrees / b.decisive - a.disagrees / a.decisive;
    return pctDiff !== 0 ? pctDiff : b.decisive - a.decisive;
  })[0];

  const remainingAfterDisagreed = remainingAfterAgreed.filter(
    (s) => s.statement.id !== topDisagreed?.statement.id,
  );

  const mostSplit = [...remainingAfterDisagreed].sort((a, b) => {
    const splitA = Math.abs(a.agrees / a.decisive - 0.5);
    const splitB = Math.abs(b.agrees / b.decisive - 0.5);
    return splitA !== splitB ? splitA - splitB : b.decisive - a.decisive;
  })[0];

  const highlights = [
    topAgreed && { ...topAgreed, label: "Top Agreed", icon: "🏆" },
    topDisagreed && { ...topDisagreed, label: "Top Disagreed", icon: "👎" },
    mostSplit && { ...mostSplit, label: "Most Split", icon: "⚖️" },
  ].filter(isDefined);

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

          {/* Live Highlights */}
          <div className="space-y-3 md:space-y-4 mb-4">
            {highlights.map(
              ({ statement: s, agrees, disagrees, decisive, label, icon }, index) => {
                const agreePct = (agrees / decisive) * 100;
                const disagreePct = 100 - agreePct;

                return (
                  <motion.div
                    key={s.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] sm:text-xs font-semibold text-orange-700">
                        {icon} {label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] sm:text-xs truncate min-w-0 flex-1">
                        <RenderedStatement text={s.text} />
                      </p>
                      <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                        {decisive} vote{decisive === 1 ? "" : "s"}
                      </span>
                    </div>

                    {/* Tug-of-war bar */}
                    <div className="relative h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden">
                      <TugBar side="agree" percentage={agreePct} />
                      <TugBar side="disagree" percentage={disagreePct} />
                      {/* Center reference line */}
                      <div className="absolute left-1/2 top-0 h-full w-px bg-white/80 -translate-x-1/2 z-10" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
                      <span className="text-emerald-700 font-medium">
                        ✅ {agrees} agree{agrees === 1 ? "" : "s"}
                      </span>
                      <span className="text-rose-700 font-medium">
                        {disagrees} disagree{disagrees === 1 ? "" : "s"} ❌
                      </span>
                    </div>
                  </motion.div>
                );
              },
            )}

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