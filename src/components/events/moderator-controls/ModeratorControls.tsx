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
  live: LiveEventView;
  isBusy: boolean;
  onAction: (action: ModeratorAction) => void;
}

export function ModeratorControls({ eventName, rooms, live, isBusy, onAction }: ModeratorControlsProps) {
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const phase = getControlsPhase(live.status, live.currentIndex, rooms.length);

  if (phase === "not-started" || live.currentIndex === null) {
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
            { value: String(live.peopleHere), label: "people here" },
            { value: String(rooms.length), label: rooms.length === 1 ? "question" : "questions" },
          ]}
        />
        <EventPostList rooms={rooms} currentIndex={null} currentBadge="Live" />
      </ControlsFrame>
    );
  }

  const currentRoom = rooms[live.currentIndex];
  const isLastPost = phase === "last-post";
  const canGoBack = live.currentIndex > 0;

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
      variant={live.votingPaused ? "outline" : "default"}
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
        badge={live.votingPaused ? "Paused" : "Live"}
        badgeTone={live.votingPaused ? "paused" : "live"}
        position={`${live.currentIndex + 1} of ${rooms.length}`}
        title={currentRoom?.topic ?? eventName}
        controls={
          <div className="space-y-2">
            {live.votingPaused && (
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
              {!live.votingPaused && (
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
            { value: String(live.peopleHere), label: "people here" },
            { value: String(live.finishedCurrentPost), label: "finished this one" },
          ]}
        />
        <EventPostList
          rooms={rooms}
          currentIndex={live.currentIndex}
          currentBadge={live.votingPaused ? "Paused" : "Live"}
        />
      </ControlsFrame>
      {confirmingEnd && (
        <EndSessionConfirm isBusy={isBusy} onConfirm={handleConfirmEnd} onCancel={() => setConfirmingEnd(false)} />
      )}
    </div>
  );
}
