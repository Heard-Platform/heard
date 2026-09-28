import { useEffect, useState } from "react";
import { motion, useMotionValue, type Transition } from "motion/react";
import { CheckCircle, XCircle } from "lucide-react";
import type { DebateRoom, Statement } from "../../types";
import { getPastelColor } from "../../utils/colors";
import { StatementCard } from "../room/StatementCard";

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
  room: DebateRoom;
  vote: FlyerVote;
  totalStatements: number;
  onDismissed: () => void;
}

export function FlyerVoteIntroCard({
  statement,
  room,
  vote,
  totalStatements,
  onDismissed,
}: FlyerVoteIntroCardProps) {
  const [phase, setPhase] = useState<Phase>("stamp");
  const hiddenOpacity = useMotionValue(0);

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
      className="relative w-full pointer-events-none"
      initial={CARD_POSE.stamp[vote]}
      animate={CARD_POSE[phase][vote]}
      transition={CARD_TRANSITION[phase]}
      onAnimationComplete={() => phase === "leave" && onDismissed()}
    >
      <div className={`p-6 rounded-xl border-2 shadow-xl ${getPastelColor(statement.id)}`}>
        <StatementCard
          statement={statement}
          room={room}
          isTopCard={true}
          currentIndex={1}
          totalStatements={totalStatements}
          getTypeIcon={() => null}
          disagreeOpacity={hiddenOpacity}
          agreeOpacity={hiddenOpacity}
          superAgreeOpacity={hiddenOpacity}
          passOpacity={hiddenOpacity}
          onSuperAgree={() => {}}
          onSkip={() => {}}
          onFlag={() => {}}
        />
      </div>
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
        <Icon className="h-10 w-10" strokeWidth={3} />
        <span className="text-4xl font-black tracking-widest">{label}</span>
      </motion.div>
    </div>
  );
}
