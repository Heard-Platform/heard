import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { NicknameSetup } from "./components/NicknameSetup"
import { LobbyScreen } from "./screens/LobbyScreen"
import { GameScreen } from "./screens/GameScreen"
import { useDebateSession } from "./hooks/useDebateSession"

interface Statement {
  id: string
  text: string
  author: string
  votes: number
  type?: "bridge" | "crux" | "plurality"
  isSpicy?: boolean
  roomId: string
  timestamp: number
  voters: { [userId: string]: "up" | "down" }
}

interface Achievement {
  title: string
  description: string
  points: number
  type: "score" | "bridge" | "crux" | "plurality" | "streak"
}

export default function App() {
  const [timerActive, setTimerActive] = useState(false)

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
    resetSession,
  } = useDebateSession()

  // Handle nickname setup completion
  const handleNicknameComplete = async (nickname: string) => {
    await initializeUser(nickname)
  }

  // Handle room creation
  const handleCreateRoom = async (topic: string) => {
    const roomData = await createRoom(topic)
    if (roomData) {
      setTimerActive(false) // Start in lobby phase
    }
  }

  // Handle joining existing room
  const handleJoinRoom = async (roomId: string) => {
    const roomData = await joinRoom(roomId)
    if (roomData) {
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
    setTimerActive(false)
  }

  // Development helper function to jump to final results
  const jumpToFinalResults = async () => {
    if (room) {
      await updateRoomPhase("results")
    }
  }

  // Load active rooms when in lobby (user but no room)
  useEffect(() => {
    if (user && !room) {
      getActiveRooms()
    }
  }, [user, room, getActiveRooms])

  // Sync timerActive with room phase changes (for real-time multiplayer)
  useEffect(() => {
    if (room) {
      const shouldBeActive = !["lobby", "voting", "results"].includes(
        room.phase
      )
      setTimerActive(shouldBeActive)
    }
  }, [room?.phase])

  // Derived state - single source of truth
  const showNicknameSetup = !user
  const showLobby = user && !room
  const showGame = user && room

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
  if (showNicknameSetup) {
    return (
      <NicknameSetup
        onComplete={handleNicknameComplete}
        loading={loading}
        error={error}
      />
    )
  }

  // Lobby - Room Selection/Creation
  if (showLobby) {
    return (
      <LobbyScreen
        user={user}
        activeRooms={activeRooms}
        loading={loading}
        error={error}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onRefreshRooms={getActiveRooms}
        onJumpToFinalResults={jumpToFinalResults}
      />
    )
  }

  // In-Game Experience
  if (showGame) {
    return (
      <GameScreen
        user={user}
        room={room}
        statements={statements}
        timerActive={timerActive}
        lastAchievement={lastAchievement}
        onSubmitStatement={handleStatementSubmit}
        onVote={handleVote}
        onNextPhase={nextPhase}
        onStartDebate={startDebate}
        onLeaveRoom={handleLeaveRoom}
        onNewDiscussion={handleNewDiscussion}
        onScheduleFuture={handleScheduleFuture}
        onSkipPhase={nextPhase}
      />
    )
  }

  return null
}
