import { AnimatePresence, motion, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { Star } from "lucide-react";

const RING_RADIUS = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface SuperChargeBadgeProps {
  side: "agree" | "disagree";
  charge: MotionValue<number>;
  armed: boolean;
  visible: boolean;
}

export function SuperChargeBadge({
  side,
  charge,
  armed,
  visible,
}: SuperChargeBadgeProps) {
  const dashOffset = useTransform(
    charge,
    (v) => RING_CIRCUMFERENCE * (1 - v),
  );
  const ringColor =
    side === "agree"
      ? "var(--color-strong-agree)"
      : "var(--color-strong-disagree)";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -6 }}
          transition={{ duration: 0.18 }}
          className="absolute top-6 left-1/2 flex flex-col items-center gap-1 pointer-events-none"
          style={{ x: "-50%" }}
        >
          <div className="relative w-12 h-12">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              className="-rotate-90"
            >
              <circle
                cx="24"
                cy="24"
                r={RING_RADIUS}
                fill="none"
                stroke="rgba(0,0,0,0.12)"
                strokeWidth="4"
              />
              <motion.circle
                cx="24"
                cy="24"
                r={RING_RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                style={{ strokeDashoffset: dashOffset }}
              />
            </svg>
            {armed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Star size={20} color={ringColor} fill={ringColor} />
              </div>
            )}
          </div>
          <div
            className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white whitespace-nowrap ${
              side === "agree" ? "strong-agree-bg" : "strong-disagree-bg"
            }`}
          >
            {armed
              ? side === "agree"
                ? "Release to Strong Agree"
                : "Release to Strong Disagree"
              : side === "agree"
              ? "Hold to Strong Agree"
              : "Hold to Strong Disagree"}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
