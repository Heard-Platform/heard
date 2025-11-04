import { motion } from "motion/react";
import { TrendingUp, ThumbsUp, ThumbsDown } from "lucide-react";
import type { Statement } from "../../../types";
import { analyzeStatements } from "../utils";
import { CardHeader } from "../CardHeader";

interface LeaderboardCardProps {
  statements: Statement[];
}

export function LeaderboardCard({ statements }: LeaderboardCardProps) {
  const analysis = analyzeStatements(statements);

  return (
    <div className="space-y-4">
      <CardHeader
        icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
        title="Top Performers"
        subtitle="The full leaderboard"
        gradientFrom="from-blue-600"
        gradientTo="to-purple-600"
      />

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {analysis.byAgrees.slice(0, 10).map((statement, index) => (
          <motion.div
            key={statement.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 hover:border-purple-300 transition-colors"
          >
            <div className="text-2xl min-w-[40px] text-center">
              {index === 0
                ? "🥇"
                : index === 1
                ? "🥈"
                : index === 2
                ? "🥉"
                : `#${index + 1}`}
            </div>
            <div className="flex-1 text-sm">{statement.text}</div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-green-600">
                <ThumbsUp className="w-4 h-4" />
                <span className="font-medium">{statement.agrees}</span>
              </div>
              {statement.disagrees > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <ThumbsDown className="w-4 h-4" />
                  <span className="font-medium">{statement.disagrees}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
