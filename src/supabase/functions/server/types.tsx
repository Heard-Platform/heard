export interface UserSession {
  id: string;
  nickname: string;
  email: string;
  score: number;
  streak: number;
  currentRoomId?: string;
  lastActive: number;
  isTestUser?: boolean;
  isDeveloper?: boolean;
  passwordHash?: string;
  createdAt: number;
}

export type VoteType =
  | "agree"
  | "disagree"
  | "pass"
  | "super_agree";

export interface Statement {
  id: string;
  text: string;
  author: string;
  agrees: number;
  disagrees: number;
  passes: number;
  superAgrees: number;
  type?: string;
  isSpicy?: boolean;
  roomId: string;
  timestamp: number;
  round: number;
  voters: { [userId: string]: VoteType };
}

export interface Vote {
  id: string;
  statementId: string;
  userId: string;
  voteType: VoteType;
  timestamp: number;
}

export type Phase =
  | "lobby"
  | "round1"
  | "round2"
  | "round3"
  | "results";

export type SubPhase = "posting" | "voting" | "review";

export type DebateMode = "realtime" | "host-controlled";

export interface DebateRoom {
  id: string;
  topic: string;
  description?: string;
  phase: Phase;
  subPhase?: SubPhase;
  gameNumber: number;
  roundStartTime: number;
  participants: string[];
  hostId: string;
  isActive: boolean;
  createdAt: number;
  mode: DebateMode;
  rantFirst?: boolean;
  subHeard?: string;
  endTime?: number;
  imageUrl?: string;
}

export interface Rant {
  id: string;
  text: string;
  author: string;
  roomId: string;
  timestamp: number;
}