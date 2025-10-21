import { useState } from "react";
import { motion } from "motion/react";
import {
  Trophy,
  Sparkles,
  Star,
  ThumbsUp,
  ThumbsDown,
  Flame,
  BarChart3,
} from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import type { Statement } from "../../types";
import { getTypeInfo, getPodiumPosition, analyzeStatements } from "./utils";
import { StatementMini } from "./StatementMini";

interface ConcludedResultsProps {
  statements: Statement[];
}

export function ConcludedResults({ statements }: ConcludedResultsProps) {
  const [viewMode, setViewMode] = useState<
    "leaderboard" | "categories" | "clusters" | "trends"
  >("leaderboard");

  const analysis = analyzeStatements(statements);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <Card className="p-3 md:p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-2">
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4 md:mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="flex items-center gap-1.5 md:gap-2 text-base sm:text-lg md:text-2xl">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-500" />
            </motion.div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              <span className="hidden sm:inline">🎉 THE RESULTS ARE IN! 🎉</span>
              <span className="sm:hidden">🎉 RESULTS! 🎉</span>
            </span>
          </h3>
          <Badge variant="outline" className="text-xs bg-white whitespace-nowrap">
            {statements.length} statements
          </Badge>
        </motion.div>

        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as any)}
          className="space-y-3 md:space-y-4"
        >
          <TabsList className="grid w-full grid-cols-4 bg-white/50 h-auto">
            <TabsTrigger value="leaderboard" className="text-[10px] sm:text-xs px-1 py-2">
              <span className="hidden sm:inline">🏆 Leaderboard</span>
              <span className="sm:hidden">🏆</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-[10px] sm:text-xs px-1 py-2">
              <span className="hidden sm:inline">📊 Categories</span>
              <span className="sm:hidden">📊</span>
            </TabsTrigger>
            <TabsTrigger value="clusters" className="text-[10px] sm:text-xs px-1 py-2">
              <span className="hidden sm:inline">🎯 Clusters</span>
              <span className="sm:hidden">🎯</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-[10px] sm:text-xs px-1 py-2">
              <span className="hidden sm:inline">📈 Trends</span>
              <span className="sm:hidden">📈</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-4">
            {/* Podium - Top 3 */}
            {analysis.byAgrees.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <h4 className="text-center mb-3 md:mb-4 flex items-center justify-center gap-1.5 md:gap-2">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-500" />
                  <span className="text-sm sm:text-base md:text-lg">Hall of Fame</span>
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-500" />
                </h4>

                <div className="flex items-end justify-center gap-2 sm:gap-3 md:gap-4 mb-4 md:mb-6">
                  {/* 2nd place */}
                  {analysis.byAgrees[1] && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex-1 max-w-[100px] sm:max-w-[140px] md:max-w-[200px]"
                    >
                      <div
                        className={`${getPodiumPosition(1).bg} ${
                          getPodiumPosition(1).border
                        } border-2 rounded-lg p-2 sm:p-3 md:p-4 h-16 sm:h-20 md:h-24 flex flex-col justify-between`}
                      >
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl md:text-3xl mb-0.5 md:mb-1">
                            🥈
                          </div>
                          <div
                            className={`text-base sm:text-xl md:text-2xl ${
                              getPodiumPosition(1).color
                            }`}
                          >
                            {analysis.byAgrees[1].agrees}
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                            votes
                          </div>
                        </div>
                      </div>
                      <div className="mt-1.5 md:mt-2 p-1.5 sm:p-2 bg-white rounded text-[10px] sm:text-xs line-clamp-2">
                        {analysis.byAgrees[1].text}
                      </div>
                    </motion.div>
                  )}

                  {/* 1st place - taller */}
                  {analysis.byAgrees[0] && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex-1 max-w-[120px] sm:max-w-[160px] md:max-w-[220px]"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                        className={`${getPodiumPosition(0).bg} ${
                          getPodiumPosition(0).border
                        } border-2 md:border-4 rounded-lg p-2 sm:p-3 md:p-4 h-20 sm:h-24 md:h-32 flex flex-col justify-between relative overflow-hidden`}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 to-amber-300/20"
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        <div className="text-center relative z-10">
                          <div className="text-2xl sm:text-3xl md:text-4xl mb-0.5 sm:mb-1 md:mb-2">
                            👑
                          </div>
                          <div
                            className={`text-lg sm:text-2xl md:text-3xl ${
                              getPodiumPosition(0).color
                            }`}
                          >
                            {analysis.byAgrees[0].agrees}
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                            votes
                          </div>
                        </div>
                      </motion.div>
                      <div className="mt-1.5 md:mt-2 p-2 sm:p-2.5 md:p-3 bg-white rounded border-2 border-yellow-300 text-[10px] sm:text-xs">
                        <div className="font-medium text-yellow-700 mb-0.5 sm:mb-1 text-[10px] sm:text-xs">
                          WINNER!
                        </div>
                        <div className="line-clamp-2">{analysis.byAgrees[0].text}</div>
                      </div>
                    </motion.div>
                  )}

                  {/* 3rd place */}
                  {analysis.byAgrees[2] && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex-1 max-w-[90px] sm:max-w-[120px] md:max-w-[180px]"
                    >
                      <div
                        className={`${getPodiumPosition(2).bg} ${
                          getPodiumPosition(2).border
                        } border-2 rounded-lg p-2 sm:p-3 md:p-4 h-14 sm:h-16 md:h-20 flex flex-col justify-between`}
                      >
                        <div className="text-center">
                          <div className="text-lg sm:text-xl md:text-2xl mb-0.5 md:mb-1">
                            🥉
                          </div>
                          <div
                            className={`text-sm sm:text-lg md:text-xl ${
                              getPodiumPosition(2).color
                            }`}
                          >
                            {analysis.byAgrees[2].agrees}
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                            votes
                          </div>
                        </div>
                      </div>
                      <div className="mt-1.5 md:mt-2 p-1.5 sm:p-2 bg-white rounded text-[10px] sm:text-xs line-clamp-2">
                        {analysis.byAgrees[2].text}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Rest of the rankings */}
            {analysis.byAgrees.length > 3 && (
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                  <span className="hidden sm:inline">The Rest of the Pack</span>
                  <span className="sm:hidden">More Results</span>
                </h4>
                {analysis.byAgrees.slice(3, 10).map((statement, index) => (
                  <motion.div
                    key={statement.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border hover:border-purple-300 transition-colors"
                  >
                    <div className="text-center min-w-[28px] sm:min-w-[40px]">
                      <div className="text-sm sm:text-base md:text-lg font-medium text-muted-foreground">
                        #{index + 4}
                      </div>
                    </div>
                    <div className="flex-1 text-xs sm:text-sm">{statement.text}</div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center gap-0.5 sm:gap-1 text-green-600">
                        <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-medium text-xs sm:text-sm">
                          {statement.agrees}
                        </span>
                      </div>
                      {statement.disagrees > 0 && (
                        <div className="flex items-center gap-0.5 sm:gap-1 text-red-600">
                          <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="font-medium text-xs sm:text-sm">
                            {statement.disagrees}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Spicy/Controversial section */}
            {analysis.controversial.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg"
              >
                <h4 className="text-xs sm:text-sm mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  <span className="font-medium">
                    <span className="hidden sm:inline">
                      🌶️ SPICY TAKES (Most Controversial)
                    </span>
                    <span className="sm:hidden">🌶️ SPICY TAKES</span>
                  </span>
                </h4>
                <div className="space-y-1.5 md:space-y-2">
                  {analysis.controversial.slice(0, 3).map((statement) => (
                    <motion.div
                      key={statement.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-2 bg-white rounded text-xs sm:text-sm border border-orange-200"
                    >
                      {statement.text}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            {Object.entries(analysis.byType).map(([type, typeStatements]) => {
              if (typeStatements.length === 0) return null;
              const info = getTypeInfo(type);
              const Icon = info.icon;

              return (
                <div key={type} className={`p-3 rounded-lg ${info.bg}`}>
                  <h4 className={`text-sm mb-2 flex items-center gap-2 ${info.color}`}>
                    <Icon className="w-4 h-4" />
                    {info.label} ({typeStatements.length})
                  </h4>
                  <div className="space-y-2">
                    {typeStatements.slice(0, 3).map((statement) => (
                      <StatementMini key={statement.id} statement={statement} />
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="clusters" className="space-y-3">
            {analysis.clusters.map((cluster) => (
              <div key={cluster.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm">{cluster.theme}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{cluster.size} statements</span>
                    <span>Avg: {cluster.avgVotes.toFixed(1)} votes</span>
                  </div>
                </div>
                <Progress
                  value={
                    (cluster.avgVotes /
                      Math.max(...statements.map((s) => s.agrees), 1)) *
                    100
                  }
                  className="mb-2"
                />
                <div className="space-y-2 max-h-24 overflow-y-auto">
                  {cluster.statements.slice(0, 1).map((statement) => (
                    <StatementMini
                      key={statement.id}
                      statement={statement}
                      showVotes={false}
                    />
                  ))}
                </div>
              </div>
            ))}
            {analysis.clusters.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Not enough data to show clusters yet.
              </p>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-3 md:space-y-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center p-2 sm:p-3 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg"
              >
                <motion.div
                  className="text-xl sm:text-2xl md:text-3xl font-mono text-blue-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  {statements.filter((s) => s.agrees > 0).length}
                </motion.div>
                <div className="text-[10px] sm:text-xs text-blue-700 mt-0.5 sm:mt-1">
                  ✨ <span className="hidden sm:inline">Statements with</span> agrees
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center p-2 sm:p-3 md:p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg"
              >
                <motion.div
                  className="text-xl sm:text-2xl md:text-3xl font-mono text-purple-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  {statements.reduce((sum, s) => sum + s.agrees + s.disagrees + s.passes, 0)}
                </motion.div>
                <div className="text-[10px] sm:text-xs text-purple-700 mt-0.5 sm:mt-1">
                  🗳️ Total votes<span className="hidden sm:inline"> cast</span>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center p-2 sm:p-3 md:p-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg"
              >
                <motion.div
                  className="text-xl sm:text-2xl md:text-3xl font-mono text-green-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                >
                  {analysis.byType.bridge.length}
                </motion.div>
                <div className="text-[10px] sm:text-xs text-green-700 mt-0.5 sm:mt-1">
                  🌉 Bridges<span className="hidden sm:inline"> found</span>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center p-2 sm:p-3 md:p-4 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-lg"
              >
                <motion.div
                  className="text-xl sm:text-2xl md:text-3xl font-mono text-red-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  {analysis.byType.crux.length}
                </motion.div>
                <div className="text-[10px] sm:text-xs text-red-700 mt-0.5 sm:mt-1">
                  🎯 Cruxes<span className="hidden sm:inline"> identified</span>
                </div>
              </motion.div>
            </motion.div>

            <div className="space-y-1.5 md:space-y-2">
              <h4 className="text-xs sm:text-sm flex items-center gap-1.5 md:gap-2">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                <span className="hidden sm:inline">Top Performers by Vote Count</span>
                <span className="sm:hidden">Top Performers</span>
              </h4>
              {analysis.byAgrees.slice(0, 5).map((statement, index) => (
                <motion.div
                  key={statement.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="text-lg sm:text-xl md:text-2xl">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "⭐"}
                  </div>
                  <div className="flex-1 text-[10px] sm:text-xs">{statement.text}</div>
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs sm:text-sm font-medium whitespace-nowrap"
                  >
                    {statement.agrees}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}
