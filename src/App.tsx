import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './components/ui/button';
import { DebateTimer } from './components/DebateTimer';
import { ScoreBoard } from './components/ScoreBoard';
import { StatementCard } from './components/StatementCard';
import { StatementSubmission } from './components/StatementSubmission';
import { AchievementNotification } from './components/AchievementNotification';
import { RoundIndicator } from './components/RoundIndicator';
import { RealTimeResults } from './components/RealTimeResults';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';

interface Statement {
  id: string;
  text: string;
  author: string;
  votes: number;
  type?: 'bridge' | 'crux' | 'plurality';
  isSpicy?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'score' | 'bridge' | 'crux' | 'plurality' | 'streak';
}

type GamePhase = 'lobby' | 'initial' | 'bridge' | 'crux' | 'plurality' | 'voting' | 'results';

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [statements, setStatements] = useState<Statement[]>([]);
  const [score, setScore] = useState(0);
  const [bridgePoints, setBridgePoints] = useState(0);
  const [cruxPoints, setCruxPoints] = useState(0);
  const [pluralityPoints, setPluralityPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  const debateTopics = [
    "Social media does more harm than good for society",
    "Remote work is better than in-person work",
    "AI will solve more problems than it creates",
    "Democracy is the best form of government",
    "Economic growth should be prioritized over environmental protection"
  ];

  const [currentTopic] = useState(debateTopics[Math.floor(Math.random() * debateTopics.length)]);

  const addAchievement = useCallback((newAchievement: Achievement) => {
    setAchievement(newAchievement);
    setScore(prev => prev + newAchievement.points);
    
    // Update category-specific points
    switch (newAchievement.type) {
      case 'bridge':
        setBridgePoints(prev => prev + newAchievement.points);
        break;
      case 'crux':
        setCruxPoints(prev => prev + newAchievement.points);
        break;
      case 'plurality':
        setPluralityPoints(prev => prev + newAchievement.points);
        break;
    }

    setTimeout(() => setAchievement(null), 4000);
  }, []);

  const handleStatementSubmit = useCallback((text: string, type?: 'bridge' | 'crux' | 'plurality') => {
    const newStatement: Statement = {
      id: Date.now().toString(),
      text,
      author: `Player${Math.floor(Math.random() * 100)}`,
      votes: 0,
      type,
      isSpicy: text.includes('🌶️') || text.length > 200
    };

    setStatements(prev => [...prev, newStatement]);

    // Award points for submission
    const basePoints = 50;
    const spicyBonus = newStatement.isSpicy ? 25 : 0;
    const typeBonus = type ? 50 : 0;

    addAchievement({
      id: Date.now().toString(),
      title: type ? `${type.charAt(0).toUpperCase() + type.slice(1)} Submitted!` : 'Statement Posted!',
      description: `+${basePoints + spicyBonus + typeBonus} points`,
      points: basePoints + spicyBonus + typeBonus,
      type: type || 'score'
    });

    setStreak(prev => prev + 1);
  }, [addAchievement]);

  const handleVote = useCallback((id: string, voteType: 'up' | 'down') => {
    setStatements(prev => prev.map(statement => 
      statement.id === id 
        ? { ...statement, votes: statement.votes + (voteType === 'up' ? 1 : -1) }
        : statement
    ));

    if (voteType === 'up') {
      addAchievement({
        id: Date.now().toString(),
        title: 'Good Eye!',
        description: 'Upvoted a quality statement',
        points: 10,
        type: 'score'
      });
    }
  }, [addAchievement]);

  const handleFlag = useCallback((id: string) => {
    // In a real app, this would report the statement
    console.log('Statement flagged:', id);
  }, []);

  const nextPhase = useCallback(() => {
    const phases: GamePhase[] = ['initial', 'bridge', 'crux', 'plurality', 'voting', 'results'];
    const currentIndex = phases.indexOf(gamePhase);
    
    if (currentIndex < phases.length - 1) {
      setGamePhase(phases[currentIndex + 1]);
      setTimerActive(phases[currentIndex + 1] !== 'voting' && phases[currentIndex + 1] !== 'results');
    } else {
      // Start new round
      setRoundNumber(prev => prev + 1);
      setGamePhase('initial');
      setStatements([]);
      setTimerActive(true);
    }
  }, [gamePhase]);

  const startGame = () => {
    setGamePhase('initial');
    setTimerActive(true);
  };

  const resetGame = () => {
    setGamePhase('lobby');
    setStatements([]);
    setScore(0);
    setBridgePoints(0);
    setCruxPoints(0);
    setPluralityPoints(0);
    setStreak(0);
    setRoundNumber(1);
    setTimerActive(false);
  };

  // Add some mock statements for demo purposes
  useEffect(() => {
    if (gamePhase === 'voting' && statements.length < 8) {
      const mockStatements: Statement[] = [
        {
          id: 'mock1',
          text: "I think we need to consider both sides here. Maybe the real issue isn't black and white?",
          author: "BridgeBuilder",
          votes: 12,
          type: 'bridge'
        },
        {
          id: 'mock2', 
          text: "The fundamental disagreement is whether individual freedom trumps collective responsibility. That's the core of this debate.",
          author: "CruxHunter",
          votes: 15,
          type: 'crux'
        },
        {
          id: 'mock3',
          text: "What about the perspective of people who are often left out of this conversation entirely? 🌶️",
          author: "VoiceOfMany",
          votes: 7,
          type: 'plurality',
          isSpicy: true
        },
        {
          id: 'mock4',
          text: "This is clearly good for society - the benefits far outweigh any negative aspects.",
          author: "Optimist",
          votes: 9,
        },
        {
          id: 'mock5',
          text: "The evidence shows this is harmful and we need to address the negative consequences immediately.",
          author: "Realist",
          votes: 6,
        },
        {
          id: 'mock6',
          text: "Both perspectives have merit, but we're missing the economic implications here.",
          author: "Economist",
          votes: 4,
          type: 'bridge'
        },
        {
          id: 'mock7',
          text: "The real question is: who gets to decide what's 'good' for society? That's the power dynamic we should examine. 🌶️",
          author: "CriticalThinker",
          votes: 2,
          type: 'plurality',
          isSpicy: true
        },
        {
          id: 'mock8',
          text: "We keep debating symptoms instead of root causes. The crux is systemic vs individual approaches.",
          author: "SystemsTheorist",
          votes: 11,
          type: 'crux'
        }
      ];
      setStatements(prev => [...prev, ...mockStatements]);
    }
  }, [gamePhase, statements.length]);

  if (gamePhase === 'lobby') {
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
              <li>• Find <Badge variant="outline">🌉 Bridges</Badge> between different views</li>
              <li>• Identify <Badge variant="outline">⚡ Cruxes</Badge> at the heart of disagreements</li>
              <li>• Discover <Badge variant="outline">💎 Pluralities</Badge> - underrepresented perspectives</li>
              <li>• Earn points and build streaks!</li>
            </ul>
          </Card>

          <Card className="p-4 bg-accent">
            <h4 className="mb-2">Today's Topic:</h4>
            <p className="font-medium">{currentTopic}</p>
          </Card>

          <Button onClick={startGame} size="lg" className="text-lg px-8">
            Start Arguing! 🔥
          </Button>
        </motion.div>
      </div>
    );
  }

  const isSubmissionPhase = ['initial', 'bridge', 'crux', 'plurality'].includes(gamePhase);

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
            <Button onClick={resetGame} variant="outline" size="sm" className="self-start sm:self-auto">
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
            duration={gamePhase === 'initial' ? 120 : 90} // 2 minutes for initial, 1.5 for others
            onTimeUp={nextPhase}
            isActive={timerActive}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submission Area */}
          <div className="space-y-4">
            {isSubmissionPhase && (
              <StatementSubmission
                onSubmit={handleStatementSubmit}
                currentRound={gamePhase}
                isActive={timerActive}
                placeholder={
                  gamePhase === 'initial' 
                    ? "What's your take? Spicy takes welcome! 🌶️"
                    : `Submit a ${gamePhase}...`
                }
              />
            )}

            {gamePhase === 'voting' && (
              <Card className="p-6 text-center">
                <h3 className="mb-2">Voting Phase</h3>
                <p className="text-muted-foreground mb-4">
                  Review all statements and vote on the best contributions
                </p>
                <Button onClick={nextPhase}>
                  Finish Voting
                </Button>
              </Card>
            )}

            {gamePhase === 'results' && (
              <Card className="p-6 text-center">
                <h3 className="mb-2">Round {roundNumber} Complete! 🎉</h3>
                <p className="text-muted-foreground mb-4">
                  Great discussion! Ready for the next round?
                </p>
                <Button onClick={nextPhase}>
                  Next Round
                </Button>
              </Card>
            )}

            {/* Real-time Results - Show during active phases */}
            {(statements.length > 0 || gamePhase === 'voting') && gamePhase !== 'results' && (
              <RealTimeResults 
                statements={statements} 
                currentRound={gamePhase}
              />
            )}
          </div>

          {/* Statements Feed */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="flex items-center gap-2">
              Statements ({statements.length})
              {gamePhase === 'voting' && <span className="text-sm text-muted-foreground">- Vote now!</span>}
            </h3>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              <AnimatePresence>
                {statements.map((statement) => (
                  <StatementCard
                    key={statement.id}
                    statement={statement}
                    onVote={handleVote}
                    onFlag={handleFlag}
                    canVote={gamePhase === 'voting'}
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
        onClose={() => setAchievement(null)}
      />
    </div>
  );
}