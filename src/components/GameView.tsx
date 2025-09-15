import { motion, AnimatePresence } from "motion/react"
import { Button } from "./ui/button"
import { DebateTimer } from "./DebateTimer"
import { ScoreBoard } from "./ScoreBoard"
import { StatementCard } from "./StatementCard"
import { StatementSubmission } from "./StatementSubmission"
import { AchievementNotification } from "./AchievementNotification"
import { RoundIndicator } from "./RoundIndicator"
import { RealTimeResults } from "./RealTimeResults"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"

export interface Statement {
  id: string
  text: string
  author: string
  votes: number
  type?: "bridge" | "crux" | "plurality"
  isSpicy?: boolean
}

export interface Achievement {
  id: string
  title: string
  description: string
  points: number
  type: "score" | "bridge" | "crux" | "plurality" | "streak"
}

export type SubmissionPhase = "initial" | "bridge" | "crux" | "plurality"
export type GamePhase = SubmissionPhase | "lobby" | "voting" | "results"

export function isSubmissionPhase(phase: GamePhase): phase is SubmissionPhase {
  return ["initial", "bridge", "crux", "plurality"].includes(phase)
}

interface GameViewProps {
  gamePhase: GamePhase
  statements: Statement[]
  score: number
  bridgePoints: number
  cruxPoints: number
  pluralityPoints: number
  streak: number
  roundNumber: number
  achievement: Achievement | null
  timerActive: boolean
  currentTopic: string
  onStartGame: () => void
  onResetGame: () => void
  onNextPhase: () => void
  onStatementSubmit: (
    text: string,
    type?: "bridge" | "crux" | "plurality"
  ) => void
  onVote: (id: string, voteType: "up" | "down") => void
  onFlag: (id: string) => void
  onAchievementClose: () => void
}

export function GameView({
  gamePhase,
  statements,
  score,
  bridgePoints,
  cruxPoints,
  pluralityPoints,
  streak,
  roundNumber,
  achievement,
  timerActive,
  currentTopic,
  onStartGame,
  onResetGame,
  onNextPhase,
  onStatementSubmit,
  onVote,
  onFlag,
  onAchievementClose,
}: GameViewProps) {
  if (gamePhase === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-2xl"
        >
          <motion.h1
            className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            HEARD
          </motion.h1>
          <p className="text-xl text-muted-foreground">
            The arguing app that makes debate feel like a game
          </p>

          <Card className="p-6 text-left">
            <h3 className="mb-3">🎮 How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Submit statements on the debate topic</li>
              <li>• Vote on other players' contributions</li>
              <li>
                • Find <Badge variant="outline">🌉 Bridges</Badge> between
                different views
              </li>
              <li>
                • Identify <Badge variant="outline">⚡ Cruxes</Badge> at the
                heart of disagreements
              </li>
              <li>
                • Discover <Badge variant="outline">💎 Pluralities</Badge> -
                underrepresented perspectives
              </li>
              <li>• Earn points and build streaks!</li>
            </ul>
          </Card>

          <Card className="p-4 bg-accent">
            <h4 className="mb-2">Today's Topic:</h4>
            <p className="font-medium">{currentTopic}</p>
          </Card>

          <Button onClick={onStartGame} size="lg" className="text-lg px-8">
            Start Arguing! 🔥
          </Button>
        </motion.div>
      </div>
    )
  }

  const isSubmissionPhaseActive = isSubmissionPhase(gamePhase)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <motion.h1
            className="text-3xl font-bold text-primary"
            whileHover={{ scale: 1.05 }}
          >
            HEARD
          </motion.h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <ScoreBoard
              score={score}
              bridgePoints={bridgePoints}
              cruxPoints={cruxPoints}
              pluralityPoints={pluralityPoints}
              streak={streak}
            />
            <Button
              onClick={onResetGame}
              variant="outline"
              size="sm"
              className="self-start sm:self-auto"
            >
              New Game
            </Button>
          </div>
        </div>

        {/* Topic */}
        <Card className="p-4 bg-accent">
          <h3 className="text-center">
            <span className="text-muted-foreground">Debate Topic:</span>
            <br />
            <span className="font-medium text-lg">{currentTopic}</span>
          </h3>
        </Card>

        {/* Round Indicator */}
        <RoundIndicator currentRound={gamePhase} roundNumber={roundNumber} />

        {/* Timer */}
        {timerActive && (
          <DebateTimer
            duration={gamePhase === "initial" ? 120 : 90}
            onTimeUp={onNextPhase}
            isActive={timerActive}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submission Area */}
          <div className="space-y-4">
            {isSubmissionPhaseActive && (
              <StatementSubmission
                onSubmit={onStatementSubmit}
                currentRound={gamePhase}
                isActive={timerActive}
                placeholder={
                  gamePhase === "initial"
                    ? "What's your take? Spicy takes welcome! 🌶️"
                    : `Submit a ${gamePhase}...`
                }
              />
            )}

            {gamePhase === "voting" && (
              <Card className="p-6 text-center">
                <h3 className="mb-2">Voting Phase</h3>
                <p className="text-muted-foreground mb-4">
                  Review all statements and vote on the best contributions
                </p>
                <Button onClick={onNextPhase}>Finish Voting</Button>
              </Card>
            )}

            {gamePhase === "results" && (
              <Card className="p-6 text-center">
                <h3 className="mb-2">Round {roundNumber} Complete! 🎉</h3>
                <p className="text-muted-foreground mb-4">
                  Great discussion! Ready for the next round?
                </p>
                <Button onClick={onNextPhase}>Next Round</Button>
              </Card>
            )}

            {/* Real-time Results - Show during active phases */}
            {(statements.length > 0 || gamePhase === "voting") &&
              gamePhase !== "results" && (
                <RealTimeResults
                  statements={statements}
                  currentRound={
                    ["initial", "bridge", "crux", "plurality"].includes(
                      gamePhase
                    )
                      ? gamePhase
                      : "initial"
                  }
                />
              )}
          </div>

          {/* Statements Feed */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="flex items-center gap-2">
              Statements ({statements.length})
              {gamePhase === "voting" && (
                <span className="text-sm text-muted-foreground">
                  - Vote now!
                </span>
              )}
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              <AnimatePresence>
                {statements.map((statement) => (
                  <StatementCard
                    key={statement.id}
                    statement={statement}
                    onVote={onVote}
                    onFlag={onFlag}
                    canVote={gamePhase === "voting"}
                  />
                ))}
              </AnimatePresence>

              {statements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No statements yet. Be the first to share your take!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AchievementNotification
        achievement={achievement}
        onClose={onAchievementClose}
      />
    </div>
  )
}
