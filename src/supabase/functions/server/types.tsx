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
  durationMs?: number;
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
  mergedIntoUserId?: string;
  upgradedFromAnonymousAt?: number;
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

export type EmailLoginLinkRecord = {
  userId: string;
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
  expiryBypassedAt?: number;
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

export type SimpleVoteType = Exclude<VoteType, "super_agree">;

export type StatementApprovalDecision = "approve" | "reject";

export interface RoomAwaitingApproval {
  roomId: string;
  topic: string;
  statements: Statement[];
}

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
  flyerGroup?: number;
  anonymousUserId?: string;
}

export type DemographicQuestionType =
  | "gender"
  | "age_range"
  | "occupation"
  | "custom";

export interface DemographicQuestion {
  id: number;
  roomId: string | null;
  eventId: number | null;
  type: DemographicQuestionType;
  text?: string;
  options?: string[];
  multiSelect: boolean;
  position: number | null;
};

export interface AudienceBreakdownOption {
  label: string;
  percent: number;
  isOptOut: boolean;
}

export interface AudienceBreakdownQuestion {
  questionId: number;
  text: string;
  multiSelect: boolean;
  hasEnoughAnswers: boolean;
  options: AudienceBreakdownOption[];
  hasHiddenAnswers: boolean;
}

export type RoomDemographicQuestion = DemographicQuestion & {
  roomId: string;
};

export type NewRoomDemographicQuestion = Omit<
  DemographicQuestion,
  "eventId" | "multiSelect" | "position"
>;

export type NewEventDemographicQuestion = Omit<
  DemographicQuestion,
  "id"
>;

export interface EventOnboardingQuestionInput {
  text: string;
  options: string[];
  multiSelect: boolean;
}

export interface EventOnboardingQuestionList {
  questions: DemographicQuestion[];
  hasAnswers: boolean;
}

export interface AttendeeOnboarding {
  questions: DemographicQuestion[];
  answeredQuestionIds: number[];
}

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

export type LiveEventStatus = "setup" | "open" | "live" | "ended";

export type EventTotals = {
  people: number;
  votes: number;
  statementsFromRoom: number;
  stayedToEndPercent: number;
};

export type PostChange = {
  roomId: string;
  changedAt: number;
};

export type LiveEventState = {
  roomOrder: string[];
  currentIndex: number | null;
  status: LiveEventStatus;
  isIntroducingPost: boolean;
  votingPaused: boolean;
  reloadNonce: number;
  totals: EventTotals | null;
  postChanges: PostChange[];
  startedAt: number | null;
  endedAt: number | null;
  updatedAt: number;
};

export type LiveEventView = LiveEventState & {
  currentRoomId: string | null;
  peopleHere: number;
  answeringQuestions: number;
  finishedCurrentPost: number;
};

export type LiveScreen =
  | "onboarding"
  | "lobby"
  | "swiping"
  | "waiting"
  | "end";

export type AttendeePhoneState =
  | "swiping"
  | "waiting"
  | "onboarding"
  | "lobby"
  | "end"
  | "idle";

export type SupportViewCurrentPost = {
  postNumber: number;
  topic: string;
  finishedCount: number;
  swipingCount: number;
  agreeVotes: number;
  disagreeVotes: number;
  passVotes: number;
  medianSecondsToFinish: number | null;
  startedAt: number;
};

export type SupportViewPost = {
  roomId: string;
  postNumber: number;
  topic: string;
  voterCount: number;
  secondsOnPost: number;
};

export type SupportViewAttendeeStatement = {
  id: string;
  roomId: string;
  postNumber: number;
  text: string;
  agreeVotes: number;
  disagreeVotes: number;
  passVotes: number;
  isAwaitingApproval: boolean;
  isHidden: boolean;
  createdAt: number;
};

export type SupportViewMinute = {
  minuteSinceStart: number;
  votes: number;
  peopleJoined: number;
};

export type SupportViewStats = {
  eventName: string;
  status: LiveEventStatus;
  isIntroducingPost: boolean;
  votingPaused: boolean;
  postCount: number;
  peopleHere: number;
  activeNow: number;
  votes: number;
  statementsFromRoom: number;
  phoneCountsByState: Record<AttendeePhoneState, number>;
  currentPost: SupportViewCurrentPost | null;
  postsSoFar: SupportViewPost[];
  attendeeStatements: SupportViewAttendeeStatement[];
  minutes: SupportViewMinute[];
  nextPressedAtMinutes: number[];
  startedAt: number | null;
  endedAt: number | null;
};

export type EventReportOpening = {
  eventName: string;
  eventSubtitle: string | null;
  peopleCount: number;
  voteCount: number;
  postCount: number;
  attendeeStatementCount: number;
  averagePostParticipationPercent: number;
  sessionStartedAt: number;
  sessionEndedAt: number;
};

export type EventReportStatement = {
  statementId: string;
  text: string;
  agreePercent: number;
  disagreePercent: number;
};

export type EventReportPost = {
  roomId: string;
  postNumber: number;
  topic: string;
  voterCount: number;
  secondsOnPost: number;
  mostAgreedStatement: EventReportStatement | null;
  mostSplitStatement: EventReportStatement | null;
  topAttendeeStatement: EventReportStatement | null;
};

export type EventReportAttendeeStatement = EventReportStatement & {
  postNumber: number;
  voteCount: number;
};

export type EventReportFloor = {
  attendeeCount: number;
  attendeeStatementVoteCount: number;
  attendeeStatementsInTopTenCount: number;
  averageAttendeeAgreePercent: number;
  averagePreparedAgreePercent: number;
  topAttendeeStatements: EventReportAttendeeStatement[];
  lowVoteAttendeeStatements: EventReportAttendeeStatement[];
};

export type EventReportCampStatement = {
  statementId: string;
  text: string;
  postNumber: number;
  isAttendeeStatement: boolean;
  campAgreePercent: number;
  otherCampsAgreePercent: number;
};

export type EventReportCamp = {
  campId: string;
  name: string;
  memberCount: number;
  sizePercent: number;
  representativeStatements: EventReportCampStatement[];
};

export type EventReportCampAgreement = {
  campId: string;
  agreePercent: number;
};

export type EventReportStatementByCamp = {
  statementId: string;
  text: string;
  postNumber: number;
  isAttendeeStatement: boolean;
  overallAgreePercent: number;
  campAgreements: EventReportCampAgreement[];
};

export type EventReportBridge = {
  campIds: [string, string];
  statement: EventReportStatementByCamp;
};

export type EventReportCampAnalysis = {
  camps: EventReportCamp[];
  statementsByCamp: EventReportStatementByCamp[];
  bridges: EventReportBridge[];
  commonGroundStatement: EventReportStatementByCamp | null;
};

export type EventReportTimelineBin = {
  secondsSinceStart: number;
  activeVoterCount: number;
};

export type EventReportPromptStart = {
  postNumber: number;
  secondsSinceStart: number;
};

export type EventReportAttendeeStatementAdded = {
  statementId: string;
  text: string;
  secondsSinceStart: number;
};

export type EventReportTimeline = {
  binSeconds: number;
  bins: EventReportTimelineBin[];
  promptStarts: EventReportPromptStart[];
  attendeeStatementsAdded: EventReportAttendeeStatementAdded[];
};

export type EventReport = {
  opening: EventReportOpening;
  posts: EventReportPost[];
  floor: EventReportFloor;
  campAnalysis: EventReportCampAnalysis;
  timeline: EventReportTimeline;
};

export type EventReportCampNames = {
  membershipSignature: string;
  names: string[];
  namedAt: number;
};

export type LiveHeartbeat = {
  shownRoomId: string | null;
  screen: LiveScreen;
};

export type EventPresence = LiveHeartbeat & {
  userId: string;
  updatedAt: number;
};

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
  requiresStatementApproval?: boolean;
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
  restartedAt?: number;
}

export interface RoomView {
  userId: string;
  roomId: string;
  lastSeenAt: number;
}

export interface AppFeedbackVote {
  userId: string;
  statementKey: string;
  vote: VoteType;
  roomId: string;
  votedAt: number;
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
  | "youtubeCardStatuses"
  | "roomViews"
  | "appFeedbackVotes"
  | "feedbackNotes";

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
  roomId?: string;
}

export enum InternalVarKey {
  ENRICHMENT_ON = "ENRICHMENT_ON",
  ENRICHMENT_AVG_INTERVAL_MINS = "ENRICHMENT_AVG_INTERVAL_MINS",
  CLUSTER_NAMING_ON = "CLUSTER_NAMING_ON",
  FLYER_RESULTS_MAILER_ON = "FLYER_RESULTS_MAILER_ON",
}

export interface InternalVar {
  key: InternalVarKey;
  value: string;
}

export type RateLimitedActionType = "statement";

export interface RateLimitedAction {
  userId: string;
  type: RateLimitedActionType;
  lastActionAt: number;
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
export interface NewFlyerPlacement {
  roomId: string;
  statementId: string;
  flyerGroup: number;
  latitude: number;
  longitude: number;
  headingDeg: number | null;
  createdBy: string;
}

export interface FlyerPlacement extends NewFlyerPlacement {
  id: string;
  createdAt: string;
}
