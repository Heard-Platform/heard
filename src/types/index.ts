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
  mergedFrom?: Array<{ id: string; text: string }>;
  isHidden?: boolean;
  hiddenAt?: number | null;
  hiddenBy?: string | null;
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

export type CertifyCard = {
  type: "certify";
}

export type ChanceCard = {
  type: "chance";
}

export type CoverCard = {
  type: "cover";
  cover: FullCoverData;
}

export type FullCoverData =
  Cover & { description?: string };

export type StandardDemographicQuestionType =
  "gender" | "age_range" | "occupation";

export type DemographicQuestionType =
  StandardDemographicQuestionType | "custom";

export interface DemographicQuestion {
  id: string;
  roomId: string;
  type: DemographicQuestionType;
  text?: string;
  options?: string[];
};

export type NewDemographicQuestion =
  Omit<DemographicQuestion, "id" | "roomId"> & { draftId: string }

export type NewCustomDemographicQuestion = NewDemographicQuestion &
  Required<Pick<DemographicQuestion, "text" | "options">>;

export type DemographicsCard = {
  type: "demographics";
  question: DemographicQuestion;
}

export type Card = (StatementCard | CertifyCard | ChanceCard | CoverCard | DemographicsCard)
  & { isUnswipeable?: boolean };

export const isStatementCard = (card: Card): card is StatementCard => {
  return card.type === "statement";
};

export const isChanceCard = (card: Card): card is ChanceCard => {
  return card.type === "chance";
};

export const isCoverCard = (card: Card): card is CoverCard => {
  return card.type === "cover";
};

export const isDemographicsCard = (card: Card): card is DemographicsCard => {
  return card.type === "demographics";
};

export interface StatementMerge {
  id: string;
  roomId: string;
  sourceStatementId: string;
  targetStatementId: string;
  creatorId: string;
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  subtitle?: string;
  communityName: string;
  totalMembers: number;
  rooms: EventRoomStatus[];
  creatorId: string;
  createdAt: number;
}

export type NewEvent = Pick<
  Event,
  "name" | "subtitle" | "communityName"
>;

export type EventSummary = Pick<
  Event,
  "id" | "name" | "subtitle" | "communityName"
>;


export interface EventRoomStatus extends Pick<
  DebateRoom,
  | "id"
  | "topic"
  | "description"
  | "emoji"
  | "participants"
  | "createdAt"
  | "endTime"
> {
  status: RoomStatus;
  userHasVoted: boolean;
  newStatementCount: number;
  participantAvatars: AvatarAnimal[];
}

export type RoomStatus = "needs_input" | "caught_up" | "completed";

export type RoomAlertReason = "new-activity" | "ended";

export interface RoomAlert {
  roomId: string;
  topic: string;
  emoji?: string;
  subHeard?: string;
  reason: RoomAlertReason;
  lastActivityAt: number;
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
  emoji?: string;
  imageUrl?: string;
  youtubeUrl?: string;
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
  allowAnonymous?: boolean;
  anonymousLinkId?: string;
  isTestRoom?: boolean;
  chanceCardSwiped?: boolean;
  coverCardSwiped?: boolean;
  lastActivityAt?: number;
  totalVotes?: number;
  demographicQuestions: DemographicQuestion[];
  eventId?: number;
  responsesPaused?: boolean | null;
  responsesPausedAt?: number | null;
  responsesPausedBy?: string | null;
}

export type NewDebateRoom = Pick<
  DebateRoom,
  "topic" | "description" | "subHeard" | "allowAnonymous" | "eventId"
> & {
  seedStatements?: string[];
  cover?: Cover;
  debateLength: number;
  demographicQuestions: NewDemographicQuestion[];
};

export type Cover = {
  type: CoverType;
  url: string;
};

export type CoverType = "youtube" | "image";

export interface SubHeard {
  name: string;
  count?: number;
  adminId: string;
  isPrivate: boolean;
  hostOnlyPosting: boolean;
  createdAt?: number;
  modIds?: string[];
}

export interface Rant {
  id: string;
  text: string;
  author: string;
  roomId: string;
  timestamp: number;
}

export interface ClusterVoteBreakdown {
  clusterId: number;
  clusterSize: number;
  agreeVotes: number;
  superAgreeVotes: number;
  disagreeVotes: number;
  passVotes: number;
}

export interface StatementVotes {
  id: string;
  text: string;
  agreeVotes: number;
  rawAgreeVotes: number;
  superAgreeVotes: number;
  disagreeVotes: number;
  passVotes: number;
  consensusScore: number;
  totalVotes: number;
  mergedFrom: Array<{ id: string; text: string }>;
  clusterVotes: ClusterVoteBreakdown[];
}

export interface ClusterStatement {
  id: string;
  text: string;
  agreeVotes: number;
  disagreeVotes: number;
  totalVotes: number;
  distinguishingScore: number;
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

export type DemographicBreakdown = Record<
  string,
  { [option: string]: number }
>;

export interface AnalysisMetrics {
  totalParticipants: number;
  totalPosters: number;
  totalVoters: number;
  totalVotes: number;
  demographics: DemographicBreakdown;
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
  topAgreedPosts: StatementVotes[];
  topDisagreedPosts: StatementVotes[];
  spiciestPosts: StatementVotes[];
}

export interface AnalysisData extends AnalysisMetrics {
  debateTopic: string;
  totalStatements: number;
  clusterConsensus?: ClusterConsensus | null;
  allStatements: StatementVotes[];
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

export type ActivityFeedEventType =
  | "vote"
  | "statement"
  | "user"
  | "room"
  | "community"
  | "session"
  | "modInviteAccept"
  | "cohost"
  | "askTheData"
  | "userReport";

export interface ActivityFeedEvent {
  type: ActivityFeedEventType;
  timestamp: number;
  id: string;
  label: string;
  meta?: Record<string, string>;
}

export interface ActivityFeedData {
  events: ActivityFeedEvent[];
  fetchedAt: number;
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
  avatarAnimalUsers: number;
  avatarAnimalUsersSince: number;
  avatarAnimalData: { counts: Record<string, number> };
  phoneSubmissions: number;
  phoneSubmissionsSince: number;
  flyerScans: number;
  flyerScansSince: number;
  roomViews: number;
  roomViewsSince: number;
  roomFollows: number;
  roomFollowsSince: number;
  certifyCardShown: number;
  certifyCardShownSince: number;
  flyerResultsClicked: number;
  flyerResultsClickedSince: number;
  certifyCardData: {
    shown: number;
    emailSubmitted: number;
    phoneSubmitted: number;
    verified: number;
    dismissed: number;
  };
  oneBillionEvents: {
    pageLoad: number;
    clickProjects: number;
    clickOrg: number;
    clickForm: number;
    clickCopy: number;
  };
  fundingEvents: {
    pageView: number; pageViewUsers: number;
    swipeDonate: number; swipeDonateUsers: number;
    amountPickerOpened: number; amountPickerOpenedUsers: number;
    amountSelected: number; amountSelectedUsers: number;
    customAmountConfirmed: number; customAmountConfirmedUsers: number;
    checkoutStarted: number; checkoutStartedUsers: number;
    checkoutError: number; checkoutErrorUsers: number;
    donationSuccess: number; donationSuccessUsers: number;
    shareCopy: number; shareCopyUsers: number;
    shareNative: number; shareNativeUsers: number;
    shareDismissed: number; shareDismissedUsers: number;
    goToHeardClicked: number; goToHeardClickedUsers: number;
    substackLinkClicked: number; substackLinkClickedUsers: number;
    nugmodeToggled: number; nugmodeToggledUsers: number;
    exitClicked: number; exitClickedUsers: number;
    fallbackDonate: number; fallbackDonateUsers: number;
    teaserClicked: number; teaserClickedUsers: number;
    teaserDismissed: number; teaserDismissedUsers: number;
  };
  fundingEventsSince: number;
  cohostInviteAccepted: number;
  cohostInviteAcceptedSince: number;
  llmApiCalls: number;
  llmApiCallsSince: number;
  ggwashPublished: number;
  ggwashRejected: number;
  ggwashPending: number;
  ggwashSince: number;
  modInvitesAccepted: number;
  modInvitesAcceptedSince: number;
  askTheDataQuestions: number;
  askTheDataQuestionsSince: number;
}

export interface GGWashImportResult {
  posted: number;
  considered: number;
  skipped: number;
  preview?: {
    article: { title: string; url: string; imageUrl?: string } | null;
    topic: string | null;
    description: string | null;
    statements: string[] | null;
    rejected: boolean;
  };
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

export interface UserTimelineEntry {
  id: string;
  nickname: string;
  email: string;
  createdAt: number;
  lastActive: number;
  activeDays?: number[]; // UTC day-start timestamps for days with any action
  isTestUser?: boolean;
  isDeveloper?: boolean;
}

export interface VoteStats {
  total: number;
  uniqueVoters: number;
  avgVotesPerUser: number;
  byType: Record<string, number>;
  distributionByUser: Record<string, number>;
}

export interface SentEmail {
  id: string;
  recipientId: string;
  recipientEmail: string;
  template: string;
  sentAt: number;
  previewSubject?: string;
  previewHtml?: string;
}