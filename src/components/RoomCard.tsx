// @ts-ignore
import { toast } from "sonner@2.0.3";

import { motion } from "motion/react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  ArrowRight,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageCirclePlus,
} from "lucide-react";
import { SwipeableStatementStack } from "./room/SwipeableStatementStack";
import { InProgressResults } from "./results/InProgressResults";
import { ConcludedResults } from "./results/ConcludedResults";
import { AddResponseModal } from "./room/AddResponseModal";
import { DebateAnalysisView } from "./analysis/DebateAnalysisView";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { updateUrlForAnalysis } from "../utils/url";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "../utils/constants/errors";
import { DebateRoom, Statement, VoteType, UserSession, Cover, FullCoverData } from "../types";
import { RoomCardMenu } from "./room/RoomCardMenu";
import { ShareButton } from "./ShareButton";
import { HideAndMergeModal } from "./room/mod/HideAndMergeModal";
import { EditRoomModal } from "./room/mod/EditRoomModal";
import { VoteMatrixModal } from "./room/VoteMatrixModal";
import { TimeLeftBadge } from "./room/TimeLeftBadge";
import { useDebateSession } from "../hooks/useDebateSession";
import { timeAgoShort } from "../utils/time";
import { useSwipeTutorialContext } from "../contexts/SwipeTutorialContext";
import { LinkedText } from "./widgets/LinkedText";

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
  onSwipedAllChange: (allSwiped: boolean) => void;
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
  analysisRoomId,
  onJoin,
  onSubmitStatement,
  onVoteOnStatement,
  onSwipedAllChange,
  onRefreshStatements,
  onDiscussStatement,
  onShowAccountSetupModal,
}: RoomCardProps) {
  const { resetTutorialTimer } = useSwipeTutorialContext();
  
  const [certifyCardDismissed, setCertifyCardDismissed] = useState(false);
  const [chanceCardSwiped, setChanceCardSwiped] = useState(room.chanceCardSwiped || false);
  const [coverCardSwiped, setCoverCardSwiped] = useState(room.coverCardSwiped || false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionTruncated, setDescriptionTruncated] = useState(false);
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const [showAddResponseModal, setShowAddResponseModal] = useState(false);
  const [showDeduplication, setShowDeduplication] = useState(false);
  const [showVoteMatrix, setShowVoteMatrix] = useState(false);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const { markChanceCardSwiped, markCoverCardSwiped } = useDebateSession();

  const isHost = user.id === room.hostId;

  useEffect(() => {
    if (analysisRoomId === room.id) {
      setShowAnalysis(true);
    }
  }, [analysisRoomId, room.id]);

  useLayoutEffect(() => {
    const el = descriptionRef.current;
    if (el) setDescriptionTruncated(el.scrollHeight > el.clientHeight);
  }, [room.description]);

  useEffect(() => {
    setChanceCardSwiped(room.chanceCardSwiped || false);
  }, [room.chanceCardSwiped]);

  useEffect(() => {
    setCoverCardSwiped(room.coverCardSwiped || false);
  }, [room.coverCardSwiped]);

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
  
  const effectiveChanceCardSwiped = chanceCardSwiped || !!room.responsesPaused;

  const hasSwipedAll =
    statements.length > 0 &&
    statements.every(
      (statement) =>
        statement.voters && statement.voters[user.id],
    ) &&
    (!user.isAnonymous || certifyCardDismissed) &&
    effectiveChanceCardSwiped &&
    (coverCardSwiped || !(room.imageUrl || room.youtubeUrl)) &&
    (!room.demographicQuestions.length ||
      room.demographicQuestions.every((q) =>
        answeredQuestionIds.has(q.id),
      ));

  useEffect(() => {
    onSwipedAllChange(hasSwipedAll);
  }, [hasSwipedAll]);

  const isRealtime = room.mode === "realtime";

  const hasRealtimeEnded =
    isRealtime && room.endTime && Date.now() >= room.endTime;

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

  const coverCardUrl = room.imageUrl || room.youtubeUrl;
  const cover: FullCoverData | null = coverCardUrl
    ? {
        type: room.imageUrl ? "image" : "youtube",
        url: coverCardUrl,
        description: room.description,
      }
    : null;

  const handleSwipeCoverCard = async () => {
    setCoverCardSwiped(true);
    await markCoverCardSwiped(room.id);
  }

  const handleDemographicsAnswered = (questionId: string) => {
    setAnsweredQuestionIds((prev) => new Set(prev).add(questionId));
  }

  // Handle statement submission
  const handleSubmitStatement = async (text: string) => {
    resetTutorialTimer();
    
    try {
      await onSubmitStatement(room.id, text);
      if (onRefreshStatements) {
        await onRefreshStatements();
        resetTutorialTimer();
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
      className="w-full"
      style={{ maxWidth: "var(--room-card-max-width)" }}
    >
      <div className="space-y-4">
          {/* Compact header */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            {/* Top row: timestamp + menu */}
            <div className="flex items-center justify-end gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>{timeAgoShort(room.createdAt)} ago</span>
                {room.endTime && !isCompleted && (
                  <>
                    <span>·</span>
                    <TimeLeftBadge
                      endTime={room.endTime}
                      createdAt={room.createdAt}
                      isRealtime={isRealtime}
                      variant="text"
                    />
                  </>
                )}
              </div>
              <div className="shrink-0">
                <RoomCardMenu
                  room={room}
                  participantCount={participantCount}
                  isRealtime={isRealtime}
                  hasRealtimeEnded={hasRealtimeEnded}
                  isDeveloper={isDeveloper}
                  isHost={isHost}
                  onOpenEditRoom={() => setShowEditRoom(true)}
                  onOpenDeduplication={() => setShowDeduplication(true)}
                  onOpenVoteMatrix={() => setShowVoteMatrix(true)}
                />
              </div>
            </div>

            {/* Title */}
            <h2 className="font-bold text-foreground text-3xl text-center">
              {room.topic}
            </h2>

            {statements.length > 0 && (() => {
              const totalVotes = statements.reduce(
                (sum, s) => sum + (s.agrees ?? 0) + (s.disagrees ?? 0) + (s.passes ?? 0) + (s.superAgrees ?? 0),
                0,
              );
              return (
                <p className="text-center text-foreground">
                  <strong>{totalVotes.toLocaleString()}</strong> votes on <strong>{statements.length.toLocaleString()}</strong> responses
                </p>
              );
            })()}

            {room.description && (
              <div
                className={`text-sm text-muted-foreground transition-opacity ${descriptionTruncated || descriptionExpanded ? "cursor-pointer active:opacity-60" : ""}`}
                onClick={() => (descriptionTruncated || descriptionExpanded) && setDescriptionExpanded((v) => !v)}
              >
                <span ref={descriptionRef} className={descriptionExpanded ? "" : "line-clamp-1"}>
                  <LinkedText text={room.description} />
                </span>
                {(descriptionTruncated || descriptionExpanded) && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground/50 mt-0.5">
                    {descriptionExpanded
                      ? <><ChevronUp className="w-3 h-3" />see less</>
                      : <><ChevronDown className="w-3 h-3" />see more</>}
                  </span>
                )}
              </div>
            )}

          </motion.div>

          {/* Statement Stack or Results */}
          {!isCompleted && statements.length > 0 && (
            <h3 className="font-bold text-foreground text-xl -mb-2">Vote on Responses below</h3>
          )}
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
                    chanceCardSwiped={effectiveChanceCardSwiped}
                    cover={cover}
                    coverCardSwiped={coverCardSwiped}
                    demographicQuestions={room.demographicQuestions}
                    answeredQuestionIds={answeredQuestionIds}
                    onVote={handleVote}
                    onSubmitStatement={handleSubmitStatement}
                    onShowAccountSetupModal={onShowAccountSetupModal}
                    onCertifyDone={() => setCertifyCardDismissed(true)}
                    onChanceCardSwiped={handleSwipeChanceCard}
                    onCoverCardSwiped={handleSwipeCoverCard}
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
              <Button
                variant="secondary"
                className="heard-pill"
                disabled={!!room.responsesPaused}
                onClick={() => setShowAddResponseModal(true)}
              >
                <MessageCirclePlus className="w-4 h-4" />
                Respond
              </Button>
            )}
            <Button
              onClick={handleOpenAnalysis}
              variant="secondary"
              className="heard-pill hover:bg-secondary/60"
            >
              <BarChart3 className="w-4 h-4" />
              Results
            </Button>
            {isCompleted && <Badge className="heard-pill bg-gray-600 text-white">Completed</Badge>}
            <ShareButton roomId={room.id} />
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

      {showAnalysis && (
        <DebateAnalysisView
          roomId={room.id}
          isDeveloper={isDeveloper}
          onClose={handleCloseAnalysis}
        />
      )}

      {showEditRoom && (
        <EditRoomModal
          room={room}
          hasVotes={statements.some(
            (s) => s.voters && Object.keys(s.voters).length > 0,
          )}
          onClose={() => setShowEditRoom(false)}
        />
      )}

      {showDeduplication && (
        <HideAndMergeModal
          roomId={room.id}
          onClose={() => setShowDeduplication(false)}
        />
      )}

      {showVoteMatrix && (
        <VoteMatrixModal
          roomId={room.id}
          roomTopic={room.topic}
          participantCount={participantCount}
          onClose={() => setShowVoteMatrix(false)}
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