import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Clock, Zap, AlertCircle } from "lucide-react";

interface RealtimeCountdownProps {
  endTime: number;
  onTimeUp?: () => void;
}

export function RealtimeCountdown({ endTime, onTimeUp }: RealtimeCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, endTime - Date.now()));
  const [hasCalledOnTimeUp, setHasCalledOnTimeUp] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);

      if (remaining === 0 && !hasCalledOnTimeUp) {
        setHasCalledOnTimeUp(true);
        if (onTimeUp) {
          onTimeUp();
        }
      }
    }, 100); // Update 10 times per second for smooth animation

    return () => clearInterval(interval);
  }, [endTime, onTimeUp, hasCalledOnTimeUp]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const milliseconds = Math.floor((timeLeft % 1000) / 10);

  // Calculate percentage remaining (assume 5 minute default if we can't determine)
  const estimatedTotal = 5 * 60 * 1000; // 5 minutes in ms
  const percentRemaining = Math.min(100, (timeLeft / estimatedTotal) * 100);

  const isUrgent = timeLeft < 60000; // Less than 1 minute
  const isCritical = timeLeft < 30000; // Less than 30 seconds

  if (timeLeft === 0) {
    return (
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full border-2 border-red-600"
      >
        <div className="flex items-center justify-center gap-2 text-white">
          <AlertCircle className="w-4 h-4 animate-pulse" />
          <span className="font-bold text-sm">TIME'S UP! 🎉</span>
          <AlertCircle className="w-4 h-4 animate-pulse" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`px-3 py-1.5 rounded-full border-2 transition-colors ${
        isCritical
          ? "bg-gradient-to-r from-red-500 to-orange-500 border-red-600 animate-pulse"
          : isUrgent
          ? "bg-gradient-to-r from-orange-400 to-yellow-400 border-orange-600"
          : "bg-gradient-to-r from-blue-500 to-purple-500 border-blue-600"
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Icon */}
        <motion.div
          animate={isCritical ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0, repeatDelay: 0.5 }}
        >
          {isCritical ? (
            <Zap className="w-4 h-4 text-white" fill="white" />
          ) : (
            <Clock className="w-4 h-4 text-white" />
          )}
        </motion.div>

        {/* Time display */}
        <div className="flex items-baseline gap-0.5">
          <motion.span
            key={minutes}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-sm font-mono font-bold text-white leading-none"
          >
            {String(minutes).padStart(2, "0")}
          </motion.span>
          <span className="text-white/80 text-sm leading-none">:</span>
          <motion.span
            key={seconds}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-sm font-mono font-bold text-white leading-none"
          >
            {String(seconds).padStart(2, "0")}
          </motion.span>
          {isCritical && (
            <>
              <span className="text-white/80 text-xs leading-none">.</span>
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-xs font-mono text-white/90 leading-none"
              >
                {String(milliseconds).padStart(2, "0")}
              </motion.span>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 w-24 bg-white/30 rounded-full overflow-hidden">
          <motion.div
            className={`absolute top-0 left-0 h-full rounded-full ${
              isCritical
                ? "bg-white"
                : isUrgent
                ? "bg-yellow-200"
                : "bg-white"
            }`}
            initial={{ width: "100%" }}
            animate={{ width: `${percentRemaining}%` }}
            transition={{ duration: 0.1 }}
          />
          {isCritical && (
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: "50%" }}
            />
          )}
        </div>

        {/* Label */}
        <div className="text-xs text-white font-medium whitespace-nowrap leading-none">
          {isCritical ? "HURRY!" : isUrgent ? "Almost done" : "Time left"}
        </div>
      </div>
    </motion.div>
  );
}
