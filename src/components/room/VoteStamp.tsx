import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import type { StampedVote } from "../../types";

export const VOTE_STAMP_DROP_DELAY_MS = 450;
export const VOTE_STAMP_LANDING_MS = 450;
export const VOTE_STAMP_HOLD_MS = 100;
export const VOTE_STAMP_TOTAL_MS =
  VOTE_STAMP_DROP_DELAY_MS +
  VOTE_STAMP_LANDING_MS +
  VOTE_STAMP_HOLD_MS;

const STAMP_STYLES: Record<
  StampedVote,
  { label: string; icon: typeof Check; rotateDegrees: number }
> = {
  agree: { label: "AGREE", icon: Check, rotateDegrees: -12 },
  disagree: { label: "DISAGREE", icon: X, rotateDegrees: 12 },
};

interface VoteStampProps {
  vote: StampedVote;
}

export function VoteStamp({ vote }: VoteStampProps) {
  const { label, icon: Icon, rotateDegrees } = STAMP_STYLES[vote];

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <motion.div
        className={`flex items-center gap-2 rounded-xl border-[6px] normal-bg px-5 py-2 shadow-lg ${vote}-text ${vote}-strong-border`}
        initial={{ scale: 3, opacity: 0, rotate: rotateDegrees * 2 }}
        animate={{ scale: 1, opacity: 1, rotate: rotateDegrees }}
        transition={{
          delay: VOTE_STAMP_DROP_DELAY_MS / 1000,
          duration: VOTE_STAMP_LANDING_MS / 1000,
          type: "spring",
          bounce: 0.35,
        }}
      >
        <Icon className="h-8 w-8" strokeWidth={3} aria-hidden />
        <span className="text-3xl font-black tracking-widest">
          {label}
        </span>
      </motion.div>
    </div>
  );
}
