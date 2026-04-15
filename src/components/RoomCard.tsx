// @ts-ignore
import { toast } from "sonner@2.0.3";

import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Globe, UserCircle, ArrowRight,
  BarChart3,
  Loader2
} from "lucide-react";
import { SwipeableStatementStack } from "./room/SwipeableStatementStack";
import { InProgressResults } from "./results/InProgressResults";
import { ConcludedResults } from "./results/ConcludedResults";
import { AddResponseModal } from "./room/AddResponseModal";
import { DebateAnalysisView } from "./analysis/DebateAnalysisView";
import { useState, useEffect } from "react";
import { updateUrlForAnalysis } from "../utils/url";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "../utils/constants/errors";
import { DebateRoom, Statement, VoteType, UserSession } from "../types";
import { RoomCardMenu } from "./room/RoomCardMenu";
import { TimeLeftBadge } from "./room/TimeLeftBadge";
import { useDebateSession } from "../hooks/useDebateSession";
import { timeAgoShort } from "../utils/time";
import { AddResponseButton } from "./widgets/AddResponseButton";
import { formatSubHeardDisplay } from "../utils/subheard";

interface RoomCardProps {
  room: DebateRoom;
  statements: Statement[];
  loadingStatements: boolean;
  isDeveloper: boolean;
  isActive: boolean;
  user: UserSession;
  currentSubHeard?: string;
  analysisRoomId?: string;
  onJoin: () => void;
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
  onJoin,
  onSubmitStatement,
  onVoteOnStatement,
  onRefreshStatements,
  onDiscussStatement,
  onShowAccountSetupModal,
}: RoomCardProps) {
  const [certifyCardDismissed, setCertifyCardDismissed] = useState(false);
  const [chanceCardSwiped, setChanceCardSwiped] = useState(room.chanceCardSwiped || false);
  const [youtubeCardSwiped, setYoutubeCardSwiped] = useState(room.youtubeCardSwiped || false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showAddResponseModal, setShowAddResponseModal] = useState(false);
  const { markChanceCardSwiped, markYouTubeCardSwiped } = useDebateSession();

  useEffect(() => {
    if (analysisRoomId === room.id) {
      setShowAnalysis(true);
    }
  }, [analysisRoomId, room.id]);

  useEffect(() => {
    setChanceCardSwiped(room.chanceCardSwiped || false);
  }, [room.chanceCardSwiped]);

  useEffect(() => {
    setYoutubeCardSwiped(room.youtubeCardSwiped || false);
  }, [room.youtubeCardSwiped]);

  const handleOpenAnalysis = () => {
    setShowAnalysis(true);
    updateUrlForAnalysis(room.id);
  };

  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
    updateUrlForAnalysis(null);
  };

  const participantCount = (() => {
    const engaged = new Set<string>();
    engaged.add(room.hostId);
    for (const statement of statements) {
      engaged.add(statement.author);
      if (statement.voters) {
        for (const userId of Object.keys(statement.voters)) {
          engaged.add(userId);
        }
      }
    }
    return engaged.size;
  })();
  
  const isRantFirst = room.rantFirst;
  const isRealtime = room.mode === "realtime";

  const hasRealtimeEnded =
    isRealtime && room.endTime && Date.now() >= room.endTime;

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
    try {
      await onVoteOnStatement(
        statementId,
        voteType,
      );
    } catch (error: any) {
      if (error.message === ANONYMOUS_ACTION_NOT_ALLOWED_ERROR) {
        onShowAccountSetupModal("voting in this conversation");
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
  };

  const handleSwipeChanceCard = async () => {
    setChanceCardSwiped(true);
    await markChanceCardSwiped(room.id);
  }

  const handleSwipeYouTubeCard = async () => {
    setYoutubeCardSwiped(true);
    await markYouTubeCardSwiped(room.id);
  }

  const handleDemographicsAnswered = (questionId: string) => {
    setAnsweredQuestionIds((prev) => new Set(prev).add(questionId));
  }

  // Handle statement submission
  const handleSubmitStatement = async (text: string) => {
    try {
      await onSubmitStatement(room.id, text);
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
      <Card className="heard-card-bg">
        <div className="p-6 space-y-4">
          {/* Compact header */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            {/* Top row: community + time | menu */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm min-w-0">
                {currentSubHeard ? (
                  <>
                    <UserCircle className="w-3.5 h-3.5 prefix-icon shrink-0" />
                    <span className="font-medium text-foreground truncate">Anonymous</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 prefix-icon shrink-0" />
                    {room.subHeard && (
                      <span className="font-medium text-foreground truncate">
                        {formatSubHeardDisplay(room.subHeard)}
                      </span>
                    )}
                  </>
                )}
                <span className="text-muted-foreground shrink-0">
                  {timeAgoShort(room.createdAt)} ago
                </span>
              </div>

              <div className="shrink-0">
                <RoomCardMenu
                  room={room}
                  participantCount={participantCount}
                  isRealtime={isRealtime}
                  hasRealtimeEnded={hasRealtimeEnded}
                  isDeveloper={isDeveloper}
                  handleOpenAnalysis={handleOpenAnalysis}
                />
              </div>
            </div>

            {/* Title row */}
            <div className="flex items-start gap-2">
              {room.imageUrl && (
                <div
                  className="w-10 h-10 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border-2 border-purple-300 shrink-0"
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
              )}
              <h2 className="font-bold text-foreground flex-1">
                {room.topic}
              </h2>
            </div>

          </motion.div>

          {/* Statement Stack or Results */}
          {isCompleted && statements.length > 0 ? (
            <ConcludedResults
              statements={statements}
              onDiscuss={
                onDiscussStatement
                  ? (text) => onDiscussStatement(text, room.subHeard)
                  : undefined
              }
            />
          ) : statements.length > 0 ? (
            (() => {
              // Check if user has voted on all statements
              const hasSwipedAll =
                statements.every(
                  (statement) =>
                    statement.voters && statement.voters[user.id],
                ) &&
                (!user.isAnonymous || certifyCardDismissed) &&
                chanceCardSwiped &&
                (!room.youtubeUrl || youtubeCardSwiped) &&
                (!room.demographicQuestions.length ||
                  room.demographicQuestions.every((q) =>
                    answeredQuestionIds.has(q.id),
                  ));

              // If user has voted on all statements, show InProgressResults + input
              if (hasSwipedAll) {
                return (
                  <InProgressResults
                    statements={statements}
                    debateTitle={room.topic}
                    isAnonymous={!!user?.isAnonymous}
                    onFollowDiscussion={() =>
                      onShowAccountSetupModal(
                        "certify your votes",
                      )
                    }
                    onChangeVote={handleVote}
                  />
                );
              } else {
                // Otherwise show the swipeable stack
                return (
                  <SwipeableStatementStack
                    room={room}
                    statements={statements}
                    currentUserId={user.id}
                    allowAnonymous={!!room.allowAnonymous}
                    isAnonymous={!!user?.isAnonymous}
                    chanceCardSwiped={chanceCardSwiped}
                    youtubeUrl={room.youtubeUrl}
                    youtubeCardSwiped={youtubeCardSwiped}
                    demographicQuestions={room.demographicQuestions}
                    answeredQuestionIds={answeredQuestionIds}
                    onVote={handleVote}
                    onSubmitStatement={handleSubmitStatement}
                    onShowAccountSetupModal={onShowAccountSetupModal}
                    onCertifyDone={() => setCertifyCardDismissed(true)}
                    onChanceCardSwiped={handleSwipeChanceCard}
                    onYouTubeCardSwiped={handleSwipeYouTubeCard}
                    onDemographicsAnswered={handleDemographicsAnswered}
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
                      No responses yet to this post
                    </p>
                  </div>
                  <Button
                    onClick={onJoin}
                    disabled={isCompleted}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {isCompleted
                      ? "Conversation Ended"
                      : "Join to Add Responses"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {!isCompleted && (
              <AddResponseButton onClick={() => setShowAddResponseModal(true)} />
            )}
            {isCompleted && (
              <Button
                onClick={handleOpenAnalysis}
                variant="secondary"
                className="heard-pill"
              >
                {showAnalysis ? "Hide Analysis" : "Show Analysis"}
                <BarChart3 className="w-4 h-4" />
              </Button>
            )}
            {isCompleted ? (
              <Badge className="heard-pill bg-gray-600 text-white">Completed</Badge>
            ) : isActive_status ? (
              <TimeLeftBadge
                endTime={room.endTime}
                createdAt={room.createdAt}
                isRealtime={isRealtime}
              />
            ) : (
              <Badge className="heard-pill bg-blue-600 text-white">Waiting</Badge>
            )}
          </div>

          {isCompleted && showAnalysis && (
            <div>
              <DebateAnalysisView
                roomId={room.id}
                isDeveloper={isDeveloper}
                onClose={handleCloseAnalysis}
              />
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

      <AddResponseModal
        room={room}
        open={showAddResponseModal}
        allowAnonymous={!!room.allowAnonymous}
        isAnonymous={!!user?.isAnonymous}
        onOpenChange={setShowAddResponseModal}
        onSubmitStatement={handleSubmitStatement}
        onShowAccountSetupModal={onShowAccountSetupModal}
      />

    </motion.div>
  );
}