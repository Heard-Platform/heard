import { useEffect, useId, useState } from "react";
import { LayoutGroup, MotionConfig } from "motion/react";
import type { LiveEventView, ModeratorAction } from "../../../types";
import type { EventPost } from "../../../hooks/useEventPost";
import { useIdle } from "../../../hooks/useIdle";
import { isAttendeeStatement, type DisplayView } from "../../../utils/event-display";
import { DisplayBoard } from "./DisplayBoard";
import { BoardControls, JoinControls } from "./DisplayControls";
import { DisplayEndCard } from "./DisplayEndCard";
import { DisplayJoinScreen } from "./DisplayJoinScreen";
import { DisplaySpotlight } from "./DisplaySpotlight";
import { EndSessionConfirm } from "./EndSessionConfirm";

const CONTROLS_HIDE_AFTER_IDLE_MS = 500;

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

  const handleConfirmEnd = () => {
    setIsConfirmingEnd(false);
    onAction("end");
  };

  const renderScreen = () => {
    if (eventState.status === "ended") {
      return <DisplayEndCard totals={eventState.totals} />;
    }
    if (eventState.status !== "live" || !post || eventState.currentIndex === null) {
      return (
        <>
          <DisplayJoinScreen peopleHere={eventState.peopleHere} joinUrl={joinUrl} joinLabel={joinLabel} />
          {eventState.status === "setup" && <JoinControls peopleHere={eventState.peopleHere} isHidden={isIdle} isBusy={isBusy} onAction={onAction} />}
        </>
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
          {renderScreen()}
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
