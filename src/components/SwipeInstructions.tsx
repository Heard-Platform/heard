import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const DURATION = 5;
const times = [0, 0.1, 0.26, 0.4, 0.56, 0.66, 0.82, 0.92, 1];

const directions = [
  {
    side: "left" as const,
    color: "bg-red-500",
    labelKey: "swipeLeft",
    sublabelKey: "swipeToDisagree",
    opacity: [0, 0, 0, 0, 0, 0, 1, 1, 0],
  },
  {
    side: "right" as const,
    color: "bg-green-500",
    labelKey: "swipeRight",
    sublabelKey: "swipeToAgree",
    opacity: [0, 0, 1, 1, 0, 0, 0, 0, 0],
  },
];

export function SwipeInstructions() {
  const { t } = useTranslation("room");
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {directions.map(
        ({ side, color, labelKey, sublabelKey, opacity }) => (
          <motion.div
            key={side}
            style={{ position: "absolute", [side]: 12, top: "25%" }}
            className={`heard-row ${color} text-white font-black px-4 py-2 rounded-xl shadow-lg text-lg uppercase tracking-wide`}
            animate={{ opacity }}
            transition={{
              duration: DURATION,
              repeat: Infinity,
              times,
              ease: "easeInOut",
            }}
          >
            <span
              className={`flex flex-col leading-tight ${side === "right" ? "items-end" : ""}`}
            >
              <span>{t(labelKey)}</span>
              <span className="font-normal normal-case tracking-normal text-sm">
                {t(sublabelKey)}
              </span>
            </span>
          </motion.div>
        ),
      )}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "60%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <motion.div
          className="flex flex-col items-center gap-1"
          animate={{ x: [0, 0, 80, 80, 0, 0, -80, -80, 0] }}
          transition={{
            duration: DURATION,
            repeat: Infinity,
            times,
            ease: "easeInOut",
          }}
        >
          <span className="text-6xl select-none">👆</span>
        </motion.div>
      </div>
    </div>
  );
}
