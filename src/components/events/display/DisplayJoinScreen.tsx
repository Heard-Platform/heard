import { formatJoinHeadcount } from "../../../utils/event-display";
import { DisplayHeadline, DisplayCenteredScreen, DisplayQr } from "./DisplayParts";

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
      <DisplayHeadline>Scan to join</DisplayHeadline>
      <DisplayQr joinUrl={joinUrl} className="w-[15cqw]" />
      <div className="fullscreen-subheader-text">
        <p>{joinLabel}</p>
        <p className="tabular-nums">{headcountText}</p>
      </div>
    </DisplayCenteredScreen>
  );
}
