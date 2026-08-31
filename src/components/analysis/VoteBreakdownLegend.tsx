interface VoteBreakdownLegendProps {
  rawAgree: number;
  disagree: number;
  pass: number;
  didntVote: number;
  size: number;
}

export function VoteBreakdownLegend({
  rawAgree,
  disagree,
  pass,
  didntVote,
  size,
}: VoteBreakdownLegendProps) {
  const pct = (n: number) => (size > 0 ? Math.round((n / size) * 100) : 0);

  return (
    <div className="mt-1 text-xs tabular-nums whitespace-nowrap">
      <span className="agree-text">{pct(rawAgree)}%</span>{" "}
      <span className="disagree-text">{pct(disagree)}%</span>{" "}
      <span className="pass-text">{pct(pass)}%</span>{" "}
      <span className="text-muted-foreground">{pct(didntVote)}%</span>{" "}
      <span className="text-muted-foreground">({size})</span>
    </div>
  );
}
