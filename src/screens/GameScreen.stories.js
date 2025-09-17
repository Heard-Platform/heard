
import { fn } from 'storybook/test';
import { GameScreen } from '../screens/GameScreen';

const mockStatements = [
  {
    id: '1',
    text: 'Fox can KO at 60% with up-smash. That is wild.',
    author: 'Alice',
    votes: 5,
    type: 'crux',
  },
  {
    id: '2',
    text: 'His shine comes out frame 1. No other character has that!',
    author: 'Bob',
    votes: 3,
    type: 'crux',
  },
  {
    id: '3',
    text: 'Fox is only OP if you have good tech skill. Most players just SD.',
    author: 'Carol',
    votes: 2,
    type: 'bridge',
  },
];

const mockUser = {
  score: 120,
  bridgePoints: 30,
  cruxPoints: 50,
  pluralityPoints: 40,
  streak: 2,
};

const baseRoom = {
  id: 'room1',
  topic: 'Fox is overpowered in Super Smash Bros.',
  roundNumber: 2,
  phaseStartTime: Date.now() - 45000,
  participants: ['Alice', 'Bob', 'Carol'],
  isActive: true,
  createdAt: Date.now() - 60000,
};

export default {
  title: 'Screens/GameScreen',
  component: GameScreen,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {
    onSubmitStatement: fn(),
    onVote: fn(),
    onNextPhase: fn(),
    onStartDebate: fn(),
    onLeaveRoom: fn(),
    onNewDiscussion: fn(),
    onScheduleFuture: fn(),
  },
};

export const Lobby = {
  args: {
    user: mockUser,
    room: { ...baseRoom, phase: 'lobby' },
    statements: [],
    timerActive: false,
    lastAchievement: null,
  },
};

export const InitialRound = {
  args: {
    user: mockUser,
    room: { ...baseRoom, phase: 'initial' },
    statements: mockStatements,
    timerActive: true,
    lastAchievement: null,
  },
};

export const MidRound = {
  args: {
    user: mockUser,
    room: { ...baseRoom, phase: 'crux' },
    statements: mockStatements,
    timerActive: true,
    lastAchievement: null,
  },
};

export const VotingPhase = {
  args: {
    user: mockUser,
    room: { ...baseRoom, phase: 'voting' },
    statements: mockStatements,
    timerActive: false,
    lastAchievement: null,
  },
};

export const ResultsPhase = {
  args: {
    user: mockUser,
    room: { ...baseRoom, phase: 'results' },
    statements: mockStatements,
    timerActive: false,
    lastAchievement: null,
  },
};

export const WithAchievement = {
  args: {
    user: mockUser,
    room: { ...baseRoom, phase: 'results' },
    statements: mockStatements,
    timerActive: false,
    lastAchievement: {
      type: 'streak',
      title: 'Hot Streak!',
      description: 'You won 3 rounds in a row!',
      icon: 'flame',
    },
  },
};

export const LobbySinglePlayer = {
  args: {
    user: mockUser,
    room: { ...baseRoom, phase: 'lobby', participants: ['Alice'] },
    statements: [],
    timerActive: false,
    lastAchievement: null,
  },
};
