import { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

interface TalkBubbleProps {
  text: ReactNode;
  isVisible: boolean;
  color?: string;
  borderColor?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function TalkBubble({
  text,
  isVisible,
  color = "text-purple-600",
  borderColor = "border-purple-200",
  position = "top",
}: TalkBubbleProps) {
  const positionClasses = {
    top: "-top-8 left-1/2 -translate-x-1/2",
    bottom: "-bottom-8 left-1/2 -translate-x-1/2",
    left: "left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-2",
    right: "right-0 top-1/2 -translate-y-1/2 translate-x-full ml-2",
  };

  const tailClasses = {
    top: "-bottom-1 left-1/2 -translate-x-1/2 border-r-2 border-b-2 rotate-45",
    bottom: "-top-1 left-1/2 -translate-x-1/2 border-l-2 border-t-2 rotate-45",
    left: "-right-1 top-1/2 -translate-y-1/2 border-t-2 border-r-2 rotate-45",
    right: "-left-1 top-1/2 -translate-y-1/2 border-b-2 border-l-2 rotate-45",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className={`absolute ${positionClasses[position]} bg-white px-4 py-2 rounded-full shadow-lg border-2 ${borderColor}`}
        >
          <span className={`${color} whitespace-nowrap`}>{text}</span>
          <div
            className={`absolute w-3 h-3 bg-white ${borderColor} ${tailClasses[position]}`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
