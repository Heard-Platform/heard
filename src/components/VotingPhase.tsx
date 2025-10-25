import { AnimatePresence } from "motion/react";
import { StatementCard } from "./StatementCard";
import { SwipeableStatementStack } from "./SwipeableStatementStack";
import type { Statement, VoteType } from "../types";

interface VotingPhaseProps {
  statements: Statement[];
  roomPhase: string;
  isVotingPhase: boolean;
  currentUserId?: string;
  onVote: (id: string, voteType: VoteType) => Promise<void>;
  onVoteComplete?: () => void;
}

export function VotingPhase({
  statements,
  roomPhase,
  isVotingPhase,
  currentUserId,
  onVote,
  onVoteComplete,
}: VotingPhaseProps) {
  // Convert current phase to round number
  const getCurrentRound = (phase: string): number => {
    switch (phase) {
      case "round1":
        return 1;
      case "round2":
        return 2;
      case "round3":
        return 3;
      default:
        return 1;
    }
  };

  const currentRound = getCurrentRound(roomPhase);
  const currentRoundStatements = statements.filter(
    (s) => s.round === currentRound
  );
  const previousRoundStatements = statements.filter(
    (s) => s.round !== currentRound
  );

  const handleVote = async (id: string, voteType: VoteType) => {
    await onVote(id, voteType);
    // Notify parent that user has voted
    if (onVoteComplete) {
      onVoteComplete();
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Round Statements - Swipeable Stack */}
      {currentRoundStatements.length > 0 && (
        <div className="space-y-4">
          <SwipeableStatementStack
            statements={currentRoundStatements}
            onVote={handleVote}
            currentUserId={currentUserId}
          />
        </div>
      )}

      {/* Previous Round Statements - Secondary */}
      {previousRoundStatements.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-px bg-border"></div>
                <h4 className="text-sm text-muted-foreground">
                  Previous Rounds ({previousRoundStatements.length})
                </h4>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                <AnimatePresence>
                  {previousRoundStatements
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((statement) => (
                      <StatementCard
                        key={statement.id}
                        statement={statement}
                        onVote={handleVote}
                        onFlag={() =>
                          console.log("Flag statement:", statement.id)
                        }
                        canVote={isVotingPhase}
                        currentUserId={currentUserId}
                      />
                    ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}

      {statements.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No statements yet. Be the first to share your take!</p>
        </div>
      )}
    </div>
  );
}
