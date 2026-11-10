import { useCallback, useEffect, useId, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import type {
  AudienceBreakdownQuestion,
  LiveEventView,
  ModeratorAction,
} from "../../../types";
import type { EventPost } from "../../../types";
import { useIdle } from "../../../hooks/useIdle";
import {
  getDisplayScreen,
  isAttendeeStatement,
  isHideScreenShortcut,
  type DisplayView,
} from "../../../utils/event-display";
import { DisplayBoard } from "./DisplayBoard";
import {
  BoardControls,
  IntroControls,
  JoinControls,
  PrivacyScreenControls,
} from "./DisplayControls";
import { DisplayEndCard } from "./DisplayEndCard";
import { DisplayDoorsClosedScreen } from "./DisplayDoorsClosedScreen";
import { DisplayJoinScreen } from "./DisplayJoinScreen";
import { DisplayPrivacyScreen } from "./DisplayPrivacyScreen";
import { DisplayPromptIntro } from "./DisplayPromptIntro";
import { DisplaySpotlight } from "./DisplaySpotlight";
import { Loader } from "../../widgets/Loader";
import { EndSessionConfirm } from "./EndSessionConfirm";
import { AudienceBreakdown } from "./AudienceBreakdown";

const CONTROLS_HIDE_AFTER_IDLE_MS = 1000;
const SCREEN_FADE_SECONDS = 0.25;
const LOADER_SHOW_AFTER_SECONDS = 0.5;

export interface EventDisplayProps {
  eventState: LiveEventView;
  post: EventPost | null;
  joinUrl: string;
  joinLabel: string;
  reportUrl: string;
  isBusy: boolean;
  isShowingAudienceBreakdown: boolean;
  audienceBreakdownQuestions: AudienceBreakdownQuestion[] | null;
  onAction: (action: ModeratorAction) => void;
  onShowAudienceBreakdown: () => void;
  onCloseAudienceBreakdown: () => void;
  onScreenHidden: () => void;
}

export function EventDisplay({
  eventState,
  post,
  joinUrl,
  joinLabel,
  reportUrl,
  isBusy,
  isShowingAudienceBreakdown,
  audienceBreakdownQuestions,
  onAction,
  onShowAudienceBreakdown,
  onCloseAudienceBreakdown,
  onScreenHidden,
}: EventDisplayProps) {
  const layoutGroupId = useId();
  const { isIdle, resetIdleTimer } = useIdle(CONTROLS_HIDE_AFTER_IDLE_MS);
  const [view, setView] = useState<DisplayView>("agree-vs-disagree");
  const [spotlightStatementId, setSpotlightStatementId] = useState<string | null>(null);
  const [isConfirmingEnd, setIsConfirmingEnd] = useState(false);
  const [isScreenHidden, setIsScreenHidden] = useState(false);

  const handleHideScreen = useCallback(() => {
    setIsScreenHidden(true);
    onScreenHidden();
  }, [onScreenHidden]);

  const handleShowScreen = () => setIsScreenHidden(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isHideScreenShortcut(event)) {
        if (isScreenHidden) setIsScreenHidden(false);
        else handleHideScreen();
        return;
      }
      if (event.key !== "Escape") return;
      if (isScreenHidden) {
        setIsScreenHidden(false);
        return;
      }
      setSpotlightStatementId(null);
      onCloseAudienceBreakdown();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isScreenHidden, handleHideScreen, onCloseAudienceBreakdown]);

  const spotlightStatement = post?.statements.find((statement) => statement.id === spotlightStatementId) ?? null;
  const questionLabel = `Question ${(eventState.currentIndex ?? 0) + 1}`;
  const screen = getDisplayScreen(eventState, post?.room.id ?? null);
  const isOnPost = screen === "intro" || screen === "board";
  const screenKey = isOnPost
    ? `${screen}:${eventState.currentRoomId}`
    : screen;
  const areDoorsOpen = eventState.status !== "setup";

  const handleConfirmEnd = () => {
    setIsConfirmingEnd(false);
    onAction("end");
  };

  const postCount = eventState.roomOrder.length;
  const postEyebrow = `${questionLabel} of ${postCount}`;
  const canGoBack = (eventState.currentIndex ?? 0) > 0;
  const isLastPost = (eventState.currentIndex ?? 0) >= postCount - 1;

  const renderScreen = () => {
    if (screen === "end") {
      return (
        <DisplayEndCard
          totals={eventState.totals}
          reportUrl={reportUrl}
        />
      );
    }
    if (screen === "join" || eventState.currentIndex === null) {
      return areDoorsOpen ? (
        <DisplayJoinScreen
          peopleHere={eventState.peopleHere}
          answeringQuestions={eventState.answeringQuestions}
          joinUrl={joinUrl}
          joinLabel={joinLabel}
        />
      ) : (
        <DisplayDoorsClosedScreen />
      );
    }
    if (screen === "loading" || !post) {
      return (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: LOADER_SHOW_AFTER_SECONDS }}
        >
          <Loader />
        </motion.div>
      );
    }
    if (screen === "intro") {
      return (
        <DisplayPromptIntro
          eyebrow={postEyebrow}
          prompt={post.room.topic}
          joinUrl={joinUrl}
          joinLabel={joinLabel}
        />
      );
    }
    return (
      <>
        <DisplayBoard
          eyebrow={postEyebrow}
          title={post.room.topic}
          statements={post.statements}
          startedAt={eventState.startedAt}
          view={view}
          votingPaused={eventState.votingPaused}
          peopleHere={eventState.peopleHere}
          joinUrl={joinUrl}
          joinLabel={joinLabel}
          onSelectStatement={setSpotlightStatementId}
        />
        {spotlightStatement && (
          <DisplaySpotlight
            statement={spotlightStatement}
            eyebrow={isAttendeeStatement(spotlightStatement, eventState.startedAt) ? "From the room" : questionLabel}
            onClose={() => setSpotlightStatementId(null)}
          />
        )}
      </>
    );
  };

  const renderControls = () => {
    if (isShowingAudienceBreakdown) return null;
    if (screen === "join") {
      return (
        <JoinControls
          areDoorsOpen={areDoorsOpen}
          peopleHere={eventState.peopleHere}
          isHidden={isIdle}
          isBusy={isBusy}
          onAction={onAction}
          onShowAudienceBreakdown={onShowAudienceBreakdown}
          onHideScreen={handleHideScreen}
        />
      );
    }
    if (screen === "intro") {
      return (
        <IntroControls
          peopleHere={eventState.peopleHere}
          canGoBack={canGoBack}
          isHidden={isIdle}
          isBusy={isBusy}
          onAction={onAction}
          onShowAudienceBreakdown={onShowAudienceBreakdown}
          onHideScreen={handleHideScreen}
        />
      );
    }
    if (screen === "board") {
      return (
        <BoardControls
          view={view}
          votingPaused={eventState.votingPaused}
          peopleHere={eventState.peopleHere}
          finishedCurrentPost={eventState.finishedCurrentPost}
          canGoBack={canGoBack}
          isLastPost={isLastPost}
          isHidden={isIdle}
          isBusy={isBusy}
          onViewChange={setView}
          onAction={onAction}
          onEndRequest={() => setIsConfirmingEnd(true)}
          onShowAudienceBreakdown={onShowAudienceBreakdown}
          onHideScreen={handleHideScreen}
        />
      );
    }
    return null;
  };

  const renderDisplay = () => (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screenKey}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: SCREEN_FADE_SECONDS, ease: "easeInOut" }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      {isShowingAudienceBreakdown && (
        <AudienceBreakdown
          questions={audienceBreakdownQuestions}
          onClose={onCloseAudienceBreakdown}
        />
      )}
      {renderControls()}
      {isConfirmingEnd && (
        <EndSessionConfirm
          isBusy={isBusy}
          onConfirm={handleConfirmEnd}
          onCancel={() => setIsConfirmingEnd(false)}
        />
      )}
    </>
  );

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id={layoutGroupId}>
        <div
          onPointerMove={resetIdleTimer}
          onPointerDown={resetIdleTimer}
          onKeyDown={resetIdleTimer}
          className={`display-screen-bg @container relative h-full w-full overflow-hidden ${isIdle ? "cursor-none" : ""}`}
        >
          {isScreenHidden ? (
            <>
              <DisplayPrivacyScreen />
              <PrivacyScreenControls
                isHidden={isIdle}
                onShowScreen={handleShowScreen}
              />
            </>
          ) : (
            renderDisplay()
          )}
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
