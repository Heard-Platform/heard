import {
  getAllRants,
  getAllRealDebates,
  getAllStatements,
  getAllUsers,
  getSentEmails,
  getUserActivityRecords,
  getUserOrThrow,
  getVotesForUser,
} from "./kv-utils.tsx";
import { getEventsForUser, getSentEmailsForUser } from "./model-utils.ts";
import { sanitizeUser } from "./user-utils.ts";
import { buildUserTimeline, type UserTimelineEvent } from "./user-timeline-utils.ts";
import type { DebateRoom, Rant, Statement, UserActivityRecord, Vote } from "./types.tsx";

export interface UserHistoryVote extends Vote {
  statementText?: string;
  roomId?: string;
}

export interface UserHistory {
  user: ReturnType<typeof sanitizeUser>;
  anonymousUserIds: string[];
  timeline: UserTimelineEvent[];
  rooms: DebateRoom[];
  statements: Statement[];
  votes: UserHistoryVote[];
  rants: Rant[];
  activities: UserActivityRecord[];
}

const flatFetchForEach = async <T>(
  ids: string[],
  fetch: (id: string) => Promise<T[]>,
): Promise<T[]> => (await Promise.all(ids.map(fetch))).flat();

const newestFirst = <T>(getTimestamp: (item: T) => number) => (a: T, b: T) =>
  getTimestamp(b) - getTimestamp(a);

export const getUserHistory = async (userId: string): Promise<UserHistory> => {
  const [user, allUsers, allRooms, allStatements, allRants, allKvSentEmails, tableSentEmails] =
    await Promise.all([
      getUserOrThrow(userId),
      getAllUsers(),
      getAllRealDebates(),
      getAllStatements(),
      getAllRants(),
      getSentEmails(),
      getSentEmailsForUser(userId),
    ]);

  const anonymousUsers = allUsers.filter(
    (candidate) => candidate.isAnonymous && candidate.mergedIntoUserId === userId,
  );
  const actorIds = [userId, ...anonymousUsers.map((anonUser) => anonUser.id)];
  const isActor = (id: string) => actorIds.includes(id);

  const [votes, activities, events] = await Promise.all([
    flatFetchForEach(actorIds, getVotesForUser),
    flatFetchForEach(actorIds, getUserActivityRecords),
    flatFetchForEach(actorIds, getEventsForUser),
  ]);

  const rooms = allRooms.filter((room) => isActor(room.hostId));
  const statements = allStatements.filter((statement) => isActor(statement.author));
  const rants = allRants.filter((rant) => isActor(rant.author));
  // Digest-style emails live in KV; send-once emails (welcome, flyer results) live in sent_emails
  const emails = [
    ...allKvSentEmails.filter((email) => email.userId === userId),
    ...tableSentEmails,
  ];

  const roomsById = new Map(allRooms.map((room) => [room.id, room]));
  const statementsById = new Map(allStatements.map((statement) => [statement.id, statement]));

  const timeline = buildUserTimeline({
    user,
    anonymousUsers,
    rooms,
    statements,
    votes,
    rants,
    emails,
    events,
    roomsById,
    statementsById,
  });

  const enrichedVotes: UserHistoryVote[] = votes.map((vote) => {
    const statement = statementsById.get(vote.statementId);
    return { ...vote, statementText: statement?.text, roomId: statement?.roomId };
  });

  return {
    user: sanitizeUser(user),
    anonymousUserIds: anonymousUsers.map((anonUser) => anonUser.id),
    timeline,
    rooms: rooms.sort(newestFirst((room) => room.createdAt)),
    statements: statements.sort(newestFirst((statement) => statement.timestamp)),
    votes: enrichedVotes.sort(newestFirst((vote) => vote.timestamp)),
    rants: rants.sort(newestFirst((rant) => rant.timestamp)),
    activities: activities.sort(newestFirst((activity) => activity.timestamp)),
  };
};
