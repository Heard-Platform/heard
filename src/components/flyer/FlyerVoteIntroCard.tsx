import { useEffect, useState } from "react";
import { motion, type Transition } from "motion/react";
import { CheckCircle, XCircle } from "lucide-react";
import type { Statement } from "../../types";
import { FLYER_CARD_CLASS, FLYER_CARD_SHADOW, FlyerCardContent, STACK_POSES } from "./FlyerSwipeCard";

export type FlyerVote = "agree" | "disagree";

type Phase = "stamp" | "tilt" | "leave";

const START_DELAY_MS = 500;
const STAMP_DROP_DELAY_MS = 250;
const STAMP_HOLD_MS = 1200;
const TILT_HOLD_MS = 300;

const CARD_POSE: Record<Phase, Record<FlyerVote, { x: number; rotate: number; opacity: number }>> = {
  stamp: {
    agree: { x: 0, rotate: 0, opacity: 1 },
    disagree: { x: 0, rotate: 0, opacity: 1 },
  },
  tilt: {
    agree: { x: 60, rotate: 8, opacity: 1 },
    disagree: { x: -60, rotate: -8, opacity: 1 },
  },
  leave: {
    agree: { x: 500, rotate: 45, opacity: 0 },
    disagree: { x: -500, rotate: -45, opacity: 0 },
  },
};

const CARD_TRANSITION: Record<Phase, Transition> = {
  stamp: { duration: 0 },
  tilt: { type: "spring", stiffness: 150, damping: 18 },
  leave: { duration: 0.4, ease: "easeIn" },
};

const STAMP_STYLE = {
  agree: { label: "AGREE", Icon: CheckCircle, color: "text-green-600 border-green-600", rotate: -12 },
  disagree: { label: "DISAGREE", Icon: XCircle, color: "text-red-600 border-red-600", rotate: 12 },
};

interface FlyerVoteIntroCardProps {
  statement: Statement;
  vote: FlyerVote;
  onDismissed: () => void;
}

export function FlyerVoteIntroCard({
  statement,
  vote,
  onDismissed,
}: FlyerVoteIntroCardProps) {
  const [phase, setPhase] = useState<Phase>("stamp");

  useEffect(() => {
    const tiltTimeout = setTimeout(() => setPhase("tilt"), START_DELAY_MS + STAMP_HOLD_MS);
    const leaveTimeout = setTimeout(
      () => setPhase("leave"),
      START_DELAY_MS + STAMP_HOLD_MS + TILT_HOLD_MS,
    );
    return () => {
      clearTimeout(tiltTimeout);
      clearTimeout(leaveTimeout);
    };
  }, []);

  return (
    <motion.div
      className={`${FLYER_CARD_CLASS} pointer-events-none`}
      style={{ boxShadow: FLYER_CARD_SHADOW, zIndex: STACK_POSES.length }}
      initial={CARD_POSE.stamp[vote]}
      animate={CARD_POSE[phase][vote]}
      transition={CARD_TRANSITION[phase]}
      onAnimationComplete={() => phase === "leave" && onDismissed()}
    >
      <FlyerCardContent statement={statement} />
      <FlyerVoteStamp vote={vote} />
    </motion.div>
  );
}

function FlyerVoteStamp({ vote }: { vote: FlyerVote }) {
  const { label, Icon, color, rotate } = STAMP_STYLE[vote];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        className={`flex items-center gap-2 rounded-xl border-[6px] bg-white/80 px-5 py-2 shadow-lg ${color}`}
        initial={{ scale: 3, opacity: 0, rotate: rotate * 2 }}
        animate={{ scale: 1, opacity: 1, rotate }}
        transition={{ delay: (START_DELAY_MS + STAMP_DROP_DELAY_MS) / 1000, type: "spring", stiffness: 300, damping: 18, mass: 1 }}
      >
        <Icon className="h-8 w-8" strokeWidth={3} />
        <span className="text-3xl font-black tracking-widest">{label}</span>
      </motion.div>
    </div>
  );
}
