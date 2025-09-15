import { fn } from 'storybook/test';
import { GameView } from '../components/GameView';

const mockStatements = [
  {
    id: '1',
    text: 'AI will solve more problems than it creates.',
    author: 'Alice',
    votes: 5,
    type: 'crux',
  },
  {
    id: '2',
    text: 'We need to consider both sides.',
    author: 'Bob',
    votes: 3,
    type: 'bridge',
  },
  {
    id: '3',
    text: 'What about underrepresented perspectives? 🌶️',
    author: 'Carol',
    votes: 2,
    type: 'plurality',
    isSpicy: true,
  },
];

const mockAchievement = {
  id: 'ach1',
  title: 'Crux Submitted!',
  description: '+100 points',
  points: 100,
  type: 'crux',
};

export default {
  title: 'Components/GameView',
  component: GameView,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {
    onStartGame: fn(),
    onResetGame: fn(),
    onNextPhase: fn(),
    onStatementSubmit: fn(),
    onVote: fn(),
    onFlag: fn(),
    onAchievementClose: fn(),
  },
};

export const Lobby = {
  args: {
  gamePhase: 'lobby',
    statements: [],
    score: 0,
    bridgePoints: 0,
    cruxPoints: 0,
    pluralityPoints: 0,
    streak: 0,
    roundNumber: 1,
    achievement: null,
    timerActive: false,
    currentTopic: 'AI will solve more problems than it creates.',
  },
};

export const InitialRound = {
  args: {
  gamePhase: 'initial',
    statements: mockStatements,
    score: 120,
    bridgePoints: 50,
    cruxPoints: 70,
    pluralityPoints: 30,
    streak: 2,
    roundNumber: 1,
    achievement: mockAchievement,
    timerActive: true,
    currentTopic: 'AI will solve more problems than it creates.',
  },
};

export const VotingPhase = {
  args: {
  gamePhase: 'voting',
    statements: mockStatements,
    score: 150,
    bridgePoints: 60,
    cruxPoints: 80,
    pluralityPoints: 40,
    streak: 3,
    roundNumber: 1,
    achievement: null,
    timerActive: false,
    currentTopic: 'AI will solve more problems than it creates.',
  },
};

export const ResultsPhase = {
  args: {
  gamePhase: 'results',
    statements: mockStatements,
    score: 200,
    bridgePoints: 80,
    cruxPoints: 100,
    pluralityPoints: 60,
    streak: 4,
    roundNumber: 2,
    achievement: null,
    timerActive: false,
    currentTopic: 'AI will solve more problems than it creates.',
  },
};
