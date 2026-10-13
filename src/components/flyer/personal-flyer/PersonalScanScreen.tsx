import { Check } from "lucide-react";
import type { EmailOtpFlow } from "../../../hooks/useEmailOtpFlow";
import type { FlyerVote } from "../FlyerVoteIntroCard";
import { FounderAvatar } from "./FounderAvatar";
import { KeepVotingCard } from "./KeepVotingCard";
import { PersonalEmailCard } from "./PersonalEmailCard";
import { PersonalFlyerHeader } from "./PersonalFlyerHeader";
import { useRiseIn } from "./use-rise-in";
import { COLORS, HEADLINE_CLASS } from "./personal-flyer-theme";

const VOTE_LABELS: Record<FlyerVote, string> = { agree: "Agree", disagree: "Disagree" };

interface PersonalScanScreenProps {
  vote: FlyerVote;
  neighborCount: number;
  /** True when the viewer already has an account email, so we skip asking for it. */
  isSignedIn: boolean;
  emailFlow: EmailOtpFlow;
  onWhoDis: () => void;
  onKeepVoting: () => void;
}

export function PersonalScanScreen({
  vote,
  neighborCount,
  isSignedIn,
  emailFlow,
  onWhoDis,
  onKeepVoting,
}: PersonalScanScreenProps) {
  const riseIn = useRiseIn();

  return (
    <div className="heard-feed-bg flex min-h-full flex-col px-7 pb-7 pt-8">
      <PersonalFlyerHeader />

      <div className="mt-6" style={riseIn(0)}>
        <VoteCountedChip vote={vote} />
      </div>

      <div className="mt-3 flex items-start justify-between gap-2" style={riseIn(100)}>
        <h1 className={`${HEADLINE_CLASS} text-[34px]`} style={{ color: COLORS.ink }}>
          Thanks for scanning my flyer!
        </h1>
        <button className="flex shrink-0 flex-col items-center" onClick={onWhoDis}>
          <FounderAvatar sizePx={92} />
          <span className="mt-0.5 translate-x-1 text-sm" style={{ color: COLORS.ink }}>
            who dis
          </span>
        </button>
      </div>

      <p className="mt-3 text-base leading-relaxed" style={{ color: COLORS.body, ...riseIn(200) }}>
        You just entered a world of civic delight, along with{" "}
        <strong style={{ color: COLORS.ink }}>{neighborCount.toLocaleString()}</strong> of your neighbors.
      </p>

      <div className="mt-auto pt-8" style={riseIn(350)}>
        {isSignedIn ? (
          <KeepVotingCard
            title="You're logged in, so the results are headed to your inbox."
            onKeepVoting={onKeepVoting}
          />
        ) : (
          <PersonalEmailCard emailFlow={emailFlow} />
        )}
      </div>
    </div>
  );
}

function VoteCountedChip({ vote }: { vote: FlyerVote }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
      style={{ backgroundColor: COLORS.chipFill, color: COLORS.chipText }}
    >
      <Check className="h-3.5 w-3.5" />
      Vote counted: <strong className="font-bold">{VOTE_LABELS[vote]}</strong>
    </span>
  );
}
