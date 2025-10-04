import { useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DebateTimer } from "../components/DebateTimer";
import { ScoreBoard } from "../components/ScoreBoard";
import { StatementCard } from "../components/StatementCard";
import { StatementSubmission } from "../components/StatementSubmission";
import { RantSubmission } from "../components/RantSubmission";
import { DescriptionDisplay } from "../components/DescriptionDisplay";
import { AchievementNotification } from "../components/AchievementNotification";
import { RoundIndicator } from "../components/RoundIndicator";
import { RealTimeResults } from "../components/RealTimeResults";
import { FinalResults } from "../components/FinalResults";
import {
  Users,
  X,
  Zap,
  SkipForward,
  Play,
  Square,
} from "lucide-react";
import { ShareButton } from "../components/ShareButton";
import { InviteButton } from "../components/InviteButton";
import type {
  UserSession,
  DebateRoom,
  Statement,
  Achievement,
  Rant,
} from "../types";

interface GameScreenProps {
  user: UserSession;
  room: DebateRoom;
  statements: Statement[];
  rants: Rant[];
  timerActive: boolean;
  lastAchievement: Achievement | null;
  autoPlayActive: boolean;
  startingDebate: boolean;
  onSubmitStatement: (text: string) => Promise<void>;
  onSubmitRant: (text: string) => Promise<void>;
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
  onStartAutoPlay: () => void;
  onStopAutoPlay: () => void;
  onUpdateRoomDescription: (description: string) => Promise<boolean>;
}

export function GameScreen({
  user,
  room,
  statements,
  rants,
  timerActive,
  lastAchievement,
  autoPlayActive,
  startingDebate,
  onSubmitStatement,
  onSubmitRant,
  onVote,
  onNextRound,
  onStartDebate,
  onLeaveRoom,
  onNewDiscussion,
  onScheduleFuture,
  onSkipRound,
  onStartAutoPlay,
  onStopAutoPlay,
  onUpdateRoomDescription,
}: GameScreenProps) {
  const isSubmissionPhase = room.subPhase === "posting";
  const isVotingPhase = room.subPhase === "voting";
  const isReviewPhase = room.subPhase === "review";

  // Rant logic
  const isRantFirstRoom = room.rantFirst;
  const userHasSubmittedRant = rants.some(
    (rant) => rant.author === user?.nickname,
  );
  const shouldShowRantSubmission =
    isRantFirstRoom &&
    !userHasSubmittedRant &&
    (room.phase === "lobby" || room.phase === "round1");

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

  const handleRantSubmit = useCallback(
    async (text: string) => {
      await onSubmitRant(text);
    },
    [onSubmitRant],
  );

  if (room.phase === "results") {
    return (
      <>
        <FinalResults
          statements={statements}
          score={user?.score || 0}
          gameNumber={room.gameNumber}
          onNewDiscussion={handleNewDiscussion}
          onScheduleFuture={handleScheduleFuture}
          onNextGame={onNextRound}
          onBackToLobby={onLeaveRoom}
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
          {/* Top row: Title, Dev button, Share, and Leave button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <motion.h1
                className="text-3xl font-bold text-primary"
                whileHover={{ scale: 1.05 }}
              >
                HEARD
              </motion.h1>
              {/* Dev Only: Skip Round Button - Host Only */}
              {onSkipRound &&
                room.phase !== "results" &&
                room.phase !== "lobby" &&
                room.hostId === user?.id && (
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

              {/* Dev Only: Auto-Play Button - Host Only */}
              {room.phase !== "results" &&
                room.phase !== "lobby" &&
                room.hostId === user?.id && (
                  <Button
                    onClick={
                      autoPlayActive
                        ? onStopAutoPlay
                        : onStartAutoPlay
                    }
                    variant="outline"
                    size="sm"
                    className={`p-2 ${
                      autoPlayActive
                        ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        : room.subPhase === "review"
                          ? "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                          : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    }`}
                    title={`DEV: ${autoPlayActive ? "Stop" : "Start"} Auto-Play ${
                      room.subPhase === "posting"
                        ? "(Posts)"
                        : room.subPhase === "voting"
                          ? "(Votes)"
                          : room.subPhase === "review"
                            ? "(Paused)"
                            : ""
                    }`}
                    disabled={
                      room.subPhase === "review" &&
                      !autoPlayActive
                    }
                  >
                    {autoPlayActive ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
              <ShareButton roomId={room.id} />
              <InviteButton
                roomId={room.id}
                roomTopic={room.topic}
              />
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

        {/* Room Description */}
        <DescriptionDisplay
          description={room.description}
          isHost={room.hostId === user.id}
          onUpdate={onUpdateRoomDescription}
        />

        {/* Round Indicator */}
        <RoundIndicator
          currentRound={room.phase}
          currentSubPhase={room.subPhase}
          gameNumber={room.gameNumber}
        />

        {/* Timer for realtime mode */}
        {timerActive && room.mode === "realtime" && (
          <DebateTimer
            duration={90} // 90 seconds for all rounds and sub-phases
            onTimeUp={onNextRound}
            isActive={timerActive}
            roundStartTime={room.roundStartTime}
          />
        )}

        {/* Host controls for host-controlled mode */}
        {room.mode === "host-controlled" &&
          room.phase !== "lobby" &&
          room.phase !== "results" &&
          room.hostId === user?.id && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-blue-900">
                    Host Controls
                  </p>
                  <p className="text-sm text-blue-700">
                    {room.subPhase === "posting" &&
                      "Players are submitting statements"}
                    {room.subPhase === "voting" &&
                      "Players are voting on statements"}
                    {room.subPhase === "review" &&
                      "Players are reviewing results"}
                  </p>
                </div>
                <Button
                  onClick={onNextRound}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Next Phase
                </Button>
              </div>
            </Card>
          )}

        {/* Mode indicator for non-hosts in host-controlled mode */}
        {room.mode === "host-controlled" &&
          room.phase !== "lobby" &&
          room.phase !== "results" &&
          room.hostId !== user?.id && (
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="text-center">
                <p className="text-sm text-purple-700">
                  Host-controlled debate • Waiting for host to
                  advance to next phase
                </p>
              </div>
            </Card>
          )}

        {/* Review Phase - Full Width Results Only */}
        {isReviewPhase ? (
          <div className="space-y-4">
            <RealTimeResults
              statements={statements}
              currentRound={room.phase}
              currentSubPhase={room.subPhase}
            />
          </div>
        ) : (
          /* Content Layout - Centered based on phase */
          <div className="space-y-6">
            {/* Lobby Round */}
            {room.phase === "lobby" && (
              <>
                {/* For rant-first rooms: ONLY show rant submission if user hasn't submitted yet */}
                {shouldShowRantSubmission ? (
                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                      <RantSubmission
                        onSubmit={handleRantSubmit}
                        placeholder="Share your unfiltered thoughts on this topic. We'll use everyone's rants to create structured debate points!"
                      />
                    </div>
                  </div>
                ) : (
                  /* Normal lobby UI - shown for non-rant-first rooms OR rant-first rooms where user has submitted */
                  <div className="flex justify-center">
                    <Card className="p-6 text-center max-w-md">
                      <h3 className="mb-2">
                        {isRantFirstRoom
                          ? "Rant-First Debate Room"
                          : "Debate Room"}
                      </h3>

                      {isRantFirstRoom ? (
                        <div className="space-y-3">
                          <p className="text-muted-foreground">
                            Rant submitted! {rants.length}/
                            {room.participants.length} players
                            have shared their thoughts.
                          </p>
                          {rants.length > 0 && (
                            <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                              All rants will be compiled into
                              debate statements when the host
                              starts the debate
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground mb-4">
                          {room.participants.length < 2
                            ? "Need at least 2 players to start..."
                            : "Ready to debate!"}
                        </p>
                      )}

                      {/* Show different UI based on whether user is host */}
                      {room.hostId === user?.id ? (
                        <div className="mt-4">
                          <Button
                            onClick={onStartDebate}
                            disabled={
                              room.participants.length < 2 ||
                              startingDebate
                            }
                          >
                            {startingDebate ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                />
                                {isRantFirstRoom
                                  ? "Compiling rants..."
                                  : "Starting debate..."}
                              </>
                            ) : (
                              <>
                                {isRantFirstRoom
                                  ? "Compile Rants & Start Debate! 🧠"
                                  : "Start Debate! 🔥"}
                              </>
                            )}
                          </Button>
                          {room.participants.length < 2 &&
                            !startingDebate && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Need at least 2 players to start
                                the debate
                              </p>
                            )}
                          {startingDebate &&
                            isRantFirstRoom && (
                              <p className="text-xs text-purple-600 mt-2">
                                We're creating statements and
                                predicting votes based on what
                                everyone shared...
                              </p>
                            )}
                        </div>
                      ) : (
                        <div className="space-y-3 mt-4">
                          <div className="px-4 py-2 bg-muted rounded-md">
                            <p className="text-sm text-muted-foreground">
                              Waiting for host to start...
                            </p>
                          </div>
                          <div className="flex justify-center items-center space-x-1">
                            <motion.div
                              animate={{ y: [0, -8, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: 0,
                              }}
                              className="w-2 h-2 bg-primary rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -8, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: 0.2,
                              }}
                              className="w-2 h-2 bg-primary rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -8, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: 0.4,
                              }}
                              className="w-2 h-2 bg-primary rounded-full"
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </>
            )}

            {/* Posting Round - Centered submission box with statements below */}
            {isSubmissionPhase && (
              <>
                {/* Rant submission for late-joining users in rant-first rooms */}
                {shouldShowRantSubmission && (
                  <div className="flex justify-center mb-6">
                    <div className="w-full max-w-2xl">
                      <RantSubmission
                        onSubmit={handleRantSubmit}
                        placeholder="Haven't shared your rant yet? Do it now before making specific statements!"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <StatementSubmission
                      onSubmit={handleStatementSubmit}
                      currentPhase={room.phase}
                      isActive={isSubmissionPhase}
                      placeholder={
                        isRantFirstRoom
                          ? "Make specific points based on the compiled debate statements 🎯"
                          : "What's your take? Spicy takes welcome! 🌶️"
                      }
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
                            No statements yet. Be the first to
                            share your take!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Voting Round - Separated by current vs previous rounds */}
            {isVotingPhase &&
              (() => {
                // Convert current phase to round number
                const getCurrentRound = (
                  phase: string,
                ): number => {
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

                const currentRound = getCurrentRound(
                  room.phase,
                );
                const currentRoundStatements =
                  statements.filter(
                    (s) => s.round === currentRound,
                  );
                const previousRoundStatements =
                  statements.filter(
                    (s) => s.round !== currentRound,
                  );

                return (
                  <div className="space-y-6">
                    {/* Current Round Statements - Priority voting */}
                    {currentRoundStatements.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-center flex items-center justify-center gap-2">
                          This Round's Posts (
                          {currentRoundStatements.length})
                          <span className="text-sm text-muted-foreground">
                            - Vote now!
                          </span>
                        </h3>

                        <div className="flex justify-center">
                          <div className="w-full max-w-2xl space-y-3 max-h-[400px] overflow-y-auto">
                            <AnimatePresence>
                              {currentRoundStatements.map(
                                (statement) => (
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
                                ),
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
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
                                Previous Rounds (
                                {previousRoundStatements.length}
                                )
                              </h4>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                              <AnimatePresence>
                                {previousRoundStatements
                                  .sort(
                                    (a, b) =>
                                      b.timestamp - a.timestamp,
                                  )
                                  .map((statement) => (
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
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {statements.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>
                          No statements yet. Be the first to
                          share your take!
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
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