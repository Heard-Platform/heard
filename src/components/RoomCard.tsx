// @ts-ignore
import { toast } from "sonner@2.0.3";

import { motion } from "motion/react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  BarChart3,
  Loader2,
  MessageCirclePlus,
} from "lucide-react";
import { SwipeableStatementStack } from "./room/SwipeableStatementStack";
import { InProgressResults } from "./results/InProgressResults";
import { ConcludedResults } from "./results/ConcludedResults";
import { VotesDrawer } from "./results/VotesDrawer";
import { AddResponseModal } from "./room/AddResponseModal";
import { DebateAnalysisView } from "./analysis/DebateAnalysisView";
import { useState, useEffect, useRef } from "react";
import { updateUrlForAnalysis } from "../utils/url";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "../utils/constants/errors";
import { DebateRoom, Statement, VoteType, UserSession, FullCoverData } from "../types";
import { RoomCardMenu } from "./room/RoomCardMenu";
import { ShareButton } from "./ShareButton";
import { HideAndMergeModal } from "./room/mod/HideAndMergeModal";
import { EditRoomModal } from "./room/mod/EditRoomModal";
import { VoteMatrixModal } from "./room/VoteMatrixModal";
import { DisplayModeScreen } from "./DisplayModeScreen";
import { useDebateSession } from "../hooks/useDebateSession";
import { useSwipeTutorialContext } from "../contexts/SwipeTutorialContext";
import { LinkedText } from "./widgets/LinkedText";
import { formatSubHeardDisplay } from "../utils/subheard";
import { useTranslation, Trans } from "react-i18next";
import { getUniqueVoterCount } from "../utils/room";
import { pluralizePerson } from "../utils/text";
import { FeedCardMotion } from "./FeedCardMotion";

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
  onSubmitStatement,
  onVoteOnStatement,
  onRefreshStatements,
  onDiscussStatement,
  onShowAccountSetupModal,
  onSubHeardChange,
}: RoomCardProps) {
  const { resetTutorialTimer } = useSwipeTutorialContext();
  const { t } = useTranslation(["postControls"]);

  const [certifyCardDismissed, setCertifyCardDismissed] = useState(false);
  const [chanceCardSwiped, setChanceCardSwiped] = useState(room.chanceCardSwiped || false);
  const [coverCardSwiped, setCoverCardSwiped] = useState(room.coverCardSwiped || false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [canExpandDescription, setCanExpandDescription] = useState(false);
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [showAddResponseModal, setShowAddResponseModal] = useState(false);
  const [showDeduplication, setShowDeduplication] = useState(false);
  const [showVoteMatrix, setShowVoteMatrix] = useState(false);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [showDisplayMode, setShowDisplayMode] = useState(false);
  const [showVotesDrawer, setShowVotesDrawer] = useState(false);
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

  useEffect(() => {
    const el = descriptionRef.current;
    if (el) {
      setCanExpandDescription(el.scrollWidth > el.clientWidth);
    }
  }, [room.description]);

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
    <FeedCardMotion isActive={isActive}>
      <div className="space-y-4 border rounded-2xl py-4 px-2 normal-border" style={{ backgroundColor: "rgba(255, 255, 255, 0.45)" }}>
          {/* Compact header */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            {/* Subheard, image, title, and description */}
            <div className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1">
              {!currentSubHeard && room.subHeard && (
                <>
                  <div />
                  <p className="text-left text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
                    <button
                      onClick={() => onSubHeardChange(room.subHeard!)}
                      className="underline decoration-dotted underline-offset-2 hover:text-muted-foreground"
                    >
                      {formatSubHeardDisplay(room.subHeard)}
                    </button>
                  </p>
                </>
              )}

              {room.imageUrl && (
                <button
                  onClick={() => setShowFullscreenImage(true)}
                  className="shrink-0 w-16 h-16 rounded-lg overflow-hidden"
                >
                  <img
                    src={room.imageUrl}
                    alt={room.topic}
                    className="w-full h-full object-cover"
                  />
                </button>
              )}
              <div className="min-w-0 col-start-2 text-left">
                <h2 className="font-bold text-foreground text-xl leading-tight">
                  {room.topic}
                </h2>
                {room.description && (
                  <div className="mt-1">
                    {descriptionExpanded ? (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          <LinkedText text={room.description} />
                        </p>
                        <button
                          onClick={() => setDescriptionExpanded(false)}
                          className="text-sm text-foreground/60 hover:text-foreground underline underline-offset-2"
                        >
                          see less
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span
                          ref={descriptionRef}
                          className="min-w-0 flex-1 truncate text-sm text-muted-foreground"
                        >
                          <LinkedText text={room.description} />
                        </span>
                        {canExpandDescription && (
                          <button
                            onClick={() => setDescriptionExpanded(true)}
                            className="shrink-0 text-sm text-foreground/60 hover:text-foreground underline underline-offset-2"
                          >
                            see more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {statements.length > 0 && (() => {
                  const voterCount = getUniqueVoterCount(statements);
                  return (
                    <p className="text-left text-foreground mt-1">
                      <strong>{voterCount.toLocaleString()}</strong>{" "}
                      {pluralizePerson(voterCount)} voted on{" "}
                      <strong>
                        {statements.length.toLocaleString()}
                      </strong>{" "}
                      responses
                    </p>
                  );
                })()}
              </div>
            </div>
          </motion.div>

          {room.imageUrl && showFullscreenImage && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setShowFullscreenImage(false)}
            >
              <img
                src={room.imageUrl}
                alt={room.topic}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}

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
                    Loading statements...
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {isCompleted
                      ? "Conversation ended with no responses"
                      : "No responses yet"}
                  </p>
                </div>
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
              statementCount={statements.length}
              isRealtime={isRealtime}
              hasRealtimeEnded={hasRealtimeEnded}
              isDeveloper={isDeveloper}
              isHost={isHost}
              isTrueHost={isTrueHost}
              isCompleted={!!isCompleted}
              onOpenEditRoom={() => setShowEditRoom(true)}
              onOpenDeduplication={() => setShowDeduplication(true)}
              onOpenVoteMatrix={() => setShowVoteMatrix(true)}
              onOpenDisplayMode={() => setShowDisplayMode(true)}
              onOpenVotesDrawer={() => setShowVotesDrawer(true)}
            />
          </div>


          {isCompleted && showAnalysis && (
            <div>
              <DebateAnalysisView
                roomId={room.id}
                isDeveloper={isDeveloper}
                isModerator={isHost}
                onClose={handleCloseAnalysis}
              />
            </div>
          )}
        </div>

      {showAnalysis && (
        <DebateAnalysisView
          roomId={room.id}
          isDeveloper={isDeveloper}
          isModerator={isHost}
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

      {showDisplayMode && (
        <DisplayModeScreen
          room={room}
          statements={statements}
          onClose={() => setShowDisplayMode(false)}
        />
      )}

      <VotesDrawer
        statements={statements}
        debateTitle={room.topic}
        open={showVotesDrawer}
        showTrigger={false}
        onChangeVote={handleVote}
        onOpenChange={setShowVotesDrawer}
      />

      <AddResponseModal
        room={room}
        open={showAddResponseModal}
        allowAnonymous={!!room.allowAnonymous}
        isAnonymous={!!user?.isAnonymous}
        onOpenChange={setShowAddResponseModal}
        onSubmitStatement={handleSubmitStatement}
        onShowAccountSetupModal={onShowAccountSetupModal}
      />

    </FeedCardMotion>
  );
}