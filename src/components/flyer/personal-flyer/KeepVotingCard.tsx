import { CARD_CLASS, COLORS } from "./personal-flyer-theme";

interface KeepVotingCardProps {
  title: string;
  onKeepVoting: () => void;
}

export function KeepVotingCard({ title, onKeepVoting }: KeepVotingCardProps) {
  return (
    <div className={CARD_CLASS}>
      <h2 className="text-lg font-bold leading-snug tracking-tight" style={{ color: COLORS.ink }}>
        {title}
      </h2>
      <button
        className="mt-4 w-full rounded-2xl py-3.5 text-base font-bold text-white"
        style={{ backgroundColor: COLORS.button }}
        onClick={onKeepVoting}
      >
        Keep voting
      </button>
      <p className="mt-3 text-center text-sm" style={{ color: COLORS.muted }}>
        Or close this. You're all set.
      </p>
    </div>
  );
}
