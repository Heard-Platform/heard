import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
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
import { SwipeableStatementStack } from "../components/SwipeableStatementStack";
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
import { DebateMetricsButton } from "../components/DebateMetricsButton";
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
  onAdvance: () => Promise<void>;
  onStartDebate: () => Promise<void>;
  onLeaveRoom: () => void;
  onNewDiscussion: (statement: Statement) => void;
  onScheduleFuture: () => void;
  onSkipToNextStep?: () => Promise<void>;
  onStartAutoPlay: () => void;
  onStopAutoPlay: () => void;
  onUpdateRoomDescription: (
    description: string,
  ) => Promise<boolean>;
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
  onAdvance,
  onStartDebate,
  onLeaveRoom,
  onNewDiscussion,
  onScheduleFuture,
  onSkipToNextStep,
  onStartAutoPlay,
  onStopAutoPlay,
  onUpdateRoomDescription,
}: GameScreenProps) {
  // For host-controlled mode, posting and voting happen simultaneously
  // For realtime mode, we still use subphases
  const isHostControlled = room.mode === "host-controlled";
  const isSubmissionPhase = isHostControlled
    ? room.phase !== "lobby" && room.phase !== "results"
    : room.subPhase === "posting";
  const isVotingPhase = isHostControlled
    ? room.phase !== "lobby" && room.phase !== "results"
    : room.subPhase === "voting";
  const isReviewPhase =
    !isHostControlled && room.subPhase === "review";

  // Track if we've loaded initial data to prevent UI flash
  const [initialDataLoaded, setInitialDataLoaded] =
    useState(false);
  const [isSubmittingRant, setIsSubmittingRant] =
    useState(false);

  // Rant logic
  const isRantFirstRoom = room.rantFirst;
  const userHasSubmittedRant = rants.some(
    (rant) => rant.author === user?.nickname,
  );
  const hasEnoughRantsForAnonymity = rants.length >= 3;

  // In rant-first rooms during posting phase, show rant submission if user hasn't submitted rant
  const shouldShowRantSubmission =
    isRantFirstRoom &&
    !userHasSubmittedRant &&
    isSubmissionPhase;

  // Show holding state if user has submitted rant but not enough total rants yet
  const shouldShowHoldingState =
    isRantFirstRoom &&
    userHasSubmittedRant &&
    !hasEnoughRantsForAnonymity &&
    isSubmissionPhase;

  // Mark data as loaded after first render with proper rant data
  useEffect(() => {
    if (isRantFirstRoom && isSubmissionPhase) {
      // For rant-first rooms, wait a moment to ensure rants are loaded
      const timer = setTimeout(() => {
        setInitialDataLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // For non-rant-first rooms, immediately mark as loaded
      setInitialDataLoaded(true);
    }
  }, [isRantFirstRoom, isSubmissionPhase]);

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
      setIsSubmittingRant(true);
      try {
        await onSubmitRant(text);
      } finally {
        setIsSubmittingRant(false);
      }
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
          onNextGame={onAdvance}
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
    <div className="min-h-screen bg-background px-4 pt-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-3">
          {/* Top row: Title, Dev button, Share, and Leave button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <motion.h1
                  className="text-3xl font-bold text-primary"
                  whileHover={{ scale: 1.05 }}
                >
                  HEARD
                </motion.h1>
                {user?.isDeveloper && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    DEV
                  </Badge>
                )}
              </div>
              {/* Dev Only: Skip to Next Step Button - Host Only */}
              {user?.isDeveloper &&
                onSkipToNextStep &&
                room.phase !== "results" &&
                room.phase !== "lobby" &&
                room.hostId === user?.id && (
                  <Button
                    onClick={onSkipToNextStep}
                    variant="outline"
                    size="sm"
                    className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 p-2"
                    title="DEV: Skip to Next Step"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                )}

              {/* Dev Only: Auto-Play Button - Host Only */}
              {user?.isDeveloper &&
                room.phase !== "results" &&
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
          mode={room.mode}
        />

        {/* Timer for realtime mode */}
        {timerActive && room.mode === "realtime" && (
          <DebateTimer
            duration={90} // 90 seconds for all rounds and sub-phases
            onTimeUp={onAdvance}
            isActive={timerActive}
            roundStartTime={room.roundStartTime}
          />
        )}

        {/* Host controls for host-controlled mode */}
        {room.mode === "host-controlled" &&
          room.phase !== "lobby" &&
          room.phase !== "results" &&
          room.hostId === user?.id &&
          (!isRantFirstRoom ||
            (userHasSubmittedRant &&
              hasEnoughRantsForAnonymity)) && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium text-blue-900">
                    Host Controls
                  </p>
                  <p className="text-sm text-blue-700">
                    Players can post and vote simultaneously
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button
                    onClick={onAdvance}
                    className="bg-blue-600 hover:bg-blue-700 shrink-0"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    {room.phase === "round3"
                      ? "End Debate"
                      : room.phase === "round2"
                        ? "Start Round 3"
                        : "Start Round 2"}
                  </Button>
                  <p className="text-xs text-blue-600 leading-relaxed text-center max-w-xs">
                    {room.phase === "round3"
                      ? "Show final results to all players."
                      : "This will freeze posts from this round so they can't be voted on anymore."}
                  </p>
                </div>
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
                  advance to next round
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
                        placeholder="Share your unfiltered thoughts on this topic. We'll use your rant to create debate points!"
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
                          {statements.length > 0 && (
                            <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                              {statements.length} debate
                              statements created from rants so
                              far
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
                                Starting debate...
                              </>
                            ) : (
                              <>Start Debate! 🔥</>
                            )}
                          </Button>
                          {room.participants.length < 2 &&
                            !startingDebate && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Need at least 2 players to start
                                the debate
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
                {/* In rant-first rooms, show rant submission if user hasn't submitted, otherwise show statement submission */}
                <div className="flex justify-center mb-6">
                  <div className="w-full max-w-2xl">
                    {!initialDataLoaded ? (
                      <Card className="p-6">
                        <div className="flex items-center justify-center gap-3">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                          />
                          <p className="text-muted-foreground">
                            Loading...
                          </p>
                        </div>
                      </Card>
                    ) : shouldShowRantSubmission ? (
                      <RantSubmission
                        onSubmit={handleRantSubmit}
                        isSubmitting={isSubmittingRant}
                        placeholder="Share your unfiltered thoughts on this topic and we'll create debate points from your rant!"
                      />
                    ) : shouldShowHoldingState ? (
                      <Card className="p-6 bg-purple-50 border-purple-200">
                        <div className="text-center space-y-4">
                          <div className="flex justify-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-purple-600" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-purple-900">
                              Rant Submitted! 🎉
                            </h3>
                            <p className="text-sm text-purple-700">
                              We're waiting for a few more
                              players to submit rants before
                              showing statements to help protect
                              anonymity.
                            </p>
                            <div className="text-xs text-purple-600 bg-purple-100 p-3 rounded">
                              {rants.length} / 3 rants submitted
                              so far
                            </div>
                          </div>
                          <div className="flex justify-center items-center space-x-1 pt-2">
                            <motion.div
                              animate={{ y: [0, -8, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: 0,
                              }}
                              className="w-2 h-2 bg-purple-600 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -8, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: 0.2,
                              }}
                              className="w-2 h-2 bg-purple-600 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -8, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: 0.4,
                              }}
                              className="w-2 h-2 bg-purple-600 rounded-full"
                            />
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <StatementSubmission
                        onSubmit={handleStatementSubmit}
                        currentPhase={room.phase}
                        isActive={isSubmissionPhase}
                        placeholder={
                          isRantFirstRoom
                            ? "Add more specific points to the discussion 🎯"
                            : "What's your take? Spicy takes welcome! 🌶️"
                        }
                      />
                    )}
                  </div>
                </div>

                {/* Statements below submission box - hidden when awaiting rant submission or in holding state */}
                {!shouldShowRantSubmission &&
                  !shouldShowHoldingState && (
                    <div className="space-y-4">
                      <h3 className="text-center flex items-center justify-center gap-2">
                        Statements ({statements.length})
                      </h3>

                      <div className="flex justify-center">
                        <div className="w-full max-w-2xl space-y-3 max-h-[500px] min-h-[200px] overflow-y-auto">
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
                                canVote={
                                  room.mode ===
                                  "host-controlled"
                                }
                                currentUserId={user?.id}
                              />
                            ))}
                          </AnimatePresence>

                          {statements.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>
                                No statements yet. Be the first
                                to share your take!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
                    {/* Current Round Statements - Swipeable Stack */}
                    {currentRoundStatements.length > 0 && (
                      <div className="space-y-4">
                        <SwipeableStatementStack
                          statements={currentRoundStatements}
                          onVote={handleVote}
                          currentUserId={user?.id}
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

      {/* Floating Debate Metrics Button - Dev Only */}
      {user?.isDeveloper && (
        <DebateMetricsButton
          participation={0}
          spiciness={0}
          agreement={0}
          minorityBuyIn={0}
        />
      )}
    </div>
  );
}