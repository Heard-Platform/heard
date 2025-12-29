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

export type SortBy = VoteType | "none";

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

export type StatementCard = {
  type: "statement";
  statement: Statement;
}

export type ChanceCard = {
  type: "chance";
}

export type Card = StatementCard | ChanceCard;

export const isStatementCard = (card: Card): card is StatementCard => {
  return card.type === "statement";
};

export const isChanceCard = (card: Card): card is ChanceCard => {
  return card.type === "chance";
};

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
  isTestUser?: boolean;
  isDeveloper?: boolean;
  createdAt: number;
  isAnonymous?: boolean;
}

export type DebateMode = "realtime" | "host-controlled";

export interface DebateRoom {
  id: string;
  topic: string;
  description?: string;
  imageUrl?: string;
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
  allowAnonymous?: boolean;
  anonymousLinkId?: string;
  isTestRoom?: boolean;
  chanceCardSwiped?: boolean;
}

export type NewDebateRoom = Pick<
  DebateRoom,
  "topic" | "subHeard" | "allowAnonymous"
> & {
  seedStatements?: string[];
  imageUrl?: string;
  debateLength: number;
};

export interface SubHeard {
  name: string;
  count?: number; // Number of active debates (used in browser)
  createdAt?: number; // Timestamp when created (used in admin panel)
  isPrivate?: boolean;
  adminId?: string; // User ID of the creator/admin
}

export interface Rant {
  id: string;
  text: string;
  author: string;
  roomId: string;
  timestamp: number;
}

export interface TopPost {
  id: string;
  text: string;
  agreeVotes: number;
  disagreeVotes: number;
  passVotes: number;
  consensusScore: number;
  totalVotes: number;
}

export interface ClusterStatement {
  id: string;
  text: string;
  agreeVotes: number;
  totalVotes: number;
  consensusScore: number;
}

export interface Cluster {
  id: number;
  size: number;
  statements: ClusterStatement[];
}

export interface ClusterConsensus {
  totalClusters: number;
  clusters: Cluster[];
}

export interface AnalysisMetrics {
  totalParticipants: number;
  totalPosters: number;
  totalVoters: number;
  totalVotes: number;
  participation: number;
  consensusData: {
    highConsensusPostCount: number;
    consensus: number;
  };
  spicinessData: {
    lowConsensusPostCount: number;
    spiciness: number;
  };
  reachData: {
    postersWithHighConsensusPost: number;
    reach: number;
  };
  topPosts: TopPost[];
  spiciestPosts: TopPost[];
}

export interface AnalysisData extends AnalysisMetrics {
  debateTopic: string;
  totalStatements: number;
  clusterConsensus?: ClusterConsensus | null;
}

export interface UserPresence {
  userId: string;
  currentRoomIndex: number;
  lastUpdated: number;
}

export interface AdminUser {
  userId: string;
  name: string;
  lastSeen: number;
}