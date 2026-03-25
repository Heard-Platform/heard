import { motion } from "framer-motion";

const DURATION = 5;
const times = [0, 0.1, 0.26, 0.4, 0.56, 0.66, 0.82, 0.92, 1];

export function SwipeInstructions() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", pointerEvents: "none" }}>
      <motion.div
        style={{ position: "absolute", left: 12, top: "25%" }}
        className="heard-row bg-red-500 text-white font-black px-4 py-2 rounded-xl shadow-lg text-lg uppercase tracking-wide"
        animate={{ opacity: [0, 0, 0, 0, 0, 0, 1, 1, 0] }}
        transition={{ duration: DURATION, repeat: Infinity, times, ease: "easeInOut" }}
      >
        <span className="text-2xl">←</span>
        Disagree
      </motion.div>

      <motion.div
        style={{ position: "absolute", right: 12, top: "25%" }}
        className="heard-row bg-green-500 text-white font-black px-4 py-2 rounded-xl shadow-lg text-lg uppercase tracking-wide"
        animate={{ opacity: [0, 0, 1, 1, 0, 0, 0, 0, 0] }}
        transition={{ duration: DURATION, repeat: Infinity, times, ease: "easeInOut" }}
      >
        Agree
        <span className="text-2xl">→</span>
      </motion.div>

      <div style={{ position: "absolute", left: "50%", top: "60%", transform: "translate(-50%, -50%)" }}>
      <motion.div
        className="flex flex-col items-center gap-1"
        animate={{ x: [0, 0, 80, 80, 0, 0, -80, -80, 0] }}
        transition={{ duration: DURATION, repeat: Infinity, times, ease: "easeInOut" }}
      >
        <span className="text-6xl select-none">👆</span>
        <motion.span
          className="text-base font-bold uppercase tracking-widest text-foreground bg-background px-3 py-1 rounded-full shadow"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          swipe
        </motion.span>
      </motion.div>
      </div>
    </div>
  );
}
