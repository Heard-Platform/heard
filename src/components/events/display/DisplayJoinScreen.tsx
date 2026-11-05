import { formatJoinHeadcount } from "../../../utils/event-display";
import { DisplayCenteredScreen, DisplayQr } from "./DisplayParts";

interface DisplayJoinScreenProps {
  peopleHere: number;
  answeringQuestions: number;
  joinUrl: string;
  joinLabel: string;
}

export function DisplayJoinScreen({
  peopleHere,
  answeringQuestions,
  joinUrl,
  joinLabel,
}: DisplayJoinScreenProps) {
  const headcountText = formatJoinHeadcount(
    peopleHere,
    answeringQuestions,
  );
  return (
    <DisplayCenteredScreen>
      <h1 className="text-[5cqw] font-extrabold leading-[1.05] tracking-tight">Scan to join</h1>
      <DisplayQr joinUrl={joinUrl} className="w-[15cqw]" />
      <div className="fullscreen-subheader-text">
        <p>{joinLabel}</p>
        <p className="tabular-nums">{headcountText}</p>
      </div>
    </DisplayCenteredScreen>
  );
}
