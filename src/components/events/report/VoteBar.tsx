import "./report.css";

interface VoteBarProps {
  agreePercent: number;
  disagreePercent: number;
}

export function VoteBar({
  agreePercent,
  disagreePercent,
}: VoteBarProps) {
  return (
    <div className="report-bar-track flex h-2.5 overflow-hidden rounded-full">
      <div
        className="agree-bg"
        style={{ width: `${agreePercent}%` }}
      />
      <div
        className="disagree-bg"
        style={{ width: `${disagreePercent}%` }}
      />
    </div>
  );
}