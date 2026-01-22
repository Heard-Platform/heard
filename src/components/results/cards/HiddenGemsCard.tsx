import { motion } from "motion/react";
import { Sparkles, ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import type { Statement } from "../../../types";
import { analyzeStatements } from "../utils";
import { CardHeader } from "../CardHeader";

interface HiddenGemsCardProps {
  statements: Statement[];
  onDiscuss?: (statementText: string) => void;
}

export function HiddenGemsCard({
  statements,
  onDiscuss,
}: HiddenGemsCardProps) {
  const analysis = analyzeStatements(statements);
  const smallestCluster = analysis.clusters.sort((a, b) => a.size - b.size)[0];
  const minorityStatements = smallestCluster?.statements || [];

  return (
    <div className="space-y-4">
      <CardHeader
        icon={<Sparkles className="w-6 h-6 text-purple-500" />}
        title="Hidden Gems"
        subtitle="Fresh perspectives worth exploring"
        gradientFrom="from-purple-600"
        gradientTo="to-pink-600"
      />

      {analysis.clusters.length > 0 ? (
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-purple-800">
                {smallestCluster?.theme}
              </h3>
              <Badge variant="secondary" className="bg-purple-100">
                {smallestCluster?.size} statements
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              A rare take that brings something different to the conversation—and we love it.
            </p>
          </motion.div>

          <div className="space-y-2">
            {minorityStatements.slice(0, 3).map((statement, index) => (
              <motion.div
                key={statement.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-3 bg-white border-2 border-purple-200 rounded-lg space-y-2"
              >
                <p className="text-sm">{statement.text}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {statement.agrees}
                  </span>
                  {statement.disagrees > 0 && (
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" />
                      {statement.disagrees}
                    </span>
                  )}
                </div>
                {onDiscuss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => onDiscuss(statement.text)}
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Discuss
                  </Button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Cluster visualization */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-center">
              Opinion Clusters
            </h4>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {analysis.clusters.map((cluster, index) => (
                <motion.div
                  key={cluster.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium text-sm"
                    style={{
                      width: `${Math.max(40, cluster.size * 8)}px`,
                      height: `${Math.max(40, cluster.size * 8)}px`,
                    }}
                  >
                    {cluster.size}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[80px] text-center line-clamp-1">
                    {cluster.theme}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Not enough data to identify clusters yet
        </p>
      )}
    </div>
  );
}