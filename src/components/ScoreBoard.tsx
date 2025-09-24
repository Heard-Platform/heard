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
      className="bg-card border rounded-lg px-4 py-2 flex items-center gap-4"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Total Score */}
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <motion.span 
          className="text-lg font-mono text-primary"
          key={score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {score.toLocaleString()}
        </motion.span>
      </div>
      
      {/* Separator */}
      <div className="w-px h-6 bg-border" />
      
      {/* Point breakdown - icons only */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1" title={`Bridges: ${bridgePoints}`}>
          <Users className="w-4 h-4 text-blue-500" />
          <span>{bridgePoints}</span>
        </div>
        <div className="flex items-center gap-1" title={`Cruxes: ${cruxPoints}`}>
          <Target className="w-4 h-4 text-red-500" />
          <span>{cruxPoints}</span>
        </div>
        <div className="flex items-center gap-1" title={`Pluralities: ${pluralityPoints}`}>
          <Zap className="w-4 h-4 text-purple-500" />
          <span>{pluralityPoints}</span>
        </div>
        <div className="flex items-center gap-1" title={`Streak: ${streak}`}>
          <span>🔥</span>
          <span>{streak}</span>
        </div>
      </div>
    </motion.div>
  );
}