// @ts-ignore
import { toast } from "sonner@2.0.3";

import { motion } from "motion/react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  ArrowRight,
  BarChart3,
  Loader2,
  Info,
  MessageCirclePlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { SwipeableStatementStack } from "./room/SwipeableStatementStack";
import { extractYouTubeVideoId } from "./room/CoverCard";
import { InProgressResults } from "./results/InProgressResults";
import { ConcludedResults } from "./results/ConcludedResults";
import { AddResponseModal } from "./room/AddResponseModal";
import { DebateAnalysisView } from "./analysis/DebateAnalysisView";
import { useState, useEffect } from "react";
import { updateUrlForAnalysis } from "../utils/url";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "../utils/constants/errors";
import { DebateRoom, Statement, VoteType, UserSession, FullCoverData } from "../types";
import { RoomCardMenu } from "./room/RoomCardMenu";
import { ShareButton } from "./ShareButton";
import { HideAndMergeModal } from "./room/mod/HideAndMergeModal";
import { EditRoomModal } from "./room/mod/EditRoomModal";
import { VoteMatrixModal } from "./room/VoteMatrixModal";
import { useDebateSession } from "../hooks/useDebateSession";
import { useSwipeTutorialContext } from "../contexts/SwipeTutorialContext";
import { LinkedText } from "./widgets/LinkedText";
import { formatSubHeardDisplay } from "../utils/subheard";
import { getTotalVotes } from "../utils/votes";
import { useTranslation, Trans } from "react-i18next";

interface RoomCardProps {
  room: DebateRoom;
  statements: Statement[];
  loadingStatements: boolean;
  isDeveloper: boolean;
  isActive: boolean;
  user: UserSession;
  currentSubHeard?: string;
  analysisRoomId?: string;
  targetStatementId?: string;
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
  onSubHeardChange: (subHeard: string | null) => void;
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
  targetStatementId,
  onJoin,
  onSubmitStatement,
  onVoteOnStatement,
  onRefreshStatements,
  onDiscussStatement,
  onShowAccountSetupModal,
  onSubHeardChange,
}: RoomCardProps) {
  const { resetTutorialTimer } = useSwipeTutorialContext();
  const { t } = useTranslation(["room", "toast"]);

  const [certifyCardDismissed, setCertifyCardDismissed] = useState(false);
  const [chanceCardSwiped, setChanceCardSwiped] = useState(room.chanceCardSwiped || false);
  const [coverCardSwiped, setCoverCardSwiped] = useState(room.coverCardSwiped || false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showAddResponseModal, setShowAddResponseModal] = useState(false);
  const [showDeduplication, setShowDeduplication] = useState(false);
  const [showVoteMatrix, setShowVoteMatrix] = useState(false);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const { markChanceCardSwiped, markCoverCardSwiped } = useDebateSession();

  const isTrueHost = user.id === room.hostId;
  const isHost = isTrueHost || !!room.cohostIds?.includes(user.id);

  useEffect(() => {
    if (analysisRoomId === room.id) {
      setShowAnalysis(true);
    }
  }, [analysisRoomId, room.id]);

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
        onShowAccountSetupModal("vote");
        toast.error(t("toast:accountRequired"));
      } else {
        toast.error(
          t("toast:voteFailed"),
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
      <div className="space-y-4 border rounded-2xl py-4 px-2" style={{ borderColor: "rgba(151, 107, 132, 0.2)", backgroundColor: "rgba(255, 255, 255, 0.45)" }}>
          {/* Compact header */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            {/* Subheard label */}
            {!currentSubHeard && room.subHeard && (
              <p className="text-center text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
                <button
                  onClick={() => onSubHeardChange(room.subHeard!)}
                  className="underline decoration-dotted underline-offset-2 hover:text-muted-foreground"
                >
                  {formatSubHeardDisplay(room.subHeard)}
                </button>
              </p>
            )}

            {/* Title */}
            <div className="flex items-start justify-center gap-1">
              <h2 className="font-bold text-foreground text-xl text-center leading-tight">
                {room.topic}
              </h2>
              {(room.description || room.imageUrl || room.youtubeUrl) && (
                <button
                  onClick={() => setShowDescriptionModal(true)}
                  className="mt-1 shrink-0 text-foreground/40 hover:text-foreground/70 transition-colors"
                >
                  <Info className="w-5 h-5" />
                </button>
              )}
            </div>

            {statements.length > 0 && (() => {
              const totalVotes = statements.reduce((sum, s) => sum + getTotalVotes(s), 0);
              return (
                <p className="text-center text-foreground">
                  <Trans
                    i18nKey="room:votesOnResponses"
                    values={{
                      votes: t("voteCount", { count: totalVotes }),
                      responses: t("responseCount", { count: statements.length }),
                    }}
                    components={[<strong key="votes" />, <strong key="responses" />]}
                  />
                </p>
              );
            })()}

            {(room.description || room.imageUrl || room.youtubeUrl) && (
              <Dialog open={showDescriptionModal} onOpenChange={setShowDescriptionModal}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{room.topic}</DialogTitle>
                  </DialogHeader>
                  {room.imageUrl && (
                    <img
                      src={room.imageUrl}
                      alt={room.topic}
                      className="w-full rounded-lg object-cover max-h-48"
                    />
                  )}
                  {room.youtubeUrl && (() => {
                    const videoId = extractYouTubeVideoId(room.youtubeUrl!);
                    return videoId ? (
                      <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: "56.25%" }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={t("introVideoTitle")}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : null;
                  })()}
                  {room.description && (
                    <p className="text-sm text-muted-foreground">
                      <LinkedText text={room.description} />
                    </p>
                  )}
                </DialogContent>
              </Dialog>
            )}

          </motion.div>

          {/* Statement Stack or Results */}
          {!isCompleted && statements.length > 0 && !hasSwipedAll && (
            <p className="text-center text-s text-muted-foreground/60">{t("voteOnResponsesBelow")}</p>
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
                      onShowAccountSetupModal("certifyVotes")
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
                    targetStatementId={targetStatementId}
                    isActive={isActive}
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
                    {t("loadingStatements")}
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      {t("noResponsesYet")}
                    </p>
                  </div>
                  <Button
                    onClick={onJoin}
                    disabled={isCompleted}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {isCompleted
                      ? t("conversationEnded")
                      : t("joinToAddResponses")}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 relative z-10">
            {!isCompleted ? (
              <Button
                variant="secondary"
                className="heard-pill"
                disabled={!!room.responsesPaused}
                onClick={() => setShowAddResponseModal(true)}
              >
                <MessageCirclePlus className="w-4 h-4" />
                {t("respond")}
              </Button>
            ) : <Badge className="heard-pill bg-gray-600 text-white">{t("completed")}</Badge>}
            <Button
              onClick={handleOpenAnalysis}
              variant="secondary"
              className="heard-pill hover:bg-secondary/60"
            >
              <BarChart3 className="w-4 h-4" />
              {t("results")}
            </Button>
            <ShareButton roomId={room.id} roomTopic={room.topic} />
            <RoomCardMenu
              room={room}
              participantCount={participantCount}
              isRealtime={isRealtime}
              hasRealtimeEnded={hasRealtimeEnded}
              isDeveloper={isDeveloper}
              isHost={isHost}
              isTrueHost={isTrueHost}
              isCompleted={!!isCompleted}
              onOpenEditRoom={() => setShowEditRoom(true)}
              onOpenDeduplication={() => setShowDeduplication(true)}
              onOpenVoteMatrix={() => setShowVoteMatrix(true)}
            />
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