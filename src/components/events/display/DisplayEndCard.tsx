import { ExternalLink } from "lucide-react";
import type { EventTotals } from "../../../types";
import { Button } from "../../ui/button";
import { DisplayHeadline, DisplayCenteredScreen } from "./DisplayParts";

interface DisplayEndCardProps {
  totals: EventTotals | null;
  reportUrl: string;
}

export function DisplayEndCard({
  totals,
  reportUrl,
}: DisplayEndCardProps) {
  return (
    <DisplayCenteredScreen>
      <DisplayHeadline>Thank you.</DisplayHeadline>
      {totals && (
        <div className="flex gap-[4cqw]">
          <EndStat value={totals.people} label="people" />
          <EndStat value={totals.votes} label="votes" />
          <EndStat value={totals.statementsFromRoom} label="statements from the room" />
        </div>
      )}
      <p className="fullscreen-subheader-text">Run Heard at your next event · heard.vote</p>
      <Button asChild variant="outline" className="font-semibold">
        <a href={reportUrl} target="_blank" rel="noreferrer">
          See the event results <ExternalLink />
        </a>
      </Button>
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
