import { motion } from 'motion/react';
import { Users, Target, Zap, MessageCircle } from 'lucide-react';

interface RoundIndicatorProps {
  currentRound: 'initial' | 'bridge' | 'crux' | 'plurality' | 'voting' | 'results';
  roundNumber: number;
}

export function RoundIndicator({ currentRound, roundNumber }: RoundIndicatorProps) {
  const rounds = [
    { key: 'initial', label: 'Initial Takes', icon: MessageCircle, color: 'gray' },
    { key: 'bridge', label: 'Bridges', icon: Users, color: 'blue' },
    { key: 'crux', label: 'Cruxes', icon: Target, color: 'red' },
    { key: 'plurality', label: 'Pluralities', icon: Zap, color: 'purple' },
  ];

  const getCurrentRoundInfo = () => {
    switch (currentRound) {
      case 'initial':
        return { title: 'Initial Takes', subtitle: 'Share your perspective', emoji: '💭' };
      case 'bridge':
        return { title: 'Bridge Building', subtitle: 'Find common ground', emoji: '🌉' };
      case 'crux':
        return { title: 'Crux Hunting', subtitle: 'Core disagreements', emoji: '⚡' };
      case 'plurality':
        return { title: 'Plurality Mining', subtitle: 'Underrepresented views', emoji: '💎' };
      case 'voting':
        return { title: 'Voting Time', subtitle: 'Rate the statements', emoji: '🗳️' };
      case 'results':
        return { title: 'Round Complete', subtitle: 'See the results', emoji: '🏆' };
      default:
        return { title: 'Debate', subtitle: 'Express yourself', emoji: '💬' };
    }
  };

  const roundInfo = getCurrentRoundInfo();

  return (
    <div className="text-center space-y-4">
      <motion.div
        key={currentRound}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="space-y-2"
      >
        <motion.div
          className="text-4xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          {roundInfo.emoji}
        </motion.div>
        <h2 className="text-2xl font-semibold text-primary">{roundInfo.title}</h2>
        <p className="text-muted-foreground">{roundInfo.subtitle}</p>
        <div className="text-sm text-muted-foreground">
          Round {roundNumber}
        </div>
      </motion.div>

      <div className="flex justify-center items-center gap-2 max-w-md mx-auto">
        {rounds.map((round, index) => {
          const Icon = round.icon;
          const isActive = round.key === currentRound;
          const isCompleted = rounds.findIndex(r => r.key === currentRound) > index;
          
          return (
            <motion.div
              key={round.key}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isActive 
                  ? `bg-${round.color}-100 border-2 border-${round.color}-500` 
                  : isCompleted 
                    ? 'bg-green-100 border-2 border-green-500'
                    : 'bg-muted border-2 border-transparent'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: isActive ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Icon 
                className={`w-5 h-5 ${
                  isActive 
                    ? `text-${round.color}-600` 
                    : isCompleted 
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                }`} 
              />
              <span className={`text-xs ${
                isActive 
                  ? `text-${round.color}-700` 
                  : isCompleted 
                    ? 'text-green-700'
                    : 'text-muted-foreground'
              }`}>
                {round.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}