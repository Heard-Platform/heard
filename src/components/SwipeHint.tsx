import { motion } from "motion/react";

const BOTH_SIDES_DURATION = 5;
const BOTH_SIDES_TIMES = [0, 0.1, 0.26, 0.4, 0.56, 0.66, 0.82, 0.92, 1];
const BOTH_SIDES_OPACITY: Record<"left" | "right", number[]> = {
  left: [0, 0, 0, 0, 0, 0, 1, 1, 0],
  right: [0, 0, 1, 1, 0, 0, 0, 0, 0],
};
const BOTH_SIDES_HAND_X = [0, 80, 80, 0, -80, -80, 0];

const SINGLE_SIDE_DURATION = 2.3;
const SINGLE_SIDE_TIMES = [0, 0.35, 0.65, 1];
const SINGLE_SIDE_OPACITY = [0, 1, 1, 0];
const SINGLE_SIDE_HAND_X: Record<"left" | "right", number[]> = {
  left: [0, -80, -80, 0],
  right: [0, 80, 80, 0],
};

interface SwipeHintSide {
  side: "left" | "right";
  color: string;
  label: string;
  sublabel: string;
}

interface SwipeHintProps {
  sides: SwipeHintSide[];
}

export function SwipeHint({ sides }: SwipeHintProps) {
  const isSingleSide = sides.length === 1;
  const duration = isSingleSide ? SINGLE_SIDE_DURATION : BOTH_SIDES_DURATION;
  const times = isSingleSide ? SINGLE_SIDE_TIMES : BOTH_SIDES_TIMES;
  const handX = isSingleSide
    ? SINGLE_SIDE_HAND_X[sides[0].side]
    : BOTH_SIDES_HAND_X;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {sides.map(({ side, color, label, sublabel }) => (
        <motion.div
          key={side}
          style={{ position: "absolute", [side]: 12, top: "70%" }}
          className={`heard-row ${color} font-black px-4 py-2 rounded-xl shadow-lg text-lg uppercase tracking-wide`}
          animate={{
            opacity: isSingleSide ? SINGLE_SIDE_OPACITY : BOTH_SIDES_OPACITY[side],
          }}
          transition={{
            duration,
            repeat: Infinity,
            times,
            ease: "easeInOut",
          }}
        >
          <span
            className={`flex flex-col leading-tight ${side === "right" ? "items-end" : ""}`}
          >
            <span>{label}</span>
            <span className="font-normal normal-case tracking-normal text-sm">
              {sublabel}
            </span>
          </span>
        </motion.div>
      ))}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "90%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <motion.div
          className="flex flex-col items-center gap-1"
          animate={{ x: handX }}
          transition={{
            duration,
            repeat: Infinity,
            times,
            ease: "easeInOut",
          }}
        >
          <span className="text-4xl select-none">👆</span>
        </motion.div>
      </div>
    </div>
  );
}
