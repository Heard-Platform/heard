import type { EventTotals } from "../../../types";
import { DisplayCenteredScreen } from "./DisplayParts";

interface DisplayEndCardProps {
  totals: EventTotals | null;
}

export function DisplayEndCard({ totals }: DisplayEndCardProps) {
  return (
    <DisplayCenteredScreen>
      <h1 className="text-[5cqw] font-extrabold leading-[1.05] tracking-tight">Thank you.</h1>
      {totals && (
        <div className="flex gap-[4cqw]">
          <EndStat value={totals.people} label="people" />
          <EndStat value={totals.votes} label="votes" />
          <EndStat value={totals.statementsFromRoom} label="statements from the room" />
        </div>
      )}
      <p className="text-[1.8cqw] font-semibold secondary-text">Run Heard at your next event · heard.vote</p>
    </DisplayCenteredScreen>
  );
}

function EndStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-[4cqw] font-extrabold leading-none tabular-nums">{value.toLocaleString()}</p>
      <p className="mt-[0.4cqw] text-[1.4cqw] font-semibold secondary-text">{label}</p>
    </div>
  );
}
