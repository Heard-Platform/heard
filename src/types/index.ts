export type Phase =
  | "lobby"
  | "initial"
  | "bridge"
  | "crux"
  | "plurality"
  | "results";

export type SubPhase = "posting" | "voting" | "review";

export interface Statement {
  id: string;
  text: string;
  author: string;
  agrees: number;
  disagrees: number;
  passes: number;
  type?: "bridge" | "crux" | "plurality";
  isSpicy?: boolean;
  roomId: string;
  timestamp: number;
  voters: { [userId: string]: "agree" | "disagree" | "pass" };
}

export interface Achievement {
  title: string;
  description: string;
  points: number;
  type: "score" | "bridge" | "crux" | "plurality" | "streak";
}

export interface UserSession {
  id: string;
  nickname: string;
  score: number;
  bridgePoints: number;
  cruxPoints: number;
  pluralityPoints: number;
  streak: number;
  currentRoomId?: string;
  lastActive: number;
}

export interface DebateRoom {
  id: string;
  topic: string;
  phase: Phase;
  subPhase?: SubPhase;
  roundNumber: number;
  phaseStartTime: number;
  participants: string[];
  isActive: boolean;
  createdAt: number;
}