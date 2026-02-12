import { AnalysisMetrics } from "./analysis-utils.tsx";
import { ClusterConsensus } from "./cluster-analysis.tsx";

export interface User {
  id: string;
  nickname: string;
  email: string;
  phoneNumber?: string;
  score: number;
  streak: number;
  currentRoomId?: string;
  lastActive: number;
  isTestUser?: boolean;
  isDeveloper?: boolean;
  emailDigestsEnabled: boolean;
  isUnsubbedFromUpdates?: boolean;
  passwordHash?: string;
  supabaseAuthId?: string;
  phoneVerified?: boolean;
  phoneVerifiedAt?: number;
  migratedToSupabaseAt?: number;
  createdAt: number;
  isAnonymous?: boolean;
  flyerId?: string;
  convertedFromAnonAt?: number;
}

export type MagicLinkRecord = {
  userId: string;
  email: string;
  expiresAt: number;
};

export interface Session {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface UserReport {
  id: string;
  responseId: string;
  reportingUserId: string;
  createdAt: string;
}

export type NewUserReport = Omit<UserReport, "id" | "createdAt">;

export type Community = {
  name: string;
  adminId: string;
  isPrivate: boolean;
  hostOnlyPosting: boolean;
}

export type CommunityMembership = {
  userId: string;
  subHeard: string;
  joinedAt: number;
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
  anonymousUserId?: string;
}

export interface Vote {
  id: string;
  statementId: string;
  userId: string;
  voteType: VoteType;
  timestamp: number;
  flyerId?: string;
  anonymousUserId?: string;
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
  youtubeUrl?: string;
  allowAnonymous?: boolean;
  anonymousLinkId?: string;
  isTestRoom?: boolean;
  chanceCardSwiped?: boolean;
  youtubeCardSwiped?: boolean;
}

export type AnonCreatableRecords = "votes" | "statements" | "score";

export interface Rant {
  id: string;
  text: string;
  author: string;
  roomId: string;
  timestamp: number;
}

export interface ChanceCardStatus {
  userId: string;
  roomId: string;
  swipedAt: number;
}

export interface YouTubeCardStatus {
  userId: string;
  roomId: string;
  swipedAt: number;
}

export interface AnalysisData extends AnalysisMetrics {
  debateTopic: string;
  totalStatements: number;
  clusterConsensus?: ClusterConsensus | null;
}

export interface SentEmail {
  id: string;
  userId: string;
  sentAt: number;
  emailType: string;
}