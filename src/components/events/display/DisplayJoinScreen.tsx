import { DisplayCenteredScreen, DisplayQr } from "./DisplayParts";

interface DisplayJoinScreenProps {
  peopleHere: number;
  joinUrl: string;
  joinLabel: string;
}

export function DisplayJoinScreen({ peopleHere, joinUrl, joinLabel }: DisplayJoinScreenProps) {
  return (
    <DisplayCenteredScreen>
      <h1 className="text-[5cqw] font-extrabold leading-[1.05] tracking-tight">Scan to join</h1>
      <DisplayQr joinUrl={joinUrl} className="w-[15cqw]" />
      <p className="text-[1.8cqw] font-semibold secondary-text tabular-nums">
        {joinLabel} · {peopleHere} {peopleHere === 1 ? "person" : "people"} here
      </p>
    </DisplayCenteredScreen>
  );
}
