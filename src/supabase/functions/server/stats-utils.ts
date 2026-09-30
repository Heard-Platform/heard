import _ from "lodash";
import { User } from "./types.tsx";
import { SESSION_GAP_MS } from "./session-utils.ts";

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

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
export const SESSION_WINDOW_WEEKS = 12;

export function startOfUtcWeek(timestamp: number): number {
  const date = new Date(timestamp);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - daysSinceMonday * DAY_MS;
}

export interface VoteTiming {
  userId: string;
  timestamp: number;
}

export interface VotingSession {
  start: number;
  end: number;
  votes: number;
}

function splitIntoSessions(timestamps: number[]): VotingSession[] {
  const sorted = _.sortBy(timestamps);
  const sessions: VotingSession[] = [];
  sorted.forEach((timestamp, i) => {
    const isNewSession = i === 0 || timestamp - sorted[i - 1] > SESSION_GAP_MS;
    if (isNewSession) sessions.push({ start: timestamp, end: timestamp, votes: 0 });
    const session = sessions[sessions.length - 1];
    session.end = timestamp;
    session.votes++;
  });
  return sessions;
}

export function groupRecentSessionsByWeek(votes: VoteTiming[], now: number): Record<string, VotingSession[]> {
  const windowStart = startOfUtcWeek(now) - (SESSION_WINDOW_WEEKS - 1) * WEEK_MS;

  return _(votes)
    .groupBy("userId")
    .flatMap((userVotes) => splitIntoSessions(_.map(userVotes, "timestamp")))
    .filter((session) => startOfUtcWeek(session.start) >= windowStart)
    .groupBy((session) => startOfUtcWeek(session.start))
    .value();
}

function median(values: number[]): number {
  const sorted = _.sortBy(values);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

export function medianSessionMinutesByWeek(
  votes: VoteTiming[],
  now: number,
): { weekStart: string; medianMinutes: number; sessions: number }[] {
  return _(groupRecentSessionsByWeek(votes, now))
    .map((weekSessions, week) => ({
      week,
      multiVoteSessions: weekSessions.filter((session) => session.votes > 1),
    }))
    .filter(({ multiVoteSessions }) => multiVoteSessions.length > 0)
    .map(({ week, multiVoteSessions }) => ({
      weekStart: new Date(Number(week)).toISOString().slice(0, 10),
      medianMinutes: _.round(median(multiVoteSessions.map((session) => (session.end - session.start) / MINUTE_MS)), 1),
      sessions: multiVoteSessions.length,
    }))
    .sortBy("weekStart")
    .value();
}
