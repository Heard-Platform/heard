import { AnalysisMetrics } from "./analysis-utils.tsx";
import { ClusterConsensus } from "./cluster-analysis.tsx";
import { VALID_AVATARS } from "./constants.tsx";

export interface User {
  id: string;
  nickname: string;
  email: string;
  phoneNumber?: string;
  avatarAnimal?: AvatarAnimal;
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
  flyerGroup?: number;
  convertedFromAnonAt?: number;
  createdInEnvironment?: string;
  tosAgreedToAt?: number;
  tosVersion?: string;
  privacyPolicyAgreedToAt?: number;
  privacyPolicyVersion?: string;
  ipAddress?: string;
  fingerprint?: string;
  userAgent?: string;
  webdriver?: boolean;
}

export type AvatarAnimal = (typeof VALID_AVATARS)[number];

export type UserActivityRecord = {
  date: string;
  userId: string;
  timestamp: number;
};

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

export interface UserPresence {
  userId: string;
  currentRoomIndex: number;
  lastUpdated: number;
  avatarAnimal: AvatarAnimal;
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

export type DemographicQuestionType =
  | "gender"
  | "age_range"
  | "occupation"
  | "custom";

export interface DemographicQuestion {
  id: number;
  roomId: string;
  type: DemographicQuestionType;
  text?: string;
  options?: string[];
};

export interface DemographicAnswer {
  id: number;
  userId: string;
  questionId: number;
  answer: string | null;
  createdAt: number;
};

export type NewDemographicAnswer =
  Omit<DemographicAnswer, "id" | "createdAt">;


export type Event = {
  id: string;
  name: string;
  subtitle: string;
  communityName: string;
  creatorId: string;
  createdAt: number;
};

export type NewEvent = Omit<Event, "id" | "createdAt">;

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
  lastActivityAt?: number;
  totalVotes?: number;
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

export enum InternalVarKey {
  ENRICHMENT_ON = "ENRICHMENT_ON",
  ENRICHMENT_AVG_INTERVAL_MINS = "ENRICHMENT_AVG_INTERVAL_MINS",
}

export interface InternalVar {
  key: InternalVarKey;
  value: string;
}

export interface EnrichmentConfig {
  enabled: boolean;
  averageIntervalMins: number;
}

export interface RedditScrapeCriteria {
  subredditName: string;
  maxPostAgeMins: number;
  postLimit: number;
}

export type RedditFeedItem = {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  isoDate: string;
};

export type RedditPost = Pick<RedditFeedItem, "title" | "pubDate"> & {
  subredditDescription: string,
  selfText: string,
  subreddit: string,
};

export type AiPrompt = {
  systemPrompt: string;
  userPrompt: string;
};