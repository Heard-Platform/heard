import { useState, useEffect, useCallback } from "react"
import { GameView } from "./components/GameView"

interface Statement {
  id: string
  text: string
  author: string
  votes: number
  type?: "bridge" | "crux" | "plurality"
  isSpicy?: boolean
}

interface Achievement {
  id: string
  title: string
  description: string
  points: number
  type: "score" | "bridge" | "crux" | "plurality" | "streak"
}

type GamePhase =
  | "lobby"
  | "initial"
  | "bridge"
  | "crux"
  | "plurality"
  | "voting"
  | "results"

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>("lobby")
  const [statements, setStatements] = useState<Statement[]>([])
  const [score, setScore] = useState(0)
  const [bridgePoints, setBridgePoints] = useState(0)
  const [cruxPoints, setCruxPoints] = useState(0)
  const [pluralityPoints, setPluralityPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [roundNumber, setRoundNumber] = useState(1)
  const [achievement, setAchievement] = useState<Achievement | null>(null)
  const [timerActive, setTimerActive] = useState(false)

  const debateTopics = [
    "Social media does more harm than good for society",
    "Remote work is better than in-person work",
    "AI will solve more problems than it creates",
    "Democracy is the best form of government",
    "Economic growth should be prioritized over environmental protection",
  ]

  const [currentTopic] = useState(
    debateTopics[Math.floor(Math.random() * debateTopics.length)]
  )

  const addAchievement = useCallback((newAchievement: Achievement) => {
    setAchievement(newAchievement)
    setScore((prev) => prev + newAchievement.points)

    // Update category-specific points
    switch (newAchievement.type) {
      case "bridge":
        setBridgePoints((prev) => prev + newAchievement.points)
        break
      case "crux":
        setCruxPoints((prev) => prev + newAchievement.points)
        break
      case "plurality":
        setPluralityPoints((prev) => prev + newAchievement.points)
        break
    }

    setTimeout(() => setAchievement(null), 4000)
  }, [])

  const handleStatementSubmit = useCallback(
    (text: string, type?: "bridge" | "crux" | "plurality") => {
      const newStatement: Statement = {
        id: Date.now().toString(),
        text,
        author: `Player${Math.floor(Math.random() * 100)}`,
        votes: 0,
        type,
        isSpicy: text.includes("🌶️") || text.length > 200,
      }

      setStatements((prev) => [...prev, newStatement])

      // Award points for submission
      const basePoints = 50
      const spicyBonus = newStatement.isSpicy ? 25 : 0
      const typeBonus = type ? 50 : 0

      addAchievement({
        id: Date.now().toString(),
        title: type
          ? `${type.charAt(0).toUpperCase() + type.slice(1)} Submitted!`
          : "Statement Posted!",
        description: `+${basePoints + spicyBonus + typeBonus} points`,
        points: basePoints + spicyBonus + typeBonus,
        type: type || "score",
      })

      setStreak((prev) => prev + 1)
    },
    [addAchievement]
  )

  const handleVote = useCallback(
    (id: string, voteType: "up" | "down") => {
      setStatements((prev) =>
        prev.map((statement) =>
          statement.id === id
            ? {
                ...statement,
                votes: statement.votes + (voteType === "up" ? 1 : -1),
              }
            : statement
        )
      )

      if (voteType === "up") {
        addAchievement({
          id: Date.now().toString(),
          title: "Good Eye!",
          description: "Upvoted a quality statement",
          points: 10,
          type: "score",
        })
      }
    },
    [addAchievement]
  )

  const handleFlag = useCallback((id: string) => {
    // In a real app, this would report the statement
    console.log("Statement flagged:", id)
  }, [])

  const nextPhase = useCallback(() => {
    const phases: GamePhase[] = [
      "initial",
      "bridge",
      "crux",
      "plurality",
      "voting",
      "results",
    ]
    const currentIndex = phases.indexOf(gamePhase)

    if (currentIndex < phases.length - 1) {
      setGamePhase(phases[currentIndex + 1])
      setTimerActive(
        phases[currentIndex + 1] !== "voting" &&
          phases[currentIndex + 1] !== "results"
      )
    } else {
      // Start new round
      setRoundNumber((prev) => prev + 1)
      setGamePhase("initial")
      setStatements([])
      setTimerActive(true)
    }
  }, [gamePhase])

  const startGame = () => {
    setGamePhase("initial")
    setTimerActive(true)
  }

  const resetGame = () => {
    setGamePhase("lobby")
    setStatements([])
    setScore(0)
    setBridgePoints(0)
    setCruxPoints(0)
    setPluralityPoints(0)
    setStreak(0)
    setRoundNumber(1)
    setTimerActive(false)
  }

  // Add some mock statements for demo purposes
  useEffect(() => {
    if (gamePhase === "voting" && statements.length < 8) {
      const mockStatements: Statement[] = [
        {
          id: "mock1",
          text: "I think we need to consider both sides here. Maybe the real issue isn't black and white?",
          author: "BridgeBuilder",
          votes: 12,
          type: "bridge",
        },
        {
          id: "mock2",
          text: "The fundamental disagreement is whether individual freedom trumps collective responsibility. That's the core of this debate.",
          author: "CruxHunter",
          votes: 15,
          type: "crux",
        },
        {
          id: "mock3",
          text: "What about the perspective of people who are often left out of this conversation entirely? 🌶️",
          author: "VoiceOfMany",
          votes: 7,
          type: "plurality",
          isSpicy: true,
        },
        {
          id: "mock4",
          text: "This is clearly good for society - the benefits far outweigh any negative aspects.",
          author: "Optimist",
          votes: 9,
        },
        {
          id: "mock5",
          text: "The evidence shows this is harmful and we need to address the negative consequences immediately.",
          author: "Realist",
          votes: 6,
        },
        {
          id: "mock6",
          text: "Both perspectives have merit, but we're missing the economic implications here.",
          author: "Economist",
          votes: 4,
          type: "bridge",
        },
        {
          id: "mock7",
          text: "The real question is: who gets to decide what's 'good' for society? That's the power dynamic we should examine. 🌶️",
          author: "CriticalThinker",
          votes: 2,
          type: "plurality",
          isSpicy: true,
        },
        {
          id: "mock8",
          text: "We keep debating symptoms instead of root causes. The crux is systemic vs individual approaches.",
          author: "SystemsTheorist",
          votes: 11,
          type: "crux",
        },
      ]
      setStatements((prev) => [...prev, ...mockStatements])
    }
  }, [gamePhase, statements.length])

  return (
    <GameView
      gamePhase={gamePhase}
      statements={statements}
      score={score}
      bridgePoints={bridgePoints}
      cruxPoints={cruxPoints}
      pluralityPoints={pluralityPoints}
      streak={streak}
      roundNumber={roundNumber}
      achievement={achievement}
      timerActive={timerActive}
      currentTopic={currentTopic}
      onStartGame={startGame}
      onResetGame={resetGame}
      onNextPhase={nextPhase}
      onStatementSubmit={handleStatementSubmit}
      onVote={handleVote}
      onFlag={handleFlag}
      onAchievementClose={() => setAchievement(null)}
    />
  )
}
