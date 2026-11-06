import _ from "lodash";
import { canModerateEvent } from "./live-event-utils.ts";
import { RouteError } from "./route-error.ts";
import {
  filterSessionVotes,
  listPostsSoFar,
} from "./support-view-utils.ts";
import { toSimpleVote } from "./vote-type-utils.ts";
import type {
  Community,
  DebateRoom,
  Event,
  EventReport,
  EventReportAttendeeStatement,
  EventReportCampAnalysis,
  EventReportFloor,
  EventReportOpening,
  EventReportPost,
  EventReportStatement,
  EventReportTimeline,
  LiveEventState,
  PostChange,
  Statement,
  Vote,
} from "./types.tsx";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;

export const TIMELINE_BIN_SECONDS = 20;
export const FINAL_POST_QUIET_GAP_MS = 3 * MINUTE_MS;
export const UNVOTED_FINAL_POST_LENGTH_MS = 5 * MINUTE_MS;
export const MIN_VOTES_TO_RANK_STATEMENT = 5;

const TOP_ATTENDEE_STATEMENT_COUNT = 5;
const LOW_VOTE_ATTENDEE_STATEMENT_COUNT = 3;
const TOP_STATEMENT_COUNT = 10;

export const EMPTY_CAMP_ANALYSIS: EventReportCampAnalysis = {
  camps: [],
  statementsByCamp: [],
  bridges: [],
  commonGroundStatement: null,
};

export type EventReportVote = Pick<
  Vote,
  "statementId" | "userId" | "voteType" | "timestamp"
> & { roomId: string };

export type EventReportState = Pick<
  LiveEventState,
  "roomOrder" | "postChanges" | "startedAt" | "endedAt"
>;

export interface EventReportInputs {
  event: Pick<Event, "name" | "subtitle" | "creatorId">;
  community: Pick<Community, "adminId" | "modIds"> | null;
  state: EventReportState;
  rooms: Pick<DebateRoom, "id" | "topic">[];
  statements: Statement[];
  votes: EventReportVote[];
  now: number;
}

interface StatementTally {
  statement: Statement;
  postNumber: number;
  isAttendeeStatement: boolean;
  agreeCount: number;
  disagreeCount: number;
  voteCount: number;
}

type SessionTimes = Pick<
  EventReportOpening,
  "sessionStartedAt" | "sessionEndedAt"
>;

export const requireSessionStarted = (
  state: Pick<LiveEventState, "startedAt">,
): number => {
  if (state.startedAt === null) {
    throw new RouteError(
      "This event hasn't started yet, so it has no report",
      409,
    );
  }
  return state.startedAt;
};

const findLastVoteBeforeQuietGap = (
  finalPostChange: PostChange,
  votes: EventReportVote[],
): number | null => {
  const finalPostVoteTimes = _.sortBy(
    votes
      .filter(
        (vote) =>
          vote.roomId === finalPostChange.roomId &&
          vote.timestamp >= finalPostChange.changedAt,
      )
      .map((vote) => vote.timestamp),
  );
  let lastActiveAt = finalPostChange.changedAt;
  let lastVoteAt: number | null = null;
  for (const voteTime of finalPostVoteTimes) {
    if (voteTime - lastActiveAt >= FINAL_POST_QUIET_GAP_MS) break;
    lastActiveAt = voteTime;
    lastVoteAt = voteTime;
  }
  return lastVoteAt;
};

const inferSessionEnd = (
  finalPostChange: PostChange,
  votes: EventReportVote[],
): number =>
  findLastVoteBeforeQuietGap(finalPostChange, votes) ??
    finalPostChange.changedAt + UNVOTED_FINAL_POST_LENGTH_MS;

export const findSessionEnd = (
  state: EventReportState,
  votes: EventReportVote[],
  now: number,
): number => {
  if (state.endedAt !== null) return state.endedAt;
  const finalPostChange = _.last(state.postChanges);
  if (!finalPostChange) return now;
  return Math.min(now, inferSessionEnd(finalPostChange, votes));
};

export const percentOf = (part: number, whole: number): number =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

const tallyStatement = (
  statement: Statement,
  statementVotes: EventReportVote[],
  inputs: EventReportInputs,
): StatementTally => {
  const simpleVoteCounts = _.countBy(
    statementVotes,
    (vote: EventReportVote) => toSimpleVote(vote.voteType),
  );
  return {
    statement,
    postNumber: inputs.state.roomOrder.indexOf(statement.roomId) + 1,
    isAttendeeStatement: isAttendeeStatement(statement, inputs),
    agreeCount: simpleVoteCounts.agree ?? 0,
    disagreeCount: simpleVoteCounts.disagree ?? 0,
    voteCount: statementVotes.length,
  };
};

export const isAttendeeStatement = (
  statement: Pick<Statement, "author" | "timestamp">,
  inputs: Pick<EventReportInputs, "event" | "community" | "state">,
): boolean => {
  const { startedAt } = inputs.state;
  if (startedAt === null || statement.timestamp < startedAt) {
    return false;
  }
  return !canModerateEvent(
    statement.author,
    inputs.event,
    inputs.community,
  );
};

const tallyStatements = (
  inputs: EventReportInputs,
  sessionVotes: EventReportVote[],
): StatementTally[] => {
  const votesByStatementId = _.groupBy(sessionVotes, "statementId");
  return inputs.statements.map((statement) =>
    tallyStatement(
      statement,
      votesByStatementId[statement.id] ?? [],
      inputs,
    ),
  );
};

const hasEnoughVotesToRank = (tally: StatementTally): boolean =>
  tally.voteCount >= MIN_VOTES_TO_RANK_STATEMENT;

const agreeShare = (tally: StatementTally): number =>
  tally.voteCount === 0 ? 0 : tally.agreeCount / tally.voteCount;

const splitGap = (tally: StatementTally): number =>
  Math.abs(tally.agreeCount - tally.disagreeCount) / tally.voteCount;

const sortByAgreement = (
  tallies: StatementTally[],
): StatementTally[] =>
  _.orderBy(
    tallies,
    [hasEnoughVotesToRank, agreeShare, "voteCount"],
    ["desc", "desc", "desc"],
  );

const sortBySplit = (tallies: StatementTally[]): StatementTally[] =>
  _.orderBy(
    tallies,
    [hasEnoughVotesToRank, splitGap, "voteCount"],
    ["desc", "asc", "desc"],
  );

const toReportStatement = (
  tally: StatementTally,
): EventReportStatement => ({
  statementId: tally.statement.id,
  text: tally.statement.text,
  agreePercent: percentOf(tally.agreeCount, tally.voteCount),
  disagreePercent: percentOf(tally.disagreeCount, tally.voteCount),
});

const toReportStatementOrNull = (
  tally: StatementTally | undefined,
): EventReportStatement | null =>
  tally ? toReportStatement(tally) : null;

const toAttendeeStatement = (
  tally: StatementTally,
): EventReportAttendeeStatement => ({
  ...toReportStatement(tally),
  postNumber: tally.postNumber,
  voteCount: tally.voteCount,
});

const hasVotes = (tally: StatementTally): boolean =>
  tally.voteCount > 0;

const findMostAgreedTally = (
  postTallies: StatementTally[],
): StatementTally | undefined =>
  sortByAgreement(postTallies.filter(hasVotes))[0];

const findMostSplitTally = (
  postTallies: StatementTally[],
): StatementTally | undefined =>
  sortBySplit(postTallies.filter(hasVotes))[0];

const findTopAttendeeTally = (
  postTallies: StatementTally[],
): StatementTally | undefined =>
  sortByAgreement(
    postTallies.filter((tally) => tally.isAttendeeStatement),
  )[0];

const listReportPosts = (
  inputs: EventReportInputs,
  sessionVotes: EventReportVote[],
  tallies: StatementTally[],
  sessionEndedAt: number,
): EventReportPost[] => {
  const stateEndingAtSessionEnd = {
    ...inputs.state,
    endedAt: sessionEndedAt,
  };
  const postsShown = listPostsSoFar(
    stateEndingAtSessionEnd,
    inputs.rooms,
    sessionVotes,
    inputs.now,
  );
  const talliesByRoomId = _.groupBy(
    tallies,
    (tally: StatementTally) => tally.statement.roomId,
  );
  return postsShown.map((post) => {
    const postTallies = talliesByRoomId[post.roomId] ?? [];
    return {
      ...post,
      mostAgreedStatement: toReportStatementOrNull(
        findMostAgreedTally(postTallies),
      ),
      mostSplitStatement: toReportStatementOrNull(
        findMostSplitTally(postTallies),
      ),
      topAttendeeStatement: toReportStatementOrNull(
        findTopAttendeeTally(postTallies),
      ),
    };
  });
};

const statementTimestamp = (tally: StatementTally): number =>
  tally.statement.timestamp;

const averageAgreePercent =(tallies: StatementTally[]): number =>
  tallies.length === 0
    ? 0
    : Math.round(_.meanBy(tallies, agreeShare) * 100);

const buildFloor = (
  tallies: StatementTally[],
): EventReportFloor => {
  const rankableTallies = tallies.filter(hasEnoughVotesToRank);
  const attendeeTallies = tallies.filter(
    (tally) => tally.isAttendeeStatement,
  );
  const rankableAttendeeTallies = rankableTallies.filter(
    (tally) => tally.isAttendeeStatement,
  );
  const rankablePreparedTallies = rankableTallies.filter(
    (tally) => !tally.isAttendeeStatement,
  );
  const lowVoteAttendeeTallies = _.orderBy(
    attendeeTallies.filter((tally) => !hasEnoughVotesToRank(tally)),
    ["voteCount", statementTimestamp],
    ["desc", "asc"],
  );
  const topTenTallies = sortByAgreement(rankableTallies).slice(
    0,
    TOP_STATEMENT_COUNT,
  );
  return {
    attendeeCount: _.uniqBy(
      attendeeTallies,
      (tally: StatementTally) => tally.statement.author,
    ).length,
    attendeeStatementVoteCount: _.sumBy(attendeeTallies, "voteCount"),
    attendeeStatementsInTopTenCount: topTenTallies.filter(
      (tally) => tally.isAttendeeStatement,
    ).length,
    averageAttendeeAgreePercent: averageAgreePercent(
      rankableAttendeeTallies,
    ),
    averagePreparedAgreePercent: averageAgreePercent(
      rankablePreparedTallies,
    ),
    topAttendeeStatements: sortByAgreement(rankableAttendeeTallies)
      .slice(0, TOP_ATTENDEE_STATEMENT_COUNT)
      .map(toAttendeeStatement),
    lowVoteAttendeeStatements: lowVoteAttendeeTallies
      .slice(0, LOW_VOTE_ATTENDEE_STATEMENT_COUNT)
      .map(toAttendeeStatement),
  };
};

const averagePostParticipationPercent = (
  posts: EventReportPost[],
): number => {
  if (posts.length === 0) return 0;
  const mostVotersOnAnyPost = Math.max(
    ...posts.map((post) => post.voterCount),
  );
  return Math.round(
    _.meanBy(posts, (post: EventReportPost) =>
      percentOf(post.voterCount, mostVotersOnAnyPost)
    ),
  );
};

const buildOpening = (
  event: EventReportInputs["event"],
  sessionVotes: EventReportVote[],
  posts: EventReportPost[],
  tallies: StatementTally[],
  sessionTimes: SessionTimes,
): EventReportOpening => {
  const peopleCount = _.uniqBy(sessionVotes, "userId").length;
  return {
    eventName: event.name,
    eventSubtitle: event.subtitle || null,
    peopleCount,
    voteCount: sessionVotes.length,
    postCount: posts.length,
    attendeeStatementCount: tallies.filter(
      (tally) => tally.isAttendeeStatement,
    ).length,
    averagePostParticipationPercent:
      averagePostParticipationPercent(posts),
    ...sessionTimes,
  };
};

const secondsBetween = (startedAt: number, timestamp: number) =>
  Math.round((timestamp - startedAt) / SECOND_MS);

const countActiveVotersInEachBin = (
  sessionVotes: EventReportVote[],
  sessionStartedAt: number,
  sessionEndedAt: number,
): number[] => {
  const binMs = TIMELINE_BIN_SECONDS * SECOND_MS;
  const binCount = Math.max(
    1,
    Math.ceil((sessionEndedAt - sessionStartedAt) / binMs),
  );
  const binIndexOf = (vote: EventReportVote) =>
    Math.min(
      binCount - 1,
      Math.floor((vote.timestamp - sessionStartedAt) / binMs),
    );
  const votesDuringSession = sessionVotes.filter(
    (vote) => vote.timestamp <= sessionEndedAt,
  );
  const votesByBinIndex = _.groupBy(votesDuringSession, binIndexOf);
  return _.range(binCount).map(
    (binIndex: number) =>
      _.uniqBy(votesByBinIndex[binIndex] ?? [], "userId").length,
  );
};

const buildTimeline = (
  state: EventReportState,
  sessionVotes: EventReportVote[],
  tallies: StatementTally[],
  sessionTimes: SessionTimes,
): EventReportTimeline => {
  const { sessionStartedAt, sessionEndedAt } = sessionTimes;
  const activeVoterCounts = countActiveVotersInEachBin(
    sessionVotes,
    sessionStartedAt,
    sessionEndedAt,
  );
  const attendeeStatementsDuringSession = _.sortBy(
    tallies
      .filter((tally) => tally.isAttendeeStatement)
      .map((tally) => tally.statement)
      .filter((statement) => statement.timestamp <= sessionEndedAt),
    "timestamp",
  );
  return {
    binSeconds: TIMELINE_BIN_SECONDS,
    bins: activeVoterCounts.map((activeVoterCount, binIndex) => ({
      secondsSinceStart: binIndex * TIMELINE_BIN_SECONDS,
      activeVoterCount,
    })),
    promptStarts: state.postChanges.map((postChange) => ({
      postNumber: state.roomOrder.indexOf(postChange.roomId) + 1,
      secondsSinceStart: secondsBetween(
        sessionStartedAt,
        postChange.changedAt,
      ),
    })),
    attendeeStatementsAdded: attendeeStatementsDuringSession.map(
      (statement: Statement) => ({
        statementId: statement.id,
        text: statement.text,
        secondsSinceStart: secondsBetween(
          sessionStartedAt,
          statement.timestamp,
        ),
      }),
    ),
  };
};

export const buildEventReport = (
  inputs: EventReportInputs,
): EventReport => {
  const sessionStartedAt = requireSessionStarted(inputs.state);
  const sessionVotes = filterSessionVotes(
    inputs.votes,
    sessionStartedAt,
  );
  const sessionEndedAt = findSessionEnd(
    inputs.state,
    sessionVotes,
    inputs.now,
  );
  const sessionTimes = { sessionStartedAt, sessionEndedAt };
  const tallies = tallyStatements(inputs, sessionVotes);
  const posts = listReportPosts(
    inputs,
    sessionVotes,
    tallies,
    sessionEndedAt,
  );
  return {
    opening: buildOpening(
      inputs.event,
      sessionVotes,
      posts,
      tallies,
      sessionTimes,
    ),
    posts,
    floor: buildFloor(tallies),
    campAnalysis: EMPTY_CAMP_ANALYSIS,
    timeline: buildTimeline(
      inputs.state,
      sessionVotes,
      tallies,
      sessionTimes,
    ),
  };
};
