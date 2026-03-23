import { AvatarAnimal } from "../utils/constants/avatars";

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

export type VoteTypeNew = Exclude<VoteType, "super_agree">;

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

export interface Comment {
  id: string;
  statementId: string;
  userId: string;
  text: string;
  timestamp: number;
}

export type StatementCard = {
  type: "statement";
  statement: Statement;
}

export type ChanceCard = {
  type: "chance";
}

export type YouTubeCard = {
  type: "youtube";
  url: string;
}

export type DemographicQuestionType =
  | "gender"
  | "age_range"
  | "occupation"
  | "custom";

export type DemographicQuestion = {
  id: string;
  type: DemographicQuestionType;
  text?: string;
  options?: string[];
}

export type DemographicsCard = {
  type: "demographics";
  question: DemographicQuestion;
  isUnswipeable: true;
}

export type Card = (StatementCard | ChanceCard | YouTubeCard | DemographicsCard)
  & { isUnswipeable?: boolean };

export const isStatementCard = (card: Card): card is StatementCard => {
  return card.type === "statement";
};

export const isChanceCard = (card: Card): card is ChanceCard => {
  return card.type === "chance";
};

export const isYouTubeCard = (card: Card): card is YouTubeCard => {
  return card.type === "youtube";
};

export const isDemographicsCard = (card: Card): card is DemographicsCard => {
  return card.type === "demographics";
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
  phoneSuffix?: string;
  score: number;
  streak: number;
  currentRoomId?: string;
  lastActive: number;
  isTestUser?: boolean;
  isDeveloper?: boolean;
  createdAt: number;
  isAnonymous?: boolean;
  isUnsubbedFromUpdates?: boolean;
  phoneVerified?: boolean;
  flyerId?: string;
  convertedFromAnonAt?: number;
  createdInEnvironment?: string;
  avatarAnimal?: AvatarAnimal;
}

export type DebateMode = "realtime" | "host-controlled";

export interface DebateRoom {
  id: string;
  topic: string;
  description?: string;
  imageUrl?: string;
  youtubeUrl?: string;
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
  youtubeCardSwiped?: boolean;
}

export type NewDebateRoom = Pick<
  DebateRoom,
  "topic" | "subHeard" | "allowAnonymous"
> & {
  seedStatements?: string[];
  imageUrl?: string;
  youtubeUrl?: string;
  debateLength: number;
};

export interface SubHeard {
  name: string;
  count?: number;
  adminId: string;
  isPrivate: boolean;
  hostOnlyPosting: boolean;
  createdAt?: number;
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
  avatarAnimal: AvatarAnimal;
}

export type DryRunResult = {
  summary: {
    debateName: string;
    subHeard: string;
    userCount: number;
    statementCount: number;
    voteCount: number;
    avgVotesPerStatement: string;
  };
  room: {
    topic: string;
    phase: string;
    mode: string;
    participantCount: number;
  };
  voteDistribution: {
    agree: number;
    disagree: number;
    pass: number;
  };
  samples: {
    users: Array<{ nickname: string; email: string; isTestUser: boolean }>;
    statements: Array<{ text: string; author: string; agrees: number; disagrees: number; passes: number }>;
  };
  warnings: string[];
};

export interface Feedback {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
  createdAt: string;
}

export interface ActivityMetricsData {
  dau: number;
  wau: number;
  mau: number;
  dailyBreakdown: Array<{ date: string; activeUsers: number }>;
  calculatedAt: string;
}

export interface PublicStatsData {
  totalUsers: number;
  totalSubHeards: number;
  totalDebates: number;
  usersSparkline: Array<{ day: number; count: number; timestamp: number }>;
  subHeardsSparkline: Array<{ day: number; count: number; timestamp: number }>;
  debatesSparkline: Array<{ day: number; count: number; timestamp: number }>;
}

export interface RetentionStatsData {
  d1Retention: { rate: number; eligible: number; retained: number; totalInCohort: number };
  d7Retention: { rate: number; eligible: number; retained: number; totalInCohort: number };
  d30Retention: { rate: number; eligible: number; retained: number; totalInCohort: number };
}

export interface FunnelMetricsData {
  users: number;
  flyerUsers: number;
  flyerEmails: number;
  flyerUsersWithAccounts: number;
  createdAccount: number;
  tookAction: number;
  tookActionTwoDays: number;
  tookActionTenDays: number;
}

export interface FeatureResults {
  webDriverUsers: number;
  webDriverUsersSince: number;
  uniqueIpAddresses: number;
  uniqueIpAddressesSince: number;
  uniqueFingerprints: number;
  uniqueFingerprintsSince: number;
  uniqueUserAgents: number;
  uniqueUserAgentsSince: number;
  tosAgreedUsers: number;
  tosAgreedSince: number;
  privacyPolicyAgreedUsers: number;
  privacyPolicyAgreedSince: number;
  flyerEmails: number;
  flyerEmailsSince: number;
  userReports: number;
  userReportsSince: number;
  phoneVerifiedUsers: number;
  phoneVerifiedSince: number;
  convertedFromAnonUsers: number;
  convertedFromAnonSince: number;
  flyerUsers: number;
  flyerUsersSince: number;
}

export interface UserHistoryData {
  rooms: any[];
  statements: any[];
  votes: any[];
  rants: any[];
  activities: any[];
}

export interface DevAnonDebate extends DebateRoom {
  invitePath: string;
  anonymousLinkId: Required<DebateRoom>["anonymousLinkId"];
}

export interface EnrichmentConfig {
  enabled: boolean;
  averageIntervalMins: number;
}

export type Environment = "production" | "development";