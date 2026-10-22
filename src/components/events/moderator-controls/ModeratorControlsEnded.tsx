import { ControlsFrame, ControlsStats } from "./ControlsFrame";
import type { EventTotals } from "../../../types";

export interface ModeratorControlsEndedProps {
  eventName: string;
  postCount: number;
  totals: EventTotals;
}

export function ModeratorControlsEnded({ eventName, postCount, totals }: ModeratorControlsEndedProps) {
  return (
    <ControlsFrame badge="Ended" badgeTone="neutral" position={`${postCount} of ${postCount}`} title={eventName}>
      <ControlsStats
        stats={[
          { value: totals.people.toLocaleString(), label: "people" },
          { value: totals.votes.toLocaleString(), label: "votes" },
          { value: totals.statementsFromRoom.toLocaleString(), label: "from the room" },
          { value: `${totals.stayedToEndPercent}%`, label: "stayed to the end" },
        ]}
      />
    </ControlsFrame>
  );
}
