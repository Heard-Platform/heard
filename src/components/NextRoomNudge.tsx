import { motion } from "motion/react";

const ENTER_DELAY = 1;

interface NextRoomNudgeProps {
  topic: string;
  visible: boolean;
  onClick: () => void;
}

export function NextRoomNudge({ topic, visible, onClick }: NextRoomNudgeProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.85 }}
      animate={
        visible
          ? { opacity: 1, y: [0, -6, 0], scale: 1 }
          : { opacity: 0, y: 20, scale: 0.85 }
      }
      transition={
        visible
          ? {
              opacity: { duration: 0.4, delay: ENTER_DELAY },
              scale: { duration: 0.4, delay: ENTER_DELAY },
              y: {
                delay: ENTER_DELAY + 0.4,
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }
          : { duration: 0.25 }
      }
      onClick={onClick}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-row items-center gap-1 px-2 py-2.5 rounded-full shadow-lg text-white select-none overflow-hidden"
      style={{
        width: "calc(100% - 2rem)",
        maxWidth: "calc(var(--room-card-max-width) - 2rem)",
        zIndex: 450,
        background:
          "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)",
        boxShadow:
          "0 4px 24px 0 rgba(168,85,247,0.45), 0 2px 8px 0 rgba(0,0,0,0.18)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <span className="text-xl leading-none shrink-0">👇</span>
      <div className="flex flex-col items-start gap-0.5 min-w-0">
        <span className="text-xs opacity-75 font-medium leading-none">next post</span>
        <span className="w-full truncate text-sm font-semibold leading-snug">{topic}</span>
      </div>
    </motion.button>
  );
}
