import { motion } from "framer-motion";

export function SwipeInstructions({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`text-center text-xs font-semibold ${className}`}
      animate={{
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <span className="text-red-600">←</span>
      <span className="text-foreground mx-2">Swipe left to disagree, right to agree</span>
      <span className="text-green-600">→</span>
    </motion.div>
  );
}