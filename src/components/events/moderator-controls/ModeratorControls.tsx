import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../ui/button";
import { ControlsFrame, ControlsStats } from "./ControlsFrame";
import { EndSessionConfirm } from "./EndSessionConfirm";
import { EventPostList } from "../EventPostList";
import { getControlsPhase } from "../../../utils/live-event";
import type { ModeratorAction, EventSetupRoom, LiveEventView } from "../../../types";

export interface ModeratorControlsProps {
  eventName: string;
  rooms: EventSetupRoom[];
  eventState: LiveEventView;
  isBusy: boolean;
  onAction: (action: ModeratorAction) => void;
}

export function ModeratorControls({ eventName, rooms, eventState, isBusy, onAction }: ModeratorControlsProps) {
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const phase = getControlsPhase(eventState.status, eventState.currentIndex, rooms.length);

  if (phase === "not-started" || eventState.currentIndex === null) {
    return (
      <ControlsFrame
        badge="Not started"
        badgeTone="neutral"
        title={eventName}
        controls={
          <Button className="w-full h-12 text-base" disabled={isBusy || rooms.length === 0} onClick={() => onAction("start")}>
            Start
          </Button>
        }
      >
        <ControlsStats
          stats={[
            { value: String(eventState.peopleHere), label: "people here" },
            { value: String(rooms.length), label: rooms.length === 1 ? "question" : "questions" },
          ]}
        />
        <EventPostList rooms={rooms} currentIndex={null} currentBadge="Live" />
      </ControlsFrame>
    );
  }

  const currentRoom = rooms[eventState.currentIndex];
  const isLastPost = phase === "last-post";
  const canGoBack = eventState.currentIndex > 0;

  const handleConfirmEnd = () => {
    setConfirmingEnd(false);
    onAction("end");
  };

  const forward = isLastPost ? (
    <Button variant="destructive" className="h-12 flex-1" disabled={isBusy} onClick={() => setConfirmingEnd(true)}>
      End session
    </Button>
  ) : (
    <Button
      variant={eventState.votingPaused ? "outline" : "default"}
      className="h-12 flex-1"
      disabled={isBusy}
      onClick={() => onAction("next")}
    >
      Next <ChevronRight />
    </Button>
  );

  return (
    <div className="relative h-full">
      <ControlsFrame
        badge={eventState.votingPaused ? "Paused" : "Live"}
        badgeTone={eventState.votingPaused ? "paused" : "live"}
        position={`${eventState.currentIndex + 1} of ${rooms.length}`}
        title={currentRoom?.topic ?? eventName}
        controls={
          <div className="space-y-2">
            {eventState.votingPaused && (
              <Button className="w-full h-12 text-base" disabled={isBusy} onClick={() => onAction("resume")}>
                Resume voting
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-12 flex-1"
                disabled={isBusy || !canGoBack}
                onClick={() => onAction("back")}
              >
                <ChevronLeft /> Back
              </Button>
              {!eventState.votingPaused && (
                <Button variant="outline" className="h-12 flex-1" disabled={isBusy} onClick={() => onAction("pause")}>
                  Pause
                </Button>
              )}
              {forward}
            </div>
          </div>
        }
      >
        <ControlsStats
          stats={[
            { value: String(eventState.peopleHere), label: "people here" },
            { value: String(eventState.finishedCurrentPost), label: "finished this one" },
          ]}
        />
        <EventPostList
          rooms={rooms}
          currentIndex={eventState.currentIndex}
          currentBadge={eventState.votingPaused ? "Paused" : "Live"}
        />
      </ControlsFrame>
      {confirmingEnd && (
        <EndSessionConfirm isBusy={isBusy} onConfirm={handleConfirmEnd} onCancel={() => setConfirmingEnd(false)} />
      )}
    </div>
  );
}
