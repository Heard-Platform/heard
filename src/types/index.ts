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
  round: number; // Round number (1, 2, or 3)
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
  email: string;
  score: number;
  streak: number;
  currentRoomId?: string;
  lastActive: number;
  isTestUser?: boolean; // Flag to indicate if this is a test/fake user
}

export type DebateMode = "realtime" | "host-controlled";

export interface DebateRoom {
  id: string;
  topic: string;
  phase: Phase;
  subPhase?: SubPhase;
  gameNumber: number;
  roundStartTime: number;
  participants: string[];
  hostId: string; // ID of the user who created the room
  isActive: boolean;
  createdAt: number;
  mode: DebateMode; // Controls whether phases advance automatically or by host
  rantFirst?: boolean; // Whether this room starts with AI-compiled rants
}

export interface Rant {
  id: string;
  text: string;
  author: string;
  roomId: string;
  timestamp: number;
}