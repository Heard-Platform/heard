import { useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DebateTimer } from "../components/DebateTimer";
import { ScoreBoard } from "../components/ScoreBoard";
import { StatementCard } from "../components/StatementCard";
import { StatementSubmission } from "../components/StatementSubmission";
import { AchievementNotification } from "../components/AchievementNotification";
import { RoundIndicator } from "../components/RoundIndicator";
import { RealTimeResults } from "../components/RealTimeResults";
import { FinalResults } from "../components/FinalResults";
import { Users, X, Zap, SkipForward } from "lucide-react";
import type {
  UserSession,
  DebateRoom,
  Statement,
  Achievement,
} from "../types";

interface GameScreenProps {
  user: UserSession;
  room: DebateRoom;
  statements: Statement[];
  timerActive: boolean;
  lastAchievement: Achievement | null;
  onSubmitStatement: (text: string) => Promise<void>;
  onVote: (
    id: string,
    voteType: "agree" | "disagree" | "pass",
  ) => Promise<void>;
  onNextRound: () => Promise<void>;
  onStartDebate: () => Promise<void>;
  onLeaveRoom: () => void;
  onNewDiscussion: (statement: Statement) => void;
  onScheduleFuture: () => void;
  onSkipRound?: () => Promise<void>;
}

export function GameScreen({
  user,
  room,
  statements,
  timerActive,
  lastAchievement,
  onSubmitStatement,
  onVote,
  onNextRound,
  onStartDebate,
  onLeaveRoom,
  onNewDiscussion,
  onScheduleFuture,
  onSkipRound,
}: GameScreenProps) {
  const isSubmissionPhase = room.subPhase === "posting";
  const isVotingPhase = room.subPhase === "voting";
  const isReviewPhase = room.subPhase === "review";

  const handleStatementSubmit = useCallback(
    async (text: string) => {
      await onSubmitStatement(text);
    },
    [onSubmitStatement],
  );

  const handleVote = useCallback(
    async (
      id: string,
      voteType: "agree" | "disagree" | "pass",
    ) => {
      await onVote(id, voteType);
    },
    [onVote],
  );

  const handleNewDiscussion = useCallback(
    (statement: Statement) => {
      onNewDiscussion(statement);
    },
    [onNewDiscussion],
  );

  const handleScheduleFuture = useCallback(() => {
    onScheduleFuture();
  }, [onScheduleFuture]);

  if (room.round === "results") {
    return (
      <>
        <FinalResults
          statements={statements}
          score={user?.score || 0}
          gameNumber={room.gameNumber}
          onNewDiscussion={handleNewDiscussion}
          onScheduleFuture={handleScheduleFuture}
          onNextGame={onNextRound}
        />
        {lastAchievement && (
          <AchievementNotification
            achievement={lastAchievement}
            onClose={() => {}}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-3">
          {/* Top row: Title, Dev button, and Leave button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <motion.h1
                className="text-3xl font-bold text-primary"
                whileHover={{ scale: 1.05 }}
              >
                HEARD
              </motion.h1>
              {/* Dev Only: Skip Round Button */}
              {onSkipRound &&
                room.round !== "results" &&
                room.round !== "lobby" && (
                  <Button
                    onClick={onSkipRound}
                    variant="outline"
                    size="sm"
                    className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 p-2"
                    title="DEV: Next Round"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                )}
            </div>
            <Button
              onClick={onLeaveRoom}
              variant="outline"
              size="sm"
              className="p-2"
              title="Leave Room"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* ScoreBoard row */}
          {user && (
            <div className="flex justify-center">
              <ScoreBoard
                score={user.score}
                streak={user.streak}
              />
            </div>
          )}
        </div>

        {/* Room Info */}
        <Card className="p-4 bg-accent">
          <div>
            <h3 className="text-center">
              <span className="text-muted-foreground">
                Debate Topic:
              </span>
              <br />
              <span className="font-medium text-lg">
                {room.topic}
              </span>
            </h3>
            <div className="flex justify-center items-center gap-1 text-sm text-muted-foreground mt-2">
              <Users className="w-4 h-4" />
              <span>{room.participants.length} players</span>
            </div>
          </div>
        </Card>

        {/* Round Indicator */}
        <RoundIndicator
          currentRound={room.round}
          currentSubPhase={room.subPhase}
          gameNumber={room.gameNumber}
        />

        {/* Timer */}
        {timerActive && (
          <DebateTimer
            duration={90} // 90 seconds for all rounds and sub-phases
            onTimeUp={onNextRound}
            isActive={timerActive}
            roundStartTime={room.roundStartTime}
          />
        )}

        {/* Review Phase - Full Width Results Only */}
        {isReviewPhase ? (
          <div className="space-y-4">
            {statements.length > 0 && (
              <RealTimeResults
                statements={statements}
                currentRound={room.round}
                currentSubPhase={room.subPhase}
              />
            )}
          </div>
        ) : (
          /* Content Layout - Centered based on phase */
          <div className="space-y-6">
            {/* Lobby Round */}
            {room.round === "lobby" && (
              <div className="flex justify-center">
                <Card className="p-6 text-center max-w-md">
                  <h3 className="mb-2">Debate Room</h3>
                  <p className="text-muted-foreground mb-4">
                    {room.participants.length < 2
                      ? "Need at least 2 players to start..."
                      : "Ready to debate!"}
                  </p>
                  <Button
                    onClick={onStartDebate}
                    disabled={room.participants.length < 2}
                  >
                    Start Debate! 🔥
                  </Button>
                </Card>
              </div>
            )}

            {/* Posting Round - Centered submission box with statements below */}
            {isSubmissionPhase && (
              <>
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <StatementSubmission
                      onSubmit={handleStatementSubmit}
                      currentRound={room.round}
                      isActive={timerActive}
                      placeholder="What's your take? Spicy takes welcome! 🌶️"
                    />
                  </div>
                </div>
                
                {/* Statements below submission box */}
                <div className="space-y-4">
                  <h3 className="text-center flex items-center justify-center gap-2">
                    Statements ({statements.length})
                  </h3>

                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl space-y-3 max-h-[500px] overflow-y-auto">
                      <AnimatePresence>
                        {statements.map((statement) => (
                          <StatementCard
                            key={statement.id}
                            statement={statement}
                            onVote={handleVote}
                            onFlag={() =>
                              console.log(
                                "Flag statement:",
                                statement.id,
                              )
                            }
                            canVote={false}
                            currentUserId={user?.id}
                          />
                        ))}
                      </AnimatePresence>

                      {statements.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>
                            No statements yet. Be the first to share
                            your take!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Voting Round - Centered statements like results */}
            {isVotingPhase && (
              <div className="space-y-4">
                <h3 className="text-center flex items-center justify-center gap-2">
                  Statements ({statements.length})
                  <span className="text-sm text-muted-foreground">
                    - Vote now!
                  </span>
                </h3>

                <div className="flex justify-center">
                  <div className="w-full max-w-2xl space-y-3 max-h-[600px] overflow-y-auto">
                    <AnimatePresence>
                      {statements.map((statement) => (
                        <StatementCard
                          key={statement.id}
                          statement={statement}
                          onVote={handleVote}
                          onFlag={() =>
                            console.log(
                              "Flag statement:",
                              statement.id,
                            )
                          }
                          canVote={isVotingPhase}
                          currentUserId={user?.id}
                        />
                      ))}
                    </AnimatePresence>

                    {statements.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>
                          No statements yet. Be the first to share
                          your take!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {lastAchievement && (
        <AchievementNotification
          achievement={lastAchievement}
          onClose={() => {}}
        />
      )}
    </div>
  );
}