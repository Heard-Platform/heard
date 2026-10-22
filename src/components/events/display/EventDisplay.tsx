import { useEffect, useId, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import type { LiveEventView, ModeratorAction } from "../../../types";
import type { EventPost } from "../../../hooks/useEventPost";
import { useIdle } from "../../../hooks/useIdle";
import { getDisplayScreen, isAttendeeStatement, type DisplayView } from "../../../utils/event-display";
import { DisplayBoard } from "./DisplayBoard";
import { BoardControls, JoinControls } from "./DisplayControls";
import { DisplayEndCard } from "./DisplayEndCard";
import { DisplayJoinScreen } from "./DisplayJoinScreen";
import { DisplaySpotlight } from "./DisplaySpotlight";
import { Loader } from "../../widgets/Loader";
import { EndSessionConfirm } from "./EndSessionConfirm";

const CONTROLS_HIDE_AFTER_IDLE_MS = 1000;
const SCREEN_FADE_SECONDS = 0.25;

export interface EventDisplayProps {
  eventState: LiveEventView;
  post: EventPost | null;
  joinUrl: string;
  joinLabel: string;
  isBusy: boolean;
  onAction: (action: ModeratorAction) => void;
}

export function EventDisplay({ eventState, post, joinUrl, joinLabel, isBusy, onAction }: EventDisplayProps) {
  const layoutGroupId = useId();
  const { isIdle, resetIdleTimer } = useIdle(CONTROLS_HIDE_AFTER_IDLE_MS);
  const [view, setView] = useState<DisplayView>("agree-vs-disagree");
  const [spotlightStatementId, setSpotlightStatementId] = useState<string | null>(null);
  const [isConfirmingEnd, setIsConfirmingEnd] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSpotlightStatementId(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const spotlightStatement = post?.statements.find((statement) => statement.id === spotlightStatementId) ?? null;
  const questionLabel = `Question ${(eventState.currentIndex ?? 0) + 1}`;
  const screen = getDisplayScreen(eventState, post?.room.id ?? null);
  const screenKey = screen === "board" ? `board:${eventState.currentRoomId}` : screen;

  const handleConfirmEnd = () => {
    setIsConfirmingEnd(false);
    onAction("end");
  };

  const renderScreen = () => {
    if (screen === "end") {
      return <DisplayEndCard totals={eventState.totals} />;
    }
    if (screen === "join" || eventState.currentIndex === null) {
      return (
        <>
          <DisplayJoinScreen peopleHere={eventState.peopleHere} joinUrl={joinUrl} joinLabel={joinLabel} />
          <JoinControls peopleHere={eventState.peopleHere} isHidden={isIdle} isBusy={isBusy} onAction={onAction} />
        </>
      );
    }
    if (screen === "loading" || !post) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader />
        </div>
      );
    }
    const postCount = eventState.roomOrder.length;
    return (
      <>
        <DisplayBoard
          eyebrow={`${questionLabel} of ${postCount}`}
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
        <BoardControls
          view={view}
          votingPaused={eventState.votingPaused}
          peopleHere={eventState.peopleHere}
          finishedCurrentPost={eventState.finishedCurrentPost}
          canGoBack={eventState.currentIndex > 0}
          isLastPost={eventState.currentIndex >= postCount - 1}
          isHidden={isIdle}
          isBusy={isBusy}
          onViewChange={setView}
          onAction={onAction}
          onEndRequest={() => setIsConfirmingEnd(true)}
        />
        {isConfirmingEnd && (
          <EndSessionConfirm isBusy={isBusy} onConfirm={handleConfirmEnd} onCancel={() => setIsConfirmingEnd(false)} />
        )}
      </>
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id={layoutGroupId}>
        <div
          onPointerMove={resetIdleTimer}
          onPointerDown={resetIdleTimer}
          onKeyDown={resetIdleTimer}
          className={`display-screen-bg @container relative h-full w-full overflow-hidden ${isIdle ? "cursor-none" : ""}`}
        >
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
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
