// @ts-ignore
import { toast } from "sonner@2.0.3";

import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  MessageCircle, ArrowRight, Hash,
  BarChart3,
  Loader2
} from "lucide-react";
import { SwipeableStatementStack } from "./room/SwipeableStatementStack";
import { InProgressResults } from "./results/InProgressResults";
import { ConcludedResults } from "./results/ConcludedResults";
import { NewStatementInput } from "./NewStatementInput";
import { DebateAnalysisView } from "./analysis/DebateAnalysisView";
import { useState, useEffect } from "react";
import { updateUrlForAnalysis } from "../utils/url";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "../utils/constants/errors";
import { DebateRoom, Statement, VoteType, UserSession, AnalysisData } from "../types";
import { api } from "../utils/api";
import { MetricsCircle } from "./analysis/MetricsCircle";
import { RoomCardMenu } from "./room/RoomCardMenu";


interface RoomCardProps {
  room: DebateRoom;
  statements: Statement[];
  loadingStatements: boolean;
  isDeveloper: boolean;
  isActive: boolean;
  user: UserSession | null;
  currentSubHeard?: string;
  analysisRoomId?: string;
  markChanceCardSwiped: (userId: string, roomId: string) => Promise<void>;
  onJoin: () => void;
  onSetInactive?: () => Promise<boolean>;
  onSubmitStatement: (
    roomId: string,
    text: string,
  ) => Promise<any>;
  onVoteOnStatement: (
    statementId: string,
    voteType: VoteType,
  ) => Promise<any>;
  onRefreshStatements: () => Promise<void>;
  onDiscussStatement: (statementText: string, subHeard?: string) => void;
  onShowAccountSetupModal: (featureText: string) => void;
}

export function RoomCard({
  room,
  statements,
  loadingStatements,
  isDeveloper,
  isActive,
  user,
  currentSubHeard,
  analysisRoomId,
  markChanceCardSwiped,
  onJoin,
  onSetInactive,
  onSubmitStatement,
  onVoteOnStatement,
  onRefreshStatements,
  onDiscussStatement,
  onShowAccountSetupModal,
}: RoomCardProps) {
  const [chanceCardSwiped, setChanceCardSwiped] = useState(room.chanceCardSwiped || false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const currentUserId = user?.id;

  useEffect(() => {
    if (analysisRoomId === room.id) {
      setShowAnalysis(true);
    }
  }, [analysisRoomId, room.id]);

  useEffect(() => {
    setChanceCardSwiped(room.chanceCardSwiped || false);
  }, [room.chanceCardSwiped]);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (isActive && statements.length > 0) {
        try {
          const response = await api.getRoomAnalysis(room.id)
          if (response.data) {
            setAnalysis(response.data);
          }
        } catch (error) {
          console.error('Error fetching room metrics:', error);
        }
      }
    };

    fetchMetrics();
  }, [isActive, room.id, statements.length]);
  
  const handleOpenAnalysis = () => {
    setShowAnalysis(true);
    updateUrlForAnalysis(room.id);
  };

  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
    updateUrlForAnalysis(null);
  };

  const participantCount = room.participants?.length || 0;
  const isRantFirst = room.rantFirst;
  const isRealtime = room.mode === "realtime";

  // Check if realtime room has ended
  const hasRealtimeEnded =
    isRealtime && room.endTime && Date.now() >= room.endTime;

  // Determine room status
  const isActive_status =
    room.phase !== "lobby" && room.phase !== "results";
  const isWaiting = room.phase === "lobby";
  const isCompleted =
    room.phase === "results" || hasRealtimeEnded;

  // Handle voting
  const handleVote = async (
    statementId: string,
    voteType: "agree" | "disagree" | "pass" | "super_agree",
  ) => {
    if (!currentUserId) {
      console.error("No user ID available for voting");
    } else {
      try {
        await onVoteOnStatement(
          statementId,
          voteType,
        );
      } catch (error: any) {
        if (error.message === ANONYMOUS_ACTION_NOT_ALLOWED_ERROR) {
          onShowAccountSetupModal("voting in this debate");
          toast.error("⚠️ This discussion requires an account.");
        } else {
          toast.error(
            "⚠️ Your vote couldn't be saved. Please try again.",
            { duration: 3000 },
          );
          console.error("Error voting on statement:", error);
        }
        throw error;
      }
    }
  };

  const handleSwipeChanceCard = async () => {
    setChanceCardSwiped(true);
    if (currentUserId) {
      await markChanceCardSwiped(currentUserId, room.id);
    }
  }

  // Handle statement submission
  const handleSubmitStatement = async (text: string) => {
    if (!currentUserId) {
      console.error(
        "No user ID available for submitting statement",
      );
      throw new Error("User not logged in");
    }

    try {
      await onSubmitStatement(room.id, text);
      // Refresh statements to show the new one
      if (onRefreshStatements) {
        await onRefreshStatements();
      }
    } catch (error) {
      console.error("Error submitting statement:", error);
      throw error;
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: isActive ? 1 : 0.95, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl"
    >
      <Card className="relative bg-gradient-to-br from-purple-50 via-white to-blue-50 border-2 border-purple-200 shadow-2xl">
        <div className="p-6 space-y-4">
          {/* Compact header */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            {/* Title row with hamburger menu */}
            <div className="flex items-start gap-2">
              {room.imageUrl ? (
                <div
                  className="w-10 h-10 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border-2 border-purple-300 flex-shrink-0"
                  onClick={() => {
                    const fullScreenDiv =
                      document.createElement("div");
                    fullScreenDiv.className =
                      "fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4";
                    fullScreenDiv.onclick = () =>
                      fullScreenDiv.remove();

                    const img = document.createElement("img");
                    img.src = room.imageUrl!;
                    img.className =
                      "max-w-full max-h-full object-contain";

                    fullScreenDiv.appendChild(img);
                    document.body.appendChild(fullScreenDiv);
                  }}
                >
                  <img
                    src={room.imageUrl}
                    alt={room.topic}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <MessageCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-1" />
              )}
              <h2 className="font-bold text-foreground flex-1">
                {room.topic}
              </h2>
              <RoomCardMenu
                room={room}
                participantCount={participantCount}
                isRealtime={isRealtime}
                hasRealtimeEnded={hasRealtimeEnded}
                isDeveloper={isDeveloper}
                handleOpenAnalysis={handleOpenAnalysis}
                onSetInactive={onSetInactive}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                {room.subHeard && !currentSubHeard && (
                  <Badge
                    variant="outline"
                    className="bg-orange-100 text-orange-700 border-orange-300 text-xs"
                  >
                    <Hash className="w-3 h-3 mr-1" />
                    {room.subHeard
                      .split("-")
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1),
                      )
                      .join(" ")}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {analysis && (
                  <MetricsCircle
                    participation={analysis.participation}
                    consensus={analysis.consensusData.consensus}
                    spiciness={analysis.spicinessData.spiciness}
                    reach={analysis.reachData.reach}
                    size={25}
                  />
                )}
                
                {isCompleted ? (
                  <Badge className="bg-gray-600 text-white">
                    Completed
                  </Badge>
                ) : isActive_status ? (
                  <Badge className="bg-green-600 text-white animate-pulse">
                    🔴 Live
                  </Badge>
                ) : (
                  <Badge className="bg-blue-600 text-white">
                    Waiting
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>

          {/* Statement Stack or Results */}
          {isCompleted && statements.length > 0 ? (
            <ConcludedResults
              statements={statements}
              onDiscuss={
                onDiscussStatement
                  ? (text) =>
                      onDiscussStatement(text, room.subHeard)
                  : undefined
              }
            />
          ) : statements.length > 0 ? (
            (() => {
              // Check if user has voted on all statements
              const hasSwipedAll =
                currentUserId &&
                statements.every(
                  (statement) =>
                    statement.voters &&
                    statement.voters[currentUserId],
                ) && chanceCardSwiped;

              // If user has voted on all statements, show InProgressResults + input
              if (hasSwipedAll) {
                return (
                  <div className="space-y-4">
                    <InProgressResults
                      statements={statements}
                      currentUserId={currentUserId}
                      debateTitle={room.topic}
                      onChangeVote={handleVote}
                    />
                    {/* New Statement Input */}
                    {currentUserId && (
                      <NewStatementInput
                        onSubmitStatement={
                          handleSubmitStatement
                        }
                        allowAnonymous={!!room.allowAnonymous}
                        isAnonymous={!!user?.isAnonymous}
                        onShowAccountSetupModal={onShowAccountSetupModal}
                      />
                    )}
                  </div>
                );
              } else {
                // Otherwise show the swipeable stack
                return (
                  <SwipeableStatementStack
                    statements={statements}
                    currentUserId={currentUserId}
                    allowAnonymous={!!room.allowAnonymous}
                    isAnonymous={!!user?.isAnonymous}
                    onVote={handleVote}
                    chanceCardSwiped={chanceCardSwiped}
                    onSubmitStatement={handleSubmitStatement}
                    onShowAccountSetupModal={onShowAccountSetupModal}
                    onChanceCardSwiped={handleSwipeChanceCard}
                  />
                );
              }
            })()
          ) : (
            <div className="space-y-4">
              {loadingStatements ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                  <p className="text-muted-foreground mt-2">
                    Loading statements...
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      No statements yet in this debate
                    </p>
                  </div>
                  {currentUserId && !isCompleted && (
                    <NewStatementInput
                      onSubmitStatement={handleSubmitStatement}
                      allowAnonymous={!!room.allowAnonymous}
                      isAnonymous={!!user?.isAnonymous}
                      onShowAccountSetupModal={onShowAccountSetupModal}
                    />
                  )}
                  {!currentUserId && (
                    <Button
                      onClick={onJoin}
                      disabled={isCompleted}
                      size="lg"
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      {isCompleted
                        ? "Debate Ended"
                        : "Join to Add Statements"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {isCompleted && (
            <div className="mt-4">
              <Button
                onClick={handleOpenAnalysis}
                size="sm"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {showAnalysis
                  ? "Hide Analysis"
                  : "Show Analysis"}
                <BarChart3 className="w-5 h-5 ml-2" />
              </Button>
              {showAnalysis && (
                <DebateAnalysisView
                  roomId={room.id}
                  isDeveloper={isDeveloper}
                  onClose={handleCloseAnalysis}
                />
              )}
            </div>
          )}
        </div>
      </Card>

      {showAnalysis && (
        <DebateAnalysisView
          roomId={room.id}
          isDeveloper={isDeveloper}
          onClose={handleCloseAnalysis}
        />
      )}
    </motion.div>
  );
}