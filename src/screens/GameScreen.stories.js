import { fn } from 'storybook/test';
import { GameScreen } from '../screens/GameScreen';

const mockUser = {
  score: 120,
  bridgePoints: 30,
  cruxPoints: 50,
  pluralityPoints: 40,
  streak: 2,
};

const mockRoom = {
  id: 'room1',
  topic: 'Fox is overpowered in Super Smash Bros.',
  phase: 'crux',
  roundNumber: 2,
  phaseStartTime: Date.now() - 45000, // 45 seconds ago
  participants: ['Alice', 'Bob', 'Carol'],
  isActive: true,
  createdAt: Date.now() - 60000,
};

const mockStatements = [
  {
    id: 's1',
    text: 'Fox can KO at 60% with up-smash. That is wild.',
    author: 'Alice',
    votes: 5,
    type: 'crux',
  },
  {
    id: 's2',
    text: 'His shine comes out frame 1. No other character has that!',
    author: 'Bob',
    votes: 3,
    type: 'crux',
  },
  {
    id: 's3',
    text: 'Fox is only OP if you have good tech skill. Most players just SD.',
    author: 'Carol',
    votes: 2,
    type: 'bridge',
  },
];

export default {
  title: 'Screens/GameScreen',
  component: GameScreen,
  parameters: {
    layout: 'centered',
  },
};

export const MidRound = {
  args: {
    user: mockUser,
    room: mockRoom,
    statements: mockStatements,
    timerActive: true,
    lastAchievement: null,
    onSubmitStatement: fn(),
    onVote: fn(),
    onNextPhase: fn(),
    onStartDebate: fn(),
    onLeaveRoom: fn(),
    onNewDiscussion: fn(),
    onScheduleFuture: fn(),
  },
};
