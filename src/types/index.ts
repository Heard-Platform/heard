export type Phase =
  | "lobby"
  | "round1"
  | "round2"
  | "round3"
  | "results";

export type SubPhase = "ranting" | "voting" | "results";

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
  superAgrees: number; // Super agree count
  type?: string; // Will be calculated on backend later
  isSpicy?: boolean;
  roomId: string;
  timestamp: number;
  round: number; // Round number (1, 2, or 3)
  voters: { [userId: string]: VoteType };
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
  isDeveloper?: boolean; // Flag to indicate if this is a developer account
}

export type DebateMode = "realtime" | "host-controlled";

export interface DebateRoom {
  id: string;
  topic: string;
  description?: string; // Optional markdown description for context
  phase: Phase;
  subPhase?: SubPhase;
  gameNumber: number;
  roundStartTime: number;
  participants: string[];
  hostId: string; // ID of the user who created the room
  isActive: boolean;
  createdAt: number;
  mode: DebateMode; // Controls whether phases advance automatically or by host
  rantFirst?: boolean; // Whether this room starts with rants
  subHeard?: string; // Sub-heard name (like subreddits) - optional for backwards compatibility
}

export interface SubHeard {
  name: string;
  count: number;
}

export interface Rant {
  id: string;
  text: string;
  author: string;
  roomId: string;
  timestamp: number;
}