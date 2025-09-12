import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface DebateTimerProps {
  duration: number;
  onTimeUp: () => void;
  isActive: boolean;
}

export function DebateTimer({ duration, onTimeUp, isActive }: DebateTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) return;
    
    setTimeLeft(duration);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, onTimeUp, isActive]);

  const progress = (timeLeft / duration) * 100;
  const isUrgent = timeLeft <= 10;

  return (
    <motion.div 
      className="relative w-full max-w-md mx-auto"
      animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: isUrgent ? Infinity : 0, duration: 0.5 }}
    >
      <div className="bg-muted rounded-full h-4 overflow-hidden">
        <motion.div
          className={`h-full transition-colors duration-300 ${
            isUrgent ? 'bg-destructive' : 'bg-primary'
          }`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="text-center mt-2">
        <span className={`font-mono ${isUrgent ? 'text-destructive' : 'text-foreground'}`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </span>
      </div>
    </motion.div>
  );
}