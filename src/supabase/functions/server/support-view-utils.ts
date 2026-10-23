import _ from "lodash";
import { currentRoomId, PRESENCE_WINDOW_MS } from "./live-event-utils.ts";
import type {
  AttendeePhoneState,
  DebateRoom,
  EventPresence,
  LiveEventState,
  Statement,
  SupportViewAttendeeStatement,
  SupportViewCurrentPost,
  SupportViewMinute,
  SupportViewPost,
  SupportViewStats,
  Vote,
} from "./types.tsx";

export const ACTIVE_WINDOW_MS = 30_000;

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;

export type EventVote = Pick<Vote, "userId" | "voteType" | "timestamp"> & { roomId: string };

export interface SupportViewSources {
  eventName: string;
  state: LiveEventState;
  rooms: Pick<DebateRoom, "id" | "topic">[];
  presences: EventPresence[];
  statements: Statement[];
  votes: EventVote[];
  now: number;
}

export interface PhoneCounts {
  peopleHere: number;
  activeNow: number;
  phoneCountsByState: Record<AttendeePhoneState, number>;
}

export const presencesHere = (presences: EventPresence[], now: number): EventPresence[] =>
  presences.filter((presence) => now - presence.updatedAt <= PRESENCE_WINDOW_MS);

const isActive = (presence: EventPresence, now: number): boolean => now - presence.updatedAt <= ACTIVE_WINDOW_MS;

export const countPhones = (presences: EventPresence[], now: number): PhoneCounts => {
  const here = presencesHere(presences, now);
  const phoneCountsByState: Record<AttendeePhoneState, number> = { swiping: 0, waiting: 0, lobby: 0, end: 0, idle: 0 };
  for (const presence of here) {
    phoneCountsByState[isActive(presence, now) ? presence.screen : "idle"] += 1;
  }
  return {
    peopleHere: here.length,
    activeNow: here.filter((presence) => isActive(presence, now)).length,
    phoneCountsByState,
  };
};

export const sessionEndTime = (state: Pick<LiveEventState, "endedAt">, now: number): number => state.endedAt ?? now;

export const filterSessionVotes = <T extends Pick<Vote, "timestamp">>(votes: T[], startedAt: number | null): T[] =>
  startedAt === null ? [] : votes.filter((vote) => vote.timestamp >= startedAt);

export const sumSecondsOnEachPost = (
  postChanges: LiveEventState["postChanges"],
  sessionEnd: number,
): Record<string, number> => {
  const secondsByRoomId: Record<string, number> = {};
  postChanges.forEach((change, index) => {
    const leftAt = postChanges[index + 1]?.changedAt ?? sessionEnd;
    const seconds = Math.max(0, Math.round((leftAt - change.changedAt) / SECOND_MS));
    secondsByRoomId[change.roomId] = (secondsByRoomId[change.roomId] ?? 0) + seconds;
  });
  return secondsByRoomId;
};

export const listPostsSoFar = (
  state: Pick<LiveEventState, "roomOrder" | "postChanges" | "endedAt">,
  sessionVotes: EventVote[],
  now: number,
): SupportViewPost[] => {
  const secondsByRoomId = sumSecondsOnEachPost(state.postChanges, sessionEndTime(state, now));
  const voterIdsByRoomId = _.mapValues(_.groupBy(sessionVotes, "roomId"), (roomVotes: EventVote[]) =>
    new Set(roomVotes.map((vote) => vote.userId)),
  );
  return state.roomOrder.flatMap((roomId, index) =>
    roomId in secondsByRoomId
      ? [{
        roomId,
        postNumber: index + 1,
        voterCount: voterIdsByRoomId[roomId]?.size ?? 0,
        secondsOnPost: secondsByRoomId[roomId],
      }]
      : []
  );
};

export const listMinutes = (sessionVotes: EventVote[], startedAt: number | null, sessionEnd: number): SupportViewMinute[] => {
  if (startedAt === null) return [];
  const minuteOf = (timestamp: number) => Math.floor((timestamp - startedAt) / MINUTE_MS);
  const minuteCount = minuteOf(sessionEnd) + 1;
  const votesByMinute = _.countBy(sessionVotes, (vote: EventVote) => minuteOf(vote.timestamp));
  const firstVoteMinuteByUserId = _.mapValues(_.groupBy(sessionVotes, "userId"), (userVotes: EventVote[]) =>
    minuteOf(_.minBy(userVotes, "timestamp")!.timestamp),
  );
  const joinedByMinute = _.countBy(Object.values(firstVoteMinuteByUserId));
  let peopleJoined = 0;
  return _.range(minuteCount).map((minuteSinceStart: number) => {
    peopleJoined += joinedByMinute[minuteSinceStart] ?? 0;
    return { minuteSinceStart, votes: votesByMinute[minuteSinceStart] ?? 0, peopleJoined };
  });
};

export const listNextPressedAtMinutes = (state: Pick<LiveEventState, "postChanges" | "startedAt">): number[] => {
  const { startedAt } = state;
  if (startedAt === null) return [];
  return state.postChanges.slice(1).map((change) => Math.floor((change.changedAt - startedAt) / MINUTE_MS));
};

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = _.sortBy(values);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

const isAgree = (vote: Pick<Vote, "voteType">): boolean => vote.voteType === "agree" || vote.voteType === "super_agree";

export const describeCurrentPost = (
  sources: Pick<SupportViewSources, "state" | "rooms" | "presences" | "now">,
  sessionVotes: EventVote[],
): SupportViewCurrentPost | null => {
  const { state, rooms, presences, now } = sources;
  const roomId = currentRoomId(state);
  if (state.status !== "live" || roomId === null || state.currentIndex === null) return null;

  const postStartedAt = _.last(state.postChanges)?.changedAt ?? state.startedAt ?? now;
  const postVotes = sessionVotes.filter((vote) => vote.roomId === roomId && vote.timestamp >= postStartedAt);
  const onThisPost = presencesHere(presences, now).filter((presence) => presence.shownRoomId === roomId);
  const finishedUserIds = onThisPost.filter((presence) => presence.screen === "waiting").map((presence) => presence.userId);
  const lastVoteAtByUserId = _.mapValues(_.groupBy(postVotes, "userId"), (userVotes: EventVote[]) =>
    _.maxBy(userVotes, "timestamp")!.timestamp,
  );
  const secondsToFinish = finishedUserIds
    .filter((userId) => userId in lastVoteAtByUserId)
    .map((userId) => Math.round((lastVoteAtByUserId[userId] - postStartedAt) / SECOND_MS));

  return {
    postNumber: state.currentIndex + 1,
    topic: rooms.find((room) => room.id === roomId)?.topic ?? "",
    finishedCount: finishedUserIds.length,
    swipingCount: onThisPost.filter((presence) => presence.screen === "swiping").length,
    agreeVotes: postVotes.filter(isAgree).length,
    disagreeVotes: postVotes.filter((vote) => vote.voteType === "disagree").length,
    passVotes: postVotes.filter((vote) => vote.voteType === "pass").length,
    medianSecondsToFinish: median(secondsToFinish),
    startedAt: postStartedAt,
  };
};

export const listAttendeeStatements = (
  state: Pick<LiveEventState, "roomOrder" | "startedAt">,
  statements: Statement[],
): SupportViewAttendeeStatement[] => {
  const { startedAt } = state;
  if (startedAt === null) return [];
  return statements
    .filter((statement) => statement.timestamp >= startedAt && state.roomOrder.includes(statement.roomId))
    .map((statement) => ({
      id: statement.id,
      roomId: statement.roomId,
      postNumber: state.roomOrder.indexOf(statement.roomId) + 1,
      text: statement.text,
      agreeVotes: statement.agrees + statement.superAgrees,
      disagreeVotes: statement.disagrees,
      passVotes: statement.passes,
      isHidden: !!statement.isHidden,
      createdAt: statement.timestamp,
    }));
};

export const buildSupportViewStats = (sources: SupportViewSources): SupportViewStats => {
  const { eventName, state, presences, statements, votes, now } = sources;
  const sessionVotes = filterSessionVotes(votes, state.startedAt);
  const attendeeStatements = listAttendeeStatements(state, statements);

  return {
    eventName,
    status: state.status,
    votingPaused: state.votingPaused,
    postCount: state.roomOrder.length,
    ...countPhones(presences, now),
    votes: sessionVotes.length,
    statementsFromRoom: attendeeStatements.filter((statement) => !statement.isHidden).length,
    currentPost: describeCurrentPost(sources, sessionVotes),
    postsSoFar: listPostsSoFar(state, sessionVotes, now),
    attendeeStatements,
    minutes: listMinutes(sessionVotes, state.startedAt, sessionEndTime(state, now)),
    nextPressedAtMinutes: listNextPressedAtMinutes(state),
    startedAt: state.startedAt,
    endedAt: state.endedAt,
  };
};
