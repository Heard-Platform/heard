import { User, Vote, Statement, DebateRoom } from "./types.tsx";
import { getTotalVoteCount } from "./statement-utils.tsx";

export function buildActiveDaysMap(
  votes: Array<{ userId: string; timestamp: number }>,
  statements: Array<{ author: string; timestamp: number }>,
): Map<string, Set<number>> {
  const map = new Map<string, Set<number>>();
  const record = (userId: string, timestamp: number) => {
    const d = new Date(timestamp);
    d.setUTCHours(0, 0, 0, 0);
    if (!map.has(userId)) map.set(userId, new Set());
    map.get(userId)!.add(d.getTime());
  };
  for (const v of votes) record(v.userId, v.timestamp);
  for (const s of statements) record(s.author, s.timestamp);
  return map;
}

export const generateSparklineData = (
  items: any[],
  daysBack = 7,
  now = Date.now(),
) => {
  const dayInMs = 24 * 60 * 60 * 1000;

  const buckets = Array.from({ length: daysBack }, (_, i) => {
    const day = daysBack - i - 1;
    const timestamp = now - day * dayInMs;
    return { day: i, count: 0, timestamp };
  });

  items.forEach((item) => {
    const itemTime = item.createdAt
      ? new Date(item.createdAt).getTime()
      : item.lastSeen || item.timestamp || 0;
    const daysAgo = Math.floor((now - itemTime) / dayInMs);

    if (daysAgo >= 0 && daysAgo < daysBack) {
      const bucketIndex = daysBack - daysAgo - 1;
      if (buckets[bucketIndex]) {
        buckets[bucketIndex].count++;
      }
    }
  });

  return buckets;
};

export const getDateString = (daysAgo = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};

export function calculateRetention({
  allUsers,
  activitiesByUser,
  now,
  minAgeDays,
  maxAgeDays,
  activityStartDays,
  activityEndDays,
}: {
  allUsers: User[];
  activitiesByUser: Map<string, Set<string>>;
  now: number;
  minAgeDays: number;
  maxAgeDays: number;
  activityStartDays: number;
  activityEndDays: number;
}) {
  const dayInMs = 24 * 60 * 60 * 1000;
  const minAgeMs = minAgeDays * dayInMs;
  const maxAgeMs = maxAgeDays * dayInMs;

  // Total users in the cohort (regardless of age)
  const cohortUsers = allUsers.filter((user) => {
    if (!user.createdAt) return false;
    const createdTime = new Date(user.createdAt).getTime();
    const age = now - createdTime;
    return age <= maxAgeMs;
  });

  // Users old enough to have completed the retention window
  const eligibleUsers = allUsers.filter((user) => {
    if (!user.createdAt) return false;
    const createdTime = new Date(user.createdAt).getTime();
    const age = now - createdTime;
    return age >= minAgeMs && age <= maxAgeMs;
  });

  if (eligibleUsers.length === 0) {
    return {
      rate: 0,
      eligible: 0,
      retained: 0,
      totalInCohort: cohortUsers.length,
    };
  }

  let retained = 0;

  for (const user of eligibleUsers) {
    const createdTime = new Date(user.createdAt).getTime();

    const windowStart =
      createdTime + activityStartDays * dayInMs;
    const windowEnd = createdTime + activityEndDays * dayInMs;

    const dates =
      activitiesByUser.get(user.id) ?? new Set<string>();

    const hasActivity = Array.from(dates).some((dateStr) => {
      const t = new Date(dateStr).getTime();
      return t >= windowStart && t <= windowEnd;
    });

    if (hasActivity) retained++;
  }

  const rate = (retained / eligibleUsers.length) * 100;

  return {
    rate: Math.round(rate * 10) / 10,
    eligible: eligibleUsers.length,
    retained,
    totalInCohort: cohortUsers.length,
  };
}

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
  votedPct: number;
  respondedPct: number;
  nonAnonPct: number;
  multiRoomPct: number;
  multiCommunityPct: number;
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

  type MutableBucket = Omit<
    CohortBucket,
    | "cohortLabel"
    | "votedPct"
    | "respondedPct"
    | "nonAnonPct"
    | "multiRoomPct"
    | "multiCommunityPct"
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
      topPosts: topPostsByWeek.get(bucket.cohortStart) ?? [],
    }));

  return { cohorts };
}