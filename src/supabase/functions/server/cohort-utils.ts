import { User, Vote, Statement, DebateRoom } from "./types.tsx";
import { getTotalVoteCount } from "./statement-utils.tsx";
import { buildActiveDaysMap } from "./stats-utils.ts";

export function getWeekStart(timestamp: number): number {
  const d = new Date(timestamp);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.getTime();
}

export function formatCohortLabel(weekStart: number): string {
  return new Date(weekStart).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const pct = (count: number, total: number): number =>
  total === 0 ? 0 : Math.round((count / total) * 1000) / 10;

export interface CohortTopPost {
  id: string;
  topic: string;
  votes: number;
  subHeard?: string;
}

export interface CohortBucket {
  cohortStart: number;
  cohortLabel: string;
  totalUsers: number;
  votedCount: number;
  respondedCount: number;
  nonAnonCount: number;
  multiRoomCount: number;
  multiCommunityCount: number;
  multiDayCount: number;
  multiWeekCount: number;
  votedPct: number;
  respondedPct: number;
  nonAnonPct: number;
  multiRoomPct: number;
  multiCommunityPct: number;
  multiDayPct: number;
  multiWeekPct: number;
  topPosts: CohortTopPost[];
}

const TOP_POSTS_PER_COHORT = 3;

function computeTopPostsByWeek(
  rooms: DebateRoom[],
  statements: Statement[],
): Map<number, CohortTopPost[]> {
  const votesByRoom = new Map<string, number>();
  for (const s of statements) {
    if (s.isHidden) continue;
    votesByRoom.set(s.roomId, (votesByRoom.get(s.roomId) ?? 0) + getTotalVoteCount(s));
  }

  const roomsByWeek = new Map<number, DebateRoom[]>();
  for (const room of rooms) {
    if (!room.createdAt) continue;
    const week = getWeekStart(room.createdAt);
    if (!roomsByWeek.has(week)) roomsByWeek.set(week, []);
    roomsByWeek.get(week)!.push(room);
  }

  const topPostsByWeek = new Map<number, CohortTopPost[]>();
  for (const [week, roomsInWeek] of roomsByWeek.entries()) {
    const top = [...roomsInWeek]
      .map((room) => ({ room, votes: votesByRoom.get(room.id) ?? 0 }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, TOP_POSTS_PER_COHORT)
      .map(({ room, votes }) => ({
        id: room.id,
        topic: room.topic,
        votes,
        subHeard: room.subHeard,
      }));
    topPostsByWeek.set(week, top);
  }
  return topPostsByWeek;
}

export function buildCohortFunnelData(
  users: User[],
  votes: Vote[],
  statements: Statement[],
  rooms: DebateRoom[],
): { cohorts: CohortBucket[] } {
  const roomSubHeard = new Map<string, string | undefined>();
  for (const room of rooms) roomSubHeard.set(room.id, room.subHeard);

  const statementRoomMap = new Map<string, string>();
  for (const s of statements) statementRoomMap.set(s.id, s.roomId);

  const votedUserIds = new Set<string>();
  const roomsVotedByUser = new Map<string, Set<string>>();
  for (const v of votes) {
    votedUserIds.add(v.userId);
    const roomId = statementRoomMap.get(v.statementId);
    if (!roomId) continue;
    if (!roomsVotedByUser.has(v.userId)) roomsVotedByUser.set(v.userId, new Set());
    roomsVotedByUser.get(v.userId)!.add(roomId);
  }

  const respondedUserIds = new Set<string>();
  const roomsRespondedByUser = new Map<string, Set<string>>();
  for (const s of statements) {
    respondedUserIds.add(s.author);
    if (!roomsRespondedByUser.has(s.author)) roomsRespondedByUser.set(s.author, new Set());
    roomsRespondedByUser.get(s.author)!.add(s.roomId);
  }

  const topPostsByWeek = computeTopPostsByWeek(rooms, statements);
  const activeDaysByUser = buildActiveDaysMap(votes, statements);

  type MutableBucket = Omit<
    CohortBucket,
    | "cohortLabel"
    | "votedPct"
    | "respondedPct"
    | "nonAnonPct"
    | "multiRoomPct"
    | "multiCommunityPct"
    | "multiDayPct"
    | "multiWeekPct"
    | "topPosts"
  >;

  const cohortBuckets = new Map<number, MutableBucket>();

  for (const user of users) {
    if (!user.createdAt) continue;
    const cohortStart = getWeekStart(user.createdAt);
    if (!cohortBuckets.has(cohortStart)) {
      cohortBuckets.set(cohortStart, {
        cohortStart,
        totalUsers: 0,
        votedCount: 0,
        respondedCount: 0,
        nonAnonCount: 0,
        multiRoomCount: 0,
        multiCommunityCount: 0,
        multiDayCount: 0,
        multiWeekCount: 0,
      });
    }
    const bucket = cohortBuckets.get(cohortStart)!;
    bucket.totalUsers++;

    if (votedUserIds.has(user.id)) bucket.votedCount++;
    if (respondedUserIds.has(user.id)) bucket.respondedCount++;
    if (user.email || user.phoneNumber) bucket.nonAnonCount++;

    const participatedRooms = new Set<string>([
      ...(roomsVotedByUser.get(user.id) ?? []),
      ...(roomsRespondedByUser.get(user.id) ?? []),
    ]);
    if (participatedRooms.size > 1) bucket.multiRoomCount++;

    const communities = new Set<string>();
    for (const roomId of participatedRooms) {
      const subHeard = roomSubHeard.get(roomId);
      if (subHeard) communities.add(subHeard);
    }
    if (communities.size > 1) bucket.multiCommunityCount++;

    const activeDays = activeDaysByUser.get(user.id);
    if (activeDays) {
      if (activeDays.size > 1) bucket.multiDayCount++;

      const activeWeeks = new Set<number>();
      for (const day of activeDays) activeWeeks.add(getWeekStart(day));
      if (activeWeeks.size > 1) bucket.multiWeekCount++;
    }
  }

  const cohorts: CohortBucket[] = Array.from(cohortBuckets.values())
    .sort((a, b) => a.cohortStart - b.cohortStart)
    .map((bucket) => ({
      ...bucket,
      cohortLabel: formatCohortLabel(bucket.cohortStart),
      votedPct: pct(bucket.votedCount, bucket.totalUsers),
      respondedPct: pct(bucket.respondedCount, bucket.totalUsers),
      nonAnonPct: pct(bucket.nonAnonCount, bucket.totalUsers),
      multiRoomPct: pct(bucket.multiRoomCount, bucket.totalUsers),
      multiCommunityPct: pct(bucket.multiCommunityCount, bucket.totalUsers),
      multiDayPct: pct(bucket.multiDayCount, bucket.totalUsers),
      multiWeekPct: pct(bucket.multiWeekCount, bucket.totalUsers),
      topPosts: topPostsByWeek.get(bucket.cohortStart) ?? [],
    }));

  return { cohorts };
}
