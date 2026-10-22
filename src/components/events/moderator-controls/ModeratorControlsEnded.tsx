import { ControlsFrame, ControlsStats } from "./ControlsFrame";
import type { LiveSessionSummary } from "../../../types";

export interface ModeratorControlsEndedProps {
  eventName: string;
  postCount: number;
  summary: LiveSessionSummary;
}

export function ModeratorControlsEnded({ eventName, postCount, summary }: ModeratorControlsEndedProps) {
  return (
    <ControlsFrame badge="Ended" badgeTone="neutral" position={`${postCount} of ${postCount}`} title={eventName}>
      <ControlsStats
        stats={[
          { value: summary.people.toLocaleString(), label: "people" },
          { value: summary.votes.toLocaleString(), label: "votes" },
          { value: summary.statementsFromRoom.toLocaleString(), label: "from the room" },
          { value: `${summary.stayedToEndPercent}%`, label: "stayed to the end" },
        ]}
      />
    </ControlsFrame>
  );
}
