export type Phase =
  | "lobby"
  | "round1"
  | "round2"
  | "round3"
  | "results";

export type SubPhase = "posting" | "voting" | "review";

export interface Statement {
  id: string;
  text: string;
  author: string;
  agrees: number;
  disagrees: number;
  passes: number;
  type?: string; // Will be calculated on backend later
  isSpicy?: boolean;
  roomId: string;
  timestamp: number;
  voters: { [userId: string]: "agree" | "disagree" | "pass" };
}

export interface Achievement {
  title: string;
  description: string;
  points: number;
  type: "score" | "streak";
}

export interface UserSession {
  id: string;
  nickname: string;
  score: number;
  streak: number;
  currentRoomId?: string;
  lastActive: number;
}

export interface DebateRoom {
  id: string;
  topic: string;
  phase: Phase;
  subPhase?: SubPhase;
  gameNumber: number;
  roundStartTime: number;
  participants: string[];
  isActive: boolean;
  createdAt: number;
}