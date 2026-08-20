import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  FEED_CARD_INACTIVE_SCALE,
  FEED_CARD_INACTIVE_OPACITY,
  FEED_CARD_TRANSITION_DURATION,
} from "../utils/constants/general";

interface FeedCardMotionProps {
  isActive: boolean;
  children: ReactNode;
}

export function FeedCardMotion({ isActive, children }: FeedCardMotionProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: isActive ? 1 : FEED_CARD_INACTIVE_SCALE,
        opacity: isActive ? 1 : FEED_CARD_INACTIVE_OPACITY,
      }}
      transition={{ duration: FEED_CARD_TRANSITION_DURATION }}
      className="w-full"
      style={{ maxWidth: "var(--room-card-max-width)" }}
    >
      {children}
    </motion.div>
  );
}
