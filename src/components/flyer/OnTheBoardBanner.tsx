interface OnTheBoardBannerProps {
  remainingVotes: number;
}

export function OnTheBoardBanner({ remainingVotes }: OnTheBoardBannerProps) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ backgroundColor: "#1c1a2b", boxShadow: "0 6px 18px rgba(0, 0, 0, 0.2)" }}
    >
      <p className="text-base font-extrabold tracking-tight text-white">You're on the board.</p>
      <p className="text-sm text-white/80">
        {remainingVotes} more votes and we'll show you your people
      </p>
    </div>
  );
}
