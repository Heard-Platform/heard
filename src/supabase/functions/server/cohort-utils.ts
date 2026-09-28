import {
  User,
  Vote,
  Statement,
  DebateRoom,
  RoomView,
} from "./types.tsx";
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

const MANY_VOTES_THRESHOLD = 5;

const VOTE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "0", min: 0, max: 0 },
  { label: "1", min: 1, max: 1 },
  { label: "2–5", min: 2, max: 5 },
  { label: "6–10", min: 6, max: 10 },
  { label: "11+", min: 11, max: Infinity },
];

const pct = (count: number, total: number): number =>
  total === 0 ? 0 : Math.round((count / total) * 1000) / 10;

export interface CohortVoteBucket {
  label: string;
  count: number;
  pct: number;
}

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
  multiPostViewCount: number;
  votedCount: number;
  moreThanFiveVotesCount: number;
  respondedCount: number;
  createdRoomCount: number;
  nonAnonCount: number;
  multiRoomCount: number;
  multiCommunityCount: number;
  multiDayCount: number;
  multiWeekCount: number;
  activeThisWeekCount: number;
  votesThisWeekCount: number;
  multiPostViewPct: number;
  votedPct: number;
  moreThanFiveVotesPct: number;
  respondedPct: number;
  createdRoomPct: number;
  nonAnonPct: number;
  multiRoomPct: number;
  multiCommunityPct: number;
  multiDayPct: number;
  multiWeekPct: number;
  activeThisWeekPct: number;
  voteBuckets: CohortVoteBucket[];
  topPosts: CohortTopPost[];
}

export type CohortMode = "joined" | "active";

type MutableBucket = Omit<
  CohortBucket,
  | "cohortLabel"
  | "multiPostViewPct"
  | "votedPct"
  | "moreThanFiveVotesPct"
  | "respondedPct"
  | "createdRoomPct"
  | "nonAnonPct"
  | "multiRoomPct"
  | "multiCommunityPct"
  | "multiDayPct"
  | "multiWeekPct"
  | "activeThisWeekPct"
  | "voteBuckets"
  | "topPosts"
> & { voteBucketCounts: number[] };

interface UserActivityIndex {
  roomSubHeard: Map<string, string | undefined>;
  createdRoomUserIds: Set<string>;
  viewedRoomsByUser: Map<string, Set<string>>;
  roomsVotedByUser: Map<string, Set<string>>;
  roomsRespondedByUser: Map<string, Set<string>>;
  voteCountByUser: Map<string, number>;
  votesByUserWeek: Map<string, number>;
  activeDaysByUser: Map<string, Set<number>>;
}

const TOP_POSTS_PER_COHORT = 3;

function addToSetMap(
  map: Map<string, Set<string>>,
  key: string,
  value: string,
) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(value);
}

function increment<K>(map: Map<K, number>, key: K) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function userWeekKey(userId: string, weekStart: number): string {
  return `${userId}:${weekStart}`;
}

function computeTopPostsByWeek(
  rooms: DebateRoom[],
  statements: Statement[],
  votes: Vote[],
  userIds: Set<string>,
): Map<number, CohortTopPost[]> {
  const roomById = new Map<string, DebateRoom>();
  for (const room of rooms) roomById.set(room.id, room);

  const visibleStatementRoom = new Map<string, string>();
  for (const s of statements) {
    if (!s.isHidden) visibleStatementRoom.set(s.id, s.roomId);
  }

  const votesByWeekRoom = new Map<number, Map<string, number>>();
  for (const v of votes) {
    if (!userIds.has(v.userId)) continue;
    const roomId = visibleStatementRoom.get(v.statementId);
    if (!roomId) continue;
    const week = getWeekStart(v.timestamp);
    if (!votesByWeekRoom.has(week))
      votesByWeekRoom.set(week, new Map());
    increment(votesByWeekRoom.get(week)!, roomId);
  }

  const topPostsByWeek = new Map<number, CohortTopPost[]>();
  for (const [week, roomVotes] of votesByWeekRoom.entries()) {
    const top = [...roomVotes.entries()]
      .filter(([roomId]) => roomById.has(roomId))
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_POSTS_PER_COHORT)
      .map(([roomId, votes]) => {
        const room = roomById.get(roomId)!;
        return {
          id: room.id,
          topic: room.topic,
          votes,
          subHeard: room.subHeard,
        };
      });
    topPostsByWeek.set(week, top);
  }
  return topPostsByWeek;
}

function buildUserActivityIndex(
  votes: Vote[],
  statements: Statement[],
  rooms: DebateRoom[],
  views: RoomView[],
  statementLookup: Statement[],
): UserActivityIndex {
  const roomSubHeard = new Map<string, string | undefined>();
  const createdRoomUserIds = new Set<string>();
  for (const room of rooms) {
    roomSubHeard.set(room.id, room.subHeard);
    createdRoomUserIds.add(room.hostId);
  }

  const viewedRoomsByUser = new Map<string, Set<string>>();
  for (const v of views)
    addToSetMap(viewedRoomsByUser, v.userId, v.roomId);

  const statementRoomMap = new Map<string, string>();
  for (const s of statementLookup)
    statementRoomMap.set(s.id, s.roomId);

  const voteCountByUser = new Map<string, number>();
  const votesByUserWeek = new Map<string, number>();
  const roomsVotedByUser = new Map<string, Set<string>>();
  for (const v of votes) {
    increment(voteCountByUser, v.userId);
    increment(
      votesByUserWeek,
      userWeekKey(v.userId, getWeekStart(v.timestamp)),
    );
    const roomId = statementRoomMap.get(v.statementId);
    if (roomId) addToSetMap(roomsVotedByUser, v.userId, roomId);
  }

  const roomsRespondedByUser = new Map<string, Set<string>>();
  for (const s of statements)
    addToSetMap(roomsRespondedByUser, s.author, s.roomId);

  return {
    roomSubHeard,
    createdRoomUserIds,
    viewedRoomsByUser,
    roomsVotedByUser,
    roomsRespondedByUser,
    voteCountByUser,
    votesByUserWeek,
    activeDaysByUser: buildActiveDaysMap(votes, statements),
  };
}

function createEmptyBucket(cohortStart: number): MutableBucket {
  return {
    cohortStart,
    totalUsers: 0,
    multiPostViewCount: 0,
    votedCount: 0,
    moreThanFiveVotesCount: 0,
    respondedCount: 0,
    createdRoomCount: 0,
    nonAnonCount: 0,
    multiRoomCount: 0,
    multiCommunityCount: 0,
    multiDayCount: 0,
    multiWeekCount: 0,
    activeThisWeekCount: 0,
    votesThisWeekCount: 0,
    voteBucketCounts: VOTE_BUCKETS.map(() => 0),
  };
}

function getVoteBucketIndex(voteCount: number): number {
  return VOTE_BUCKETS.findIndex(
    (b) => voteCount >= b.min && voteCount <= b.max,
  );
}

function recordVoting(
  bucket: MutableBucket,
  user: User,
  index: UserActivityIndex,
) {
  const totalVotes = index.voteCountByUser.get(user.id) ?? 0;
  if (totalVotes > 0) bucket.votedCount++;
  if (totalVotes > MANY_VOTES_THRESHOLD)
    bucket.moreThanFiveVotesCount++;

  const votesThisWeek =
    index.votesByUserWeek.get(
      userWeekKey(user.id, bucket.cohortStart),
    ) ?? 0;
  bucket.votesThisWeekCount += votesThisWeek;
  bucket.voteBucketCounts[getVoteBucketIndex(votesThisWeek)]++;
}

function recordParticipation(
  bucket: MutableBucket,
  user: User,
  index: UserActivityIndex,
) {
  const participatedRooms = new Set<string>([
    ...(index.roomsVotedByUser.get(user.id) ?? []),
    ...(index.roomsRespondedByUser.get(user.id) ?? []),
  ]);
  if (participatedRooms.size > 1) bucket.multiRoomCount++;

  const communities = new Set<string>();
  for (const roomId of participatedRooms) {
    const subHeard = index.roomSubHeard.get(roomId);
    if (subHeard) communities.add(subHeard);
  }
  if (communities.size > 1) bucket.multiCommunityCount++;
}

function recordReturnBehavior(
  bucket: MutableBucket,
  user: User,
  index: UserActivityIndex,
) {
  const activeDays = index.activeDaysByUser.get(user.id);
  if (!activeDays) return;

  if (activeDays.size > 1) bucket.multiDayCount++;

  const activeWeeks = new Set<number>();
  let daysActiveThisWeek = 0;
  for (const day of activeDays) {
    const week = getWeekStart(day);
    activeWeeks.add(week);
    if (week === bucket.cohortStart) daysActiveThisWeek++;
  }
  if (activeWeeks.size > 1) bucket.multiWeekCount++;
  if (daysActiveThisWeek > 1) bucket.activeThisWeekCount++;
}

function recordUserInBucket(
  bucket: MutableBucket,
  user: User,
  index: UserActivityIndex,
) {
  bucket.totalUsers++;

  const viewedRooms = index.viewedRoomsByUser.get(user.id);
  if (viewedRooms && viewedRooms.size > 1)
    bucket.multiPostViewCount++;
  if (index.roomsRespondedByUser.has(user.id))
    bucket.respondedCount++;
  if (index.createdRoomUserIds.has(user.id))
    bucket.createdRoomCount++;
  if (user.email || user.phoneNumber) bucket.nonAnonCount++;

  recordVoting(bucket, user, index);
  recordParticipation(bucket, user, index);
  recordReturnBehavior(bucket, user, index);
}

function getCohortWeeksForUser(
  user: User,
  mode: CohortMode,
  activeDaysByUser: Map<string, Set<number>>,
): number[] {
  if (mode === "joined")
    return user.createdAt ? [getWeekStart(user.createdAt)] : [];
  const activeDays =
    activeDaysByUser.get(user.id) ?? new Set<number>();
  return [...new Set([...activeDays].map(getWeekStart))];
}

function finalizeBucket(
  bucket: MutableBucket,
  topPosts: CohortTopPost[],
): CohortBucket {
  const { voteBucketCounts, ...counts } = bucket;
  const toPct = (count: number) => pct(count, bucket.totalUsers);
  return {
    ...counts,
    cohortLabel: formatCohortLabel(bucket.cohortStart),
    multiPostViewPct: toPct(bucket.multiPostViewCount),
    votedPct: toPct(bucket.votedCount),
    moreThanFiveVotesPct: toPct(bucket.moreThanFiveVotesCount),
    respondedPct: toPct(bucket.respondedCount),
    createdRoomPct: toPct(bucket.createdRoomCount),
    nonAnonPct: toPct(bucket.nonAnonCount),
    multiRoomPct: toPct(bucket.multiRoomCount),
    multiCommunityPct: toPct(bucket.multiCommunityCount),
    multiDayPct: toPct(bucket.multiDayCount),
    multiWeekPct: toPct(bucket.multiWeekCount),
    activeThisWeekPct: toPct(bucket.activeThisWeekCount),
    voteBuckets: VOTE_BUCKETS.map((b, i) => ({
      label: b.label,
      count: voteBucketCounts[i],
      pct: toPct(voteBucketCounts[i]),
    })),
    topPosts,
  };
}

export function buildCohortFunnelData(
  users: User[],
  votes: Vote[],
  statements: Statement[],
  rooms: DebateRoom[],
  views: RoomView[],
  mode: CohortMode = "joined",
  statementLookup: Statement[] = statements,
): { cohorts: CohortBucket[] } {
  const index = buildUserActivityIndex(
    votes,
    statements,
    rooms,
    views,
    statementLookup,
  );
  const topPostsByWeek = computeTopPostsByWeek(
    rooms,
    statementLookup,
    votes,
    new Set(users.map((u) => u.id)),
  );

  const cohortBuckets = new Map<number, MutableBucket>();
  for (const user of users) {
    for (const week of getCohortWeeksForUser(
      user,
      mode,
      index.activeDaysByUser,
    )) {
      if (!cohortBuckets.has(week))
        cohortBuckets.set(week, createEmptyBucket(week));
      recordUserInBucket(cohortBuckets.get(week)!, user, index);
    }
  }

  const cohorts = Array.from(cohortBuckets.values())
    .sort((a, b) => a.cohortStart - b.cohortStart)
    .map((bucket) =>
      finalizeBucket(
        bucket,
        topPostsByWeek.get(bucket.cohortStart) ?? [],
      ),
    );

  return { cohorts };
}
