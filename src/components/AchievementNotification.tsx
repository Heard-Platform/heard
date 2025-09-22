import { motion, AnimatePresence } from "motion/react";
import { Trophy, Star, Zap, Target, Users } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  type: "score" | "bridge" | "crux" | "plurality" | "streak";
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementNotification({
  achievement,
  onClose,
}: AchievementNotificationProps) {
  if (!achievement) return null;

  const getIcon = () => {
    switch (achievement.type) {
      case "bridge":
        return <Users className="w-6 h-6 text-blue-500" />;
      case "crux":
        return <Target className="w-6 h-6 text-red-500" />;
      case "plurality":
        return <Zap className="w-6 h-6 text-purple-500" />;
      case "streak":
        return <span className="text-2xl">🔥</span>;
      default:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getBgColor = () => {
    switch (achievement.type) {
      case "bridge":
        return "bg-blue-500";
      case "crux":
        return "bg-red-500";
      case "plurality":
        return "bg-purple-500";
      case "streak":
        return "bg-orange-500";
      default:
        return "bg-yellow-500";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 right-4 z-50 bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm"
        initial={{ opacity: 0, x: 100, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.8 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          duration: 0.5,
        }}
      >
        <motion.div
          className="flex items-start gap-3"
          initial={{ y: 10 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`p-2 rounded-full ${getBgColor()}`}>
            {getIcon()}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">
                {achievement.title}
              </h4>
              <motion.div
                className="flex items-center gap-1 text-yellow-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-mono">
                  +{achievement.points}
                </span>
              </motion.div>
            </div>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
          >
            ×
          </button>
        </motion.div>

        <motion.div
          className={`h-1 ${getBgColor()} rounded-full mt-3`}
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.2, duration: 0.8 }}
        />
      </motion.div>
    </AnimatePresence>
  );
}