import { CtaButton } from "../../widgets/CtaButton";
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
      <CtaButton className="mt-4" onClick={onKeepVoting}>
        Keep voting
      </CtaButton>
      <p className="mt-3 text-center text-sm" style={{ color: COLORS.muted }}>
        Or close this. You're all set.
      </p>
    </div>
  );
}
