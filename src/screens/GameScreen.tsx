import { useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { DebateTimer } from "../components/DebateTimer"
import { ScoreBoard } from "../components/ScoreBoard"
import { StatementCard } from "../components/StatementCard"
import { StatementSubmission } from "../components/StatementSubmission"
import { AchievementNotification } from "../components/AchievementNotification"
import { RoundIndicator } from "../components/RoundIndicator"
import { RealTimeResults } from "../components/RealTimeResults"
import { FinalResults } from "../components/FinalResults"
import { Users, RefreshCw, Zap } from "lucide-react"

interface GameScreenProps {
  user: any
  room: any
  statements: any[]
  timerActive: boolean
  lastAchievement: any
  onSubmitStatement: (
    text: string,
    type?: "bridge" | "crux" | "plurality"
  ) => Promise<void>
  onVote: (id: string, voteType: "up" | "down") => Promise<void>
  onNextPhase: () => Promise<void>
  onStartDebate: () => Promise<void>
  onLeaveRoom: () => void
  onNewDiscussion: (statement: any) => void
  onScheduleFuture: () => void
  onSkipPhase?: () => Promise<void>
}

export function GameScreen({
  user,
  room,
  statements,
  timerActive,
  lastAchievement,
  onSubmitStatement,
  onVote,
  onNextPhase,
  onStartDebate,
  onLeaveRoom,
  onNewDiscussion,
  onScheduleFuture,
  onSkipPhase,
}: GameScreenProps) {
  const isSubmissionPhase = ["initial", "bridge", "crux", "plurality"].includes(
    room.phase
  )

  const handleStatementSubmit = useCallback(
    async (text: string, type?: "bridge" | "crux" | "plurality") => {
      await onSubmitStatement(text, type)
    },
    [onSubmitStatement]
  )

  const handleVote = useCallback(
    async (id: string, voteType: "up" | "down") => {
      await onVote(id, voteType)
    },
    [onVote]
  )

  const handleNewDiscussion = useCallback(
    (statement: any) => {
      onNewDiscussion(statement)
    },
    [onNewDiscussion]
  )

  const handleScheduleFuture = useCallback(() => {
    onScheduleFuture()
  }, [onScheduleFuture])

  if (room.phase === "results") {
    return (
      <>
        <FinalResults
          statements={statements}
          score={user?.score || 0}
          roundNumber={room.roundNumber}
          onNewDiscussion={handleNewDiscussion}
          onScheduleFuture={handleScheduleFuture}
          onNextRound={onNextPhase}
        />
        {lastAchievement && (
          <AchievementNotification
            achievement={lastAchievement}
            onClose={() => {}}
          />
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <motion.h1
              className="text-3xl font-bold text-primary"
              whileHover={{ scale: 1.05 }}
            >
              HEARD
            </motion.h1>
            {/* Dev Only: Skip Phase Button */}
            {onSkipPhase &&
              room.phase !== "results" &&
              room.phase !== "lobby" && (
                <Button
                  onClick={onSkipPhase}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  DEV: Next Phase
                </Button>
              )}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {user && (
              <ScoreBoard
                score={user.score}
                bridgePoints={user.bridgePoints}
                cruxPoints={user.cruxPoints}
                pluralityPoints={user.pluralityPoints}
                streak={user.streak}
              />
            )}
            <div className="flex gap-2">
              <Button onClick={onLeaveRoom} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-1" />
                Leave Room
              </Button>
            </div>
          </div>
        </div>

        {/* Room Info */}
        <Card className="p-4 bg-accent">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-center">
                <span className="text-muted-foreground">Debate Topic:</span>
                <br />
                <span className="font-medium text-lg">{room.topic}</span>
              </h3>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{room.participants.length} players</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Round Indicator */}
        <RoundIndicator
          currentRound={room.phase}
          roundNumber={room.roundNumber}
        />

        {/* Timer */}
        {timerActive && (
          <DebateTimer
            duration={room.phase === "initial" ? 120 : 90} // 2 minutes for initial, 1.5 for others
            onTimeUp={onNextPhase}
            isActive={timerActive}
            phaseStartTime={room.phaseStartTime}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submission Area */}
          <div className="space-y-4">
            {room.phase === "lobby" && (
              <Card className="p-6 text-center">
                <h3 className="mb-2">Debate Room</h3>
                <p className="text-muted-foreground mb-4">
                  {room.participants.length < 2
                    ? "Need at least 2 players to start..."
                    : "Ready to debate!"}
                </p>
                <Button
                  onClick={onStartDebate}
                  disabled={room.participants.length < 2}
                >
                  Start Debate! 🔥
                </Button>
              </Card>
            )}

            {isSubmissionPhase && (
              <StatementSubmission
                onSubmit={handleStatementSubmit}
                currentRound={room.phase}
                isActive={timerActive}
                placeholder={
                  room.phase === "initial"
                    ? "What's your take? Spicy takes welcome! 🌶️"
                    : `Submit a ${room.phase}...`
                }
              />
            )}

            {room.phase === "voting" && (
              <Card className="p-6 text-center">
                <h3 className="mb-2">Voting Phase</h3>
                <p className="text-muted-foreground mb-4">
                  Review all statements and vote on the best contributions
                </p>
                <Button onClick={onNextPhase}>Finish Voting</Button>
              </Card>
            )}

            {/* Real-time Results - Show during active phases */}
            {(statements.length > 0 || room.phase === "voting") &&
              room.phase !== "results" && (
                <RealTimeResults
                  statements={statements}
                  currentRound={room.phase}
                />
              )}
          </div>

          {/* Statements Feed */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="flex items-center gap-2">
              Statements ({statements.length})
              {room.phase === "voting" && (
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
                    onVote={handleVote}
                    onFlag={() => console.log("Flag statement:", statement.id)}
                    canVote={room.phase === "voting"}
                    currentUserId={user?.id}
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

      {lastAchievement && (
        <AchievementNotification
          achievement={lastAchievement}
          onClose={() => {}}
        />
      )}
    </div>
  )
}
