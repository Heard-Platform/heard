import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface DebateTimerProps {
  duration: number;
  onTimeUp: () => void;
  isActive: boolean;
  phaseStartTime?: number; // Server timestamp when phase started
}

export function DebateTimer({
  duration,
  onTimeUp,
  isActive,
  phaseStartTime,
}: DebateTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) return;

    const calculateTimeLeft = () => {
      if (phaseStartTime) {
        // Calculate based on server timestamp
        const elapsed = Math.floor(
          (Date.now() - phaseStartTime) / 1000,
        );
        const remaining = Math.max(0, duration - elapsed);
        return remaining;
      } else {
        // Fallback to local countdown if no server timestamp
        return duration;
      }
    };

    // Set initial time left
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, onTimeUp, isActive, phaseStartTime]);

  const progress = (timeLeft / duration) * 100;
  const isUrgent = timeLeft <= 10;

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
      transition={{
        repeat: isUrgent ? Infinity : 0,
        duration: 0.5,
      }}
    >
      <div className="bg-muted rounded-full h-4 overflow-hidden">
        <motion.div
          className={`h-full transition-colors duration-300 ${
            isUrgent ? "bg-destructive" : "bg-primary"
          }`}
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="text-center mt-2">
        <span
          className={`font-mono ${isUrgent ? "text-destructive" : "text-foreground"}`}
        >
          {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </span>
      </div>
    </motion.div>
  );
}