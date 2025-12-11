import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  MessageCircle,
  Users,
  ArrowRight,
  Settings,
  XCircle,
  Hash,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import type {
  DebateRoom,
  Statement,
  VoteType,
} from "../utils/api";
import { SwipeableStatementStack } from "./SwipeableStatementStack";
import { InProgressResults } from "./results/InProgressResults";
import { ConcludedResults } from "./results/ConcludedResults";
import { NewStatementInput } from "./NewStatementInput";
import { ShareButton } from "./ShareButton";
import { DebateAnalysisView } from "./DebateAnalysisView";
import { useState, useEffect } from "react";
import { updateUrlForAnalysis } from "../utils/url";

interface RoomCardProps {
  room: DebateRoom;
  statements: Statement[];
  loadingStatements: boolean;
  isDeveloper: boolean;
  isActive: boolean;
  currentUserId?: string;
  currentSubHeard?: string;
  analysisRoomId?: string;
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
  onRefreshStatements?: () => Promise<void>;
  onDiscussStatement?: (
    statementText: string,
    subHeard?: string,
  ) => void;
}

export function RoomCard({
  room,
  statements,
  loadingStatements,
  isDeveloper,
  isActive,
  currentUserId,
  currentSubHeard,
  analysisRoomId,
  onJoin,
  onSetInactive,
  onSubmitStatement,
  onVoteOnStatement,
  onRefreshStatements,
  onDiscussStatement,
}: RoomCardProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    if (analysisRoomId === room.id) {
      setShowAnalysis(true);
    }
  }, [analysisRoomId, room.id]);

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
      return null;
    }

    try {
      const result = await onVoteOnStatement(
        statementId,
        voteType,
      );
      return result as Statement;
    } catch (error) {
      console.error("Error voting on statement:", error);
      return null;
    }
  };

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
            className="relative space-y-2"
          >
            {/* Status badges in top right */}
            <div className="absolute top-0 right-0 flex flex-col items-end gap-1.5">
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
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {isDeveloper && onSetInactive && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onSetInactive();
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Mark as Inactive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-0"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    handleOpenAnalysis();
                  }}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <ShareButton roomId={room.id} />
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{participantCount}</span>
              </div>
              {/* Compact Realtime Countdown */}
              {isRealtime &&
                room.endTime &&
                !hasRealtimeEnded && (
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const timeLeft = Math.max(
                        0,
                        room.endTime - Date.now(),
                      );
                      const days = Math.floor(
                        timeLeft / (24 * 60 * 60 * 1000),
                      );
                      const hours = Math.floor(
                        (timeLeft % (24 * 60 * 60 * 1000)) /
                          (60 * 60 * 1000),
                      );
                      const minutes = Math.floor(
                        (timeLeft % (60 * 60 * 1000)) / 60000,
                      );
                      const seconds = Math.floor(
                        (timeLeft % 60000) / 1000,
                      );

                      if (days > 0) {
                        return `${days}d left`;
                      } else if (hours > 0) {
                        return `${hours}h left`;
                      } else if (minutes > 0) {
                        return `${minutes}m left`;
                      } else {
                        return `${seconds}s left`;
                      }
                    })()}
                  </div>
                )}
            </div>

            {/* Title with space for badges */}
            <div className="flex items-start gap-2 pr-18">
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
              <h2 className="font-bold text-foreground">
                {room.topic}
              </h2>
            </div>

            {/* Features badges */}
            <div className="flex flex-wrap gap-2">
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
          </motion.div>

          {/* Statement Stack or Results */}
          {hasRealtimeEnded && statements.length > 0 ? (
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
              const hasVotedOnAll =
                currentUserId &&
                statements.every(
                  (statement) =>
                    statement.voters &&
                    statement.voters[currentUserId],
                );

              // If user has voted on all statements, show InProgressResults + input
              if (hasVotedOnAll) {
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
                      />
                    )}
                  </div>
                );
              }

              // Otherwise show the swipeable stack
              return (
                <SwipeableStatementStack
                  statements={statements}
                  onVote={handleVote}
                  currentUserId={currentUserId}
                  onSubmitStatement={handleSubmitStatement}
                />
              );
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
          onClose={handleCloseAnalysis}
        />
      )}
    </motion.div>
  );
}