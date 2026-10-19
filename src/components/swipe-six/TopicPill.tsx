import { forwardRef } from "react";
import { motion } from "motion/react";
import type { DebateRoom } from "../../types";

// Pastel pill backgrounds, cycled per topic so back-to-back topics never share a color.
const TOPIC_PILL_COLORS = ["bg-amber-100", "bg-sky-100", "bg-rose-100", "bg-emerald-100", "bg-violet-100"];

export const topicPillColor = (topicIndex: number) => TOPIC_PILL_COLORS[topicIndex % TOPIC_PILL_COLORS.length];

interface TopicPillProps {
  room: DebateRoom;
  colorClass: string;
  clamped?: boolean;
}

export const TopicPill = forwardRef<HTMLDivElement, TopicPillProps>(function TopicPill(
  { room, colorClass, clamped = false },
  ref,
) {
  const { emoji, topic, subHeard } = room;
  return (
    <motion.div
      ref={ref}
      className={`rounded-xl px-3 py-2 ${colorClass}`}
      initial={{ x: "110%" }}
      animate={{ x: 0 }}
      exit={{ x: "-110%" }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      <p className={`text-sm font-semibold leading-snug text-foreground ${clamped ? "line-clamp-2" : ""}`}>
        {emoji && <span className="mr-1">{emoji}</span>}
        {topic}
        {subHeard && <span className="font-medium secondary-text"> · {subHeard}</span>}
      </p>
    </motion.div>
  );
});
