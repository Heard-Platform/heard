import { AnalysisMetrics } from "./analysis-utils.tsx";
import { ClusterConsensus } from "./cluster-analysis.tsx";
import { VALID_AVATARS } from "./constants.tsx";

export interface UserEvent {
  id?: string;
  type: string;
  userId: string | null;
  roomId?: string;
  url?: string;
  referralUserId?: string;
  createdAt: number;
  sessionId?: string | null;
}

export type NewUserEvent = Omit<UserEvent, "createdAt" | "id" | "sessionId">;

export interface AskTheDataRecord {
  id: string;
  roomId: string;
  userId: string;
  question: string;
  answer: string;
  status: "answered" | "rejected";
  createdAt: number;
}

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
  email: string;
  expiresAt: number;
};

export type CohostInviteRecord = {
  roomId: string;
  createdBy: string;
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
  reason: string;
}

export type NewUserReport = Omit<UserReport, "id" | "createdAt">;

export type Community = {
  name: string;
  displayName?: string;
  adminId: string;
  isPrivate: boolean;
  hostOnlyPosting: boolean;
  modIds?: string[];
}

export type ModInviteRecord = {
  subHeardName: string;
  createdBy: string;
  expiresAt: number;
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
  mergedFrom?: Array<{ id: string; text: string }>;
  isHidden?: boolean;
  hiddenAt?: number | null;
  hiddenBy?: string | null;
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


export interface StatementMerge {
  id: string;
  roomId: string;
  sourceStatementId: string;
  targetStatementId: string;
  creatorId: string;
  createdAt: string;
}

export interface StatementTag {
  id: string;
  roomId: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface StatementTagLink {
  statementId: string;
  tagId: string;
  roomId: string;
  createdBy: string;
  createdAt: string;
}

export type Event = {
  id: number;
  name: string;
  subtitle: string;
  communityName: string;
  creatorId: string;
  createdAt: number;
};

export type NewEvent = Pick<
  Event,
  "name" | "subtitle" | "communityName" | "creatorId"
>;

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
  emoji?: string;
  phase: Phase;
  subPhase?: SubPhase;
  gameNumber: number;
  roundStartTime: number;
  participants: string[];
  hostId: string;
  cohostIds?: string[];
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
  coverCardSwiped?: boolean;
  lastActivityAt?: number;
  totalVotes?: number;
  eventId?: number;
  responsesPaused?: boolean | null;
  responsesPausedAt?: number | null;
  responsesPausedBy?: string | null;
}

export interface RoomView {
  userId: string;
  roomId: string;
  lastSeenAt: number;
}

export interface RoomFollow {
  userId: string;
  roomId: string;
  followedAt: number;
}

export type AnonCreatableRecords =
  | "votes"
  | "statements"
  | "score"
  | "coverCardSwipes"
  | "cardSwipes"
  | "chanceCardStatuses"
  | "youtubeCardStatuses";

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

export interface GGWashArticle {
  title: string;
  body: string;
  url: string;
  guid: string;
  imageUrl?: string;
  publishedAt: number;
}

export type ScrapedItemStatus =
  | "scraped"
  | "attempting"
  | "published"
  | "rejected";

export interface ScrapedItem {
  guid: string;
  title: string;
  bodyExcerpt: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: number;
  scrapedAt: number;
  status: ScrapedItemStatus;
  rank?: number;
  generatedTopic?: string;
  generatedStatements?: string[];
  publishedRoomId?: string;
  error?: string;
  decidedAt?: number;
}