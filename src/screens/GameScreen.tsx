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
  onSubmitStatement: (
    text: string,
    type?: "bridge" | "crux" | "plurality",
  ) => Promise<void>;
  onVote: (
    id: string,
    voteType: "agree" | "disagree" | "pass",
  ) => Promise<void>;
  onNextPhase: () => Promise<void>;
  onStartDebate: () => Promise<void>;
  onLeaveRoom: () => void;
  onNewDiscussion: (statement: Statement) => void;
  onScheduleFuture: () => void;
  onSkipPhase?: () => Promise<void>;
}

export function GameScreen({
  user,
  room,
  statements,
  timerActive,
  lastAchievement,
  onSubmitStatement,
  onVote,
  onNextPhase,
  onStartDebate,
  onLeaveRoom,
  onNewDiscussion,
  onScheduleFuture,
  onSkipPhase,
}: GameScreenProps) {
  const isSubmissionPhase = room.subPhase === "posting";
  const isVotingPhase = room.subPhase === "voting";
  const isReviewPhase = room.subPhase === "review";

  const handleStatementSubmit = useCallback(
    async (
      text: string,
      type?: "bridge" | "crux" | "plurality",
    ) => {
      await onSubmitStatement(text, type);
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

  if (room.phase === "results") {
    return (
      <>
        <FinalResults
          statements={statements}
          score={user?.score || 0}
          roundNumber={room.roundNumber}
          onNewDiscussion={handleNewDiscussion}
          onScheduleFuture={handleScheduleFuture}
          onNextRound={onNextPhase}
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
              {/* Dev Only: Skip Phase Button */}
              {onSkipPhase &&
                room.phase !== "results" &&
                room.phase !== "lobby" && (
                  <Button
                    onClick={onSkipPhase}
                    variant="outline"
                    size="sm"
                    className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 p-2"
                    title="DEV: Next Phase"
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
                bridgePoints={user.bridgePoints}
                cruxPoints={user.cruxPoints}
                pluralityPoints={user.pluralityPoints}
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
          currentRound={room.phase}
          currentSubPhase={room.subPhase}
          roundNumber={room.roundNumber}
        />

        {/* Timer */}
        {timerActive && (
          <DebateTimer
            duration={90} // 90 seconds for all phases and sub-phases
            onTimeUp={onNextPhase}
            isActive={timerActive}
            phaseStartTime={room.phaseStartTime}
          />
        )}

        {/* Review Phase - Full Width Results Only */}
        {isReviewPhase ? (
          <div className="space-y-4">
            {statements.length > 0 && (
              <RealTimeResults
                statements={statements}
                currentPhase={room.phase}
                currentSubPhase={room.subPhase}
              />
            )}
          </div>
        ) : (
          /* All Other Phases - Normal Grid Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Submission Area */}
            <div className="space-y-4">
              {room.phase === "lobby" && (
                <Card className="p-6 text-center">
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
              )}

              {isSubmissionPhase && (
                <StatementSubmission
                  onSubmit={handleStatementSubmit}
                  currentRound={room.phase}
                  isActive={timerActive}
                  placeholder={
                    room.phase === "initial"
                      ? "What's your take? Spicy takes welcome! 🌶️"
                      : `Submit a ${room.phase}...`
                  }
                />
              )}
            </div>

            {/* Statements Feed */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="flex items-center gap-2">
                Statements ({statements.length})
                {isVotingPhase && (
                  <span className="text-sm text-muted-foreground">
                    - Vote now!
                  </span>
                )}
              </h3>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
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

      {lastAchievement && (
        <AchievementNotification
          achievement={lastAchievement}
          onClose={() => {}}
        />
      )}
    </div>
  );
}