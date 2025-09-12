import { motion } from 'motion/react';
import { Trophy, Zap, Users, Target } from 'lucide-react';

interface ScoreBoardProps {
  score: number;
  bridgePoints: number;
  cruxPoints: number;
  pluralityPoints: number;
  streak: number;
}

export function ScoreBoard({ score, bridgePoints, cruxPoints, pluralityPoints, streak }: ScoreBoardProps) {
  return (
    <motion.div 
      className="bg-card border rounded-lg p-4 space-y-3"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Total Score
        </h3>
        <motion.span 
          className="text-2xl font-mono text-primary"
          key={score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {score.toLocaleString()}
        </motion.span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-blue-500" />
          <span>Bridges: {bridgePoints}</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-4 h-4 text-red-500" />
          <span>Cruxes: {cruxPoints}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-purple-500" />
          <span>Pluralities: {pluralityPoints}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🔥 Streak: {streak}</span>
        </div>
      </div>
    </motion.div>
  );
}