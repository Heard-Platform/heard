import { motion } from "motion/react";
import { X } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { formatSubHeardDisplay } from "../utils/subheard";

const ENTER_DELAY = 1;

interface NextRoomNudgeProps {
  topic: string;
  visible: boolean;
  animate: boolean;
  subHeard?: string;
  onDismiss: () => void;
  onClick: () => void;
}

export function NextRoomNudge({ topic, visible, animate, subHeard, onDismiss, onClick }: NextRoomNudgeProps) {
  const { t } = useTranslation("room");
  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.85 }}
      animate={
        visible
          ? { opacity: 1, y: animate ? [0, -6, 0] : 0, scale: 1 }
          : { opacity: 0, y: 20, scale: 0.85 }
      }
      transition={
        visible
          ? {
              opacity: { duration: 0.4, delay: ENTER_DELAY },
              scale: { duration: 0.4, delay: ENTER_DELAY },
              y: animate
                ? {
                    delay: ENTER_DELAY + 0.4,
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                : { duration: 0.3 },
            }
          : { duration: 0.25 }
      }
      onClick={onClick}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-row items-center gap-1 pl-2 pr-4 py-2.5 rounded-full shadow-lg text-white select-none overflow-hidden"
      style={{
        width: "calc(100% - 2rem)",
        maxWidth: "calc(var(--room-card-max-width) - 2rem)",
        zIndex: 450,
        background:
          "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)",
        boxShadow:
          "0 4px 24px 0 rgba(168,85,247,0.45), 0 2px 8px 0 rgba(0,0,0,0.18)",
        pointerEvents: "auto",
      }}
    >
      <span className="text-xl leading-none shrink-0">👇</span>
      <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
        <span className="text-xs opacity-75 font-medium leading-none">
          {subHeard ? (
            <Trans
              t={t}
              i18nKey="nudgeNextPostIn"
              values={{ name: formatSubHeardDisplay(subHeard) }}
              components={{ sub: <span className="opacity-100 font-bold tracking-wide" /> }}
            />
          ) : (
            t("nudgeNextPost")
          )}
        </span>
        <span className="w-full truncate text-sm font-semibold leading-snug text-left">
          {topic}
        </span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="shrink-0 ml-1 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label={t("nudgeDismiss")}
      >
        <X className="w-3.5 h-3.5 opacity-70" />
      </button>
    </motion.button>
  );
}
