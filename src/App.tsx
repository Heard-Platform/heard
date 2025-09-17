import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "./components/ui/button"
import { DebateTimer } from "./components/DebateTimer"
import { ScoreBoard } from "./components/ScoreBoard"
import { StatementCard } from "./components/StatementCard"
import { StatementSubmission } from "./components/StatementSubmission"
import { AchievementNotification } from "./components/AchievementNotification"
import { RoundIndicator } from "./components/RoundIndicator"
import { RealTimeResults } from "./components/RealTimeResults"
import { FinalResults } from "./components/FinalResults"
import { NicknameSetup } from "./components/NicknameSetup"
import { ActiveRoomsList } from "./components/ActiveRoomsList"
import { Card } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { useDebateSession } from "./hooks/useDebateSession"
import { Users, Plus, RefreshCw } from "lucide-react"

interface Statement {
  id: string
  text: string
  author: string
  votes: number
  type?: "bridge" | "crux" | "plurality"
  isSpicy?: boolean
  roomId: string
  timestamp: number
  voters: string[]
}

interface Achievement {
  title: string
  description: string
  points: number
  type: "score" | "bridge" | "crux" | "plurality" | "streak"
}

type AppState = "nickname-setup" | "lobby" | "room-creation" | "in-game"

const debateTopics = [
  "Social media does more harm than good for society",
  "Remote work is better than in-person work",
  "AI will solve more problems than it creates",
  "Democracy is the best form of government",
  "Economic growth should be prioritized over environmental protection",
]

export default function App() {
  const [appState, setAppState] = useState<AppState>("nickname-setup")
  const [timerActive, setTimerActive] = useState(false)
  const [newRoomTopic, setNewRoomTopic] = useState("")

  const {
    user,
    room,
    statements,
    activeRooms,
    loading,
    error,
    lastAchievement,
    initializeUser,
    createRoom,
    joinRoom,
    getActiveRooms,
    submitStatement,
    voteOnStatement,
    updateRoomPhase,
    leaveRoom,
  } = useDebateSession()

  // Handle nickname setup completion
  const handleNicknameComplete = async (nickname: string) => {
    const userData = await initializeUser(nickname)
    if (userData) {
      setAppState("lobby")
    }
  }

  // Handle room creation
  const handleCreateRoom = async () => {
    if (!newRoomTopic.trim()) return

    const roomData = await createRoom(newRoomTopic.trim())
    if (roomData) {
      setAppState("in-game")
      setTimerActive(false) // Start in lobby phase
    }
  }

  // Handle joining existing room
  const handleJoinRoom = async (roomId: string) => {
    const roomData = await joinRoom(roomId)
    if (roomData) {
      setAppState("in-game")
      // Set timer based on current phase
      setTimerActive(!["lobby", "voting", "results"].includes(roomData.phase))
    }
  }

  // Handle statement submission
  const handleStatementSubmit = useCallback(
    async (text: string, type?: "bridge" | "crux" | "plurality") => {
      await submitStatement(text, type)
    },
    [submitStatement]
  )

  // Handle voting
  const handleVote = useCallback(
    async (id: string, voteType: "up" | "down") => {
      await voteOnStatement(id, voteType)
    },
    [voteOnStatement]
  )

  // Handle phase transitions
  const nextPhase = useCallback(async () => {
    if (!room) return

    const phases = [
      "initial",
      "bridge",
      "crux",
      "plurality",
      "voting",
      "results",
    ]
    const currentIndex = phases.indexOf(room.phase)

    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1]
      await updateRoomPhase(nextPhase)
      setTimerActive(nextPhase !== "voting" && nextPhase !== "results")
    } else {
      // Start new round - go back to initial
      await updateRoomPhase("initial")
      setTimerActive(true)
    }
  }, [room, updateRoomPhase])

  const startDebate = async () => {
    if (!room) return
    await updateRoomPhase("initial")
    setTimerActive(true)
  }

  const handleNewDiscussion = useCallback((statement: Statement) => {
    // In a real app, this would create a new discussion thread
    console.log("Creating new discussion based on:", statement.text)
    alert(`Starting new discussion: "${statement.text.substring(0, 50)}..."`)
  }, [])

  const handleScheduleFuture = useCallback(() => {
    alert(
      "Feature coming soon! We'll notify you about upcoming scheduled debates."
    )
  }, [])

  const handleLeaveRoom = () => {
    leaveRoom()
    setAppState("lobby")
    setTimerActive(false)
    setNewRoomTopic("")
  }

  // Development helper function to jump to final results
  const jumpToFinalResults = async () => {
    if (room) {
      await updateRoomPhase("results")
    }
  }

  // Load active rooms when entering lobby
  useEffect(() => {
    if (appState === "lobby" && user) {
      getActiveRooms()
    }
  }, [appState, user, getActiveRooms])

  // Determine current state
  useEffect(() => {
    if (!user && appState !== "nickname-setup") {
      setAppState("nickname-setup")
    } else if (
      user &&
      !room &&
      appState !== "lobby" &&
      appState !== "room-creation"
    ) {
      setAppState("lobby")
    } else if (user && room && appState !== "in-game") {
      setAppState("in-game")
    }
  }, [user, room, appState])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  // Nickname Setup
  if (appState === "nickname-setup") {
    return (
      <NicknameSetup
        onComplete={handleNicknameComplete}
        loading={loading}
        error={error}
      />
    )
  }

  // Lobby - Room Selection/Creation
  if (appState === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-2xl w-full"
        >
          <motion.h1
            className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            HEARD
          </motion.h1>
          <p className="text-xl text-muted-foreground">
            An app for arguing (and secretly saving democracy)
          </p>

          {user && (
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-green-800">
                Welcome back,{" "}
                <span className="font-medium">{user.nickname}</span>!
                <span className="ml-2 text-sm">Score: {user.score}</span>
              </p>
            </Card>
          )}

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

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="mb-4">🏛️ Create New Debate Room</h3>
              <div className="space-y-3">
                <select
                  className="w-full p-2 border rounded-md"
                  value={newRoomTopic}
                  onChange={(e) => setNewRoomTopic(e.target.value)}
                >
                  <option value="">Choose a topic...</option>
                  {debateTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleCreateRoom}
                  disabled={!newRoomTopic}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Room
                </Button>
              </div>
            </Card>

            <ActiveRoomsList
              rooms={activeRooms}
              onJoinRoom={handleJoinRoom}
              onRefresh={getActiveRooms}
              loading={loading}
            />
          </div>

          <div className="flex gap-3">
            {/* Development only - remove in production */}
            <Button
              onClick={jumpToFinalResults}
              variant="outline"
              size="sm"
              className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
            >
              🚧 DEV: Jump to Final Results
            </Button>
          </div>

          {error && (
            <Card className="p-4 bg-red-50 border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </Card>
          )}
        </motion.div>
      </div>
    )
  }

  // In-Game Experience
  if (appState === "in-game" && room) {
    const isSubmissionPhase = [
      "initial",
      "bridge",
      "crux",
      "plurality",
    ].includes(room.phase)

    // Show Final Results screen
    if (room.phase === "results") {
      return (
        <FinalResults
          statements={statements}
          score={user?.score || 0}
          roundNumber={room.roundNumber}
          onNewDiscussion={handleNewDiscussion}
          onScheduleFuture={handleScheduleFuture}
          onNextRound={nextPhase}
        />
      )
    }

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
                <Button onClick={handleLeaveRoom} variant="outline" size="sm">
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
              onTimeUp={nextPhase}
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
                    Waiting for players to join...
                  </p>
                  <Button onClick={startDebate}>Start Debate! 🔥</Button>
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
                  <Button onClick={nextPhase}>Finish Voting</Button>
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
                      onFlag={() =>
                        console.log("Flag statement:", statement.id)
                      }
                      canVote={room.phase === "voting"}
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

  return null
}
