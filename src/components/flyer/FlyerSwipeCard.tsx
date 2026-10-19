import { forwardRef, useImperativeHandle, useRef } from "react";
import { motion, useAnimate, useMotionValue, useTransform, type MotionValue, type PanInfo } from "motion/react";
import { User } from "lucide-react";
import type { Statement } from "../../types";
import { useFitText } from "../../hooks/useFitText";

export type SwipeVote = "agree" | "disagree" | "pass";

interface FlyerSwipeCardProps {
  statement: Statement;
  addedByHost: boolean;
  onDragStart: () => void;
  onSwiped: (vote: SwipeVote) => void;
}

// Lets a parent swipe the card from a button tap, with the same fly-off as a drag.
export interface FlyerSwipeCardHandle {
  swipe: (vote: SwipeVote) => void;
}

const SWIPE_DISTANCE = 100;
const SWIPE_VELOCITY = 500;
const FLY_OFF_DISTANCE = 600;
const STAMP_FADE_START = 20;

// A drag means one vote at a time: whichever of sideways or up is bigger.
function dragDirection(x: number, y: number): SwipeVote {
  if (Math.abs(x) >= -y) return x >= 0 ? "agree" : "disagree";
  return "pass";
}

function dragDistance(vote: SwipeVote, x: number, y: number): number {
  return vote === "pass" ? -y : Math.abs(x);
}

function voteFromDrag({ offset, velocity }: PanInfo): SwipeVote | null {
  const byOffset = dragDirection(offset.x, offset.y);
  if (dragDistance(byOffset, offset.x, offset.y) > SWIPE_DISTANCE) return byOffset;
  const byVelocity = dragDirection(velocity.x, velocity.y);
  if (dragDistance(byVelocity, velocity.x, velocity.y) > SWIPE_VELOCITY) return byVelocity;
  return null;
}

// Only the stamp for the current drag direction shows, fading in as the drag grows.
function useStampOpacity(x: MotionValue<number>, y: MotionValue<number>, vote: SwipeVote) {
  return useTransform([x, y], ([xValue, yValue]: number[]) => {
    if (dragDirection(xValue, yValue) !== vote) return 0;
    const distance = dragDistance(vote, xValue, yValue);
    return Math.min(1, Math.max(0, (distance - STAMP_FADE_START) / (SWIPE_DISTANCE - STAMP_FADE_START)));
  });
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
const STATEMENT_MAX_FONT_PX = 24;
const STATEMENT_MIN_FONT_PX = 12;

interface FlyerCardContentProps {
  statement: Statement;
  addedByHost: boolean;
}

export function FlyerCardContent({ statement, addedByHost = false }: FlyerCardContentProps) {
  // Long statements shrink to fit the card rather than growing it.
  const { ref, fontSize } = useFitText<HTMLParagraphElement>(
    statement.text,
    STATEMENT_MAX_FONT_PX,
    STATEMENT_MIN_FONT_PX,
  );

  return (
    <>
      <p
        ref={ref}
        className="min-h-0 flex-1 overflow-hidden font-extrabold leading-[1.15] tracking-tight text-[#1C1B1F]"
        style={{ fontSize }}
      >
        {statement.text}
      </p>

      <div className="mt-3 flex shrink-0 items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDE8DE]">
          <User className="h-4 w-4 text-[#6B6760]" />
        </div>
        <span className="text-sm font-medium text-[#6B6760]">
          {addedByHost ? "Added by host" : "Added by a participant"}
        </span>
      </div>
    </>
  );
}

interface FlyerStackedCardProps {
  statement: Statement;
  depth: number;
  addedByHost: boolean;
}

export function FlyerStackedCard({ statement, depth, addedByHost }: FlyerStackedCardProps) {
  return (
    <motion.div
      className={`${FLYER_CARD_CLASS} pointer-events-none`}
      style={{ boxShadow: FLYER_CARD_SHADOW, zIndex: STACK_POSES.length - depth }}
      initial={STACK_POSES[depth + 1] ?? STACK_POSES[depth]}
      animate={STACK_POSES[depth]}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <FlyerCardContent statement={statement} addedByHost={addedByHost} />
    </motion.div>
  );
}

export const FlyerSwipeCard = forwardRef<
  FlyerSwipeCardHandle,
  FlyerSwipeCardProps
>(function FlyerSwipeCard({ statement, onDragStart, onSwiped, addedByHost }, ref) {
  const [scope, animate] = useAnimate();
  const isFlyingOff = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const agreeOpacity = useStampOpacity(x, y, "agree");
  const disagreeOpacity = useStampOpacity(x, y, "disagree");
  const passOpacity = useStampOpacity(x, y, "pass");

  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const vote = voteFromDrag(info);
    if (!vote) {
      await animate(
        scope.current,
        { x: 0, y: 0 },
        { type: "spring", stiffness: 300, damping: 25 },
      );
      return;
    }
    await flyOff(vote);
  };

  const flyOff = async (vote: SwipeVote) => {
    if (isFlyingOff.current) return;
    isFlyingOff.current = true;
    await animate(
      scope.current,
      { ...FLY_OFF_TARGET[vote], opacity: 0 },
      { duration: 0.3, ease: "easeIn" },
    );
    onSwiped(vote);
  };

  useImperativeHandle(ref, () => ({ swipe: flyOff }));

  return (
    <motion.div
      ref={scope}
      className={`${FLYER_CARD_CLASS} cursor-grab active:cursor-grabbing`}
      style={{
        x,
        y,
        rotate,
        boxShadow: FLYER_CARD_SHADOW,
        zIndex: STACK_POSES.length,
      }}
      drag
      dragMomentum={false}
      initial={STACK_POSES[1]}
      animate={STACK_POSES[0]}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
    >
      <FlyerCardContent statement={statement} addedByHost={addedByHost} />

      <SwipeLabel
        text="AGREE"
        vote="agree"
        opacity={agreeOpacity}
        className="left-6 top-6 -rotate-12"
      />
      <SwipeLabel
        text="DISAGREE"
        vote="disagree"
        opacity={disagreeOpacity}
        className="right-6 top-6 rotate-12"
      />
      <SwipeLabel
        text="PASS"
        vote="pass"
        opacity={passOpacity}
        className="bottom-16 left-1/2 -translate-x-1/2"
      />
    </motion.div>
  );
});

interface SwipeLabelProps {
  text: string;
  vote: SwipeVote;
  opacity: MotionValue<number>;
  className: string;
}

function SwipeLabel({ text, vote, opacity, className }: SwipeLabelProps) {
  return (
    <motion.span
      className={`pointer-events-none absolute rounded-lg border-[3px] border-current px-2 py-0.5 text-lg font-black tracking-widest ${vote}-text ${className}`}
      style={{ opacity }}
    >
      {text}
    </motion.span>
  );
}
