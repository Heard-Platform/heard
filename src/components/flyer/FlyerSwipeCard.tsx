import { motion, useAnimate, useMotionValue, useTransform, type MotionValue, type PanInfo } from "motion/react";
import { User } from "lucide-react";
import type { Statement } from "../../types";

export type SwipeVote = "agree" | "disagree" | "pass";

interface FlyerSwipeCardProps {
  statement: Statement;
  onDragStart: () => void;
  onSwiped: (vote: SwipeVote) => void;
}

const SWIPE_DISTANCE = 100;
const SWIPE_VELOCITY = 500;
const FLY_OFF_DISTANCE = 600;

function voteFromDrag({ offset, velocity }: PanInfo): SwipeVote | null {
  if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) return "agree";
  if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) return "disagree";
  if (offset.y < -SWIPE_DISTANCE || velocity.y < -SWIPE_VELOCITY) return "pass";
  return null;
}

const FLY_OFF_TARGET: Record<SwipeVote, { x: number; y: number }> = {
  agree: { x: FLY_OFF_DISTANCE, y: 0 },
  disagree: { x: -FLY_OFF_DISTANCE, y: 0 },
  pass: { x: 0, y: -FLY_OFF_DISTANCE },
};

export const FLYER_CARD_CLASS = "absolute inset-0 flex flex-col rounded-3xl bg-white p-6";
export const FLYER_CARD_SHADOW = "0 12px 32px rgba(28, 27, 31, 0.12)";
export const STACK_POSES = [
  { scale: 1, y: 0 },
  { scale: 0.95, y: 14 },
  { scale: 0.9, y: 28 },
];
export const STACK_PEEK_PX = STACK_POSES[STACK_POSES.length - 1].y;

export function FlyerCardContent({ statement }: { statement: Statement }) {
  return (
    <>
      <p className="text-[24px] font-extrabold leading-[1.15] tracking-tight text-[#1C1B1F]">
        {statement.text}
      </p>

      <div className="mt-auto flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDE8DE]">
          <User className="h-4 w-4 text-[#6B6760]" />
        </div>
        <span className="text-sm font-medium text-[#6B6760]">Added by a participant</span>
      </div>
    </>
  );
}

export function FlyerStackedCard({ statement, depth }: { statement: Statement; depth: number }) {
  return (
    <motion.div
      className={`${FLYER_CARD_CLASS} pointer-events-none`}
      style={{ boxShadow: FLYER_CARD_SHADOW, zIndex: STACK_POSES.length - depth }}
      initial={STACK_POSES[depth + 1] ?? STACK_POSES[depth]}
      animate={STACK_POSES[depth]}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <FlyerCardContent statement={statement} />
    </motion.div>
  );
}

export function FlyerSwipeCard({ statement, onDragStart, onSwiped }: FlyerSwipeCardProps) {
  const [scope, animate] = useAnimate();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const agreeOpacity = useTransform(x, [20, SWIPE_DISTANCE], [0, 1]);
  const disagreeOpacity = useTransform(x, [-SWIPE_DISTANCE, -20], [1, 0]);
  const passOpacity = useTransform(y, [-SWIPE_DISTANCE, -20], [1, 0]);

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const vote = voteFromDrag(info);
    if (!vote) {
      await animate(scope.current, { x: 0, y: 0 }, { type: "spring", stiffness: 300, damping: 25 });
      return;
    }
    await animate(scope.current, { ...FLY_OFF_TARGET[vote], opacity: 0 }, { duration: 0.3, ease: "easeIn" });
    onSwiped(vote);
  };

  return (
    <motion.div
      ref={scope}
      className={`${FLYER_CARD_CLASS} cursor-grab active:cursor-grabbing`}
      style={{ x, y, rotate, boxShadow: FLYER_CARD_SHADOW, zIndex: STACK_POSES.length }}
      drag
      dragMomentum={false}
      initial={STACK_POSES[1]}
      animate={STACK_POSES[0]}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
    >
      <FlyerCardContent statement={statement} />

      <SwipeLabel text="AGREE" color="#16A34A" opacity={agreeOpacity} className="left-6 top-6 -rotate-12" />
      <SwipeLabel text="DISAGREE" color="#DC2626" opacity={disagreeOpacity} className="right-6 top-6 rotate-12" />
      <SwipeLabel text="PASS" color="#6B6760" opacity={passOpacity} className="bottom-16 left-1/2 -translate-x-1/2" />
    </motion.div>
  );
}

interface SwipeLabelProps {
  text: string;
  color: string;
  opacity: MotionValue<number>;
  className: string;
}

function SwipeLabel({ text, color, opacity, className }: SwipeLabelProps) {
  return (
    <motion.span
      className={`pointer-events-none absolute rounded-lg border-[3px] px-2 py-0.5 text-lg font-black tracking-widest ${className}`}
      style={{ opacity, color, borderColor: color }}
    >
      {text}
    </motion.span>
  );
}
