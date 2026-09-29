import type { ParticipantJoin } from "./RoomAnalyticsModal";

export type JoinTimelineGranularity = "hour" | "day" | "week";

export interface JoinTimelineBucket {
  label: string;
  named: number;
  anonymous: number;
  totalSoFar: number;
  anonymousPctSoFar: number;
  startsAt: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_HOURLY_SPAN_MS = 2 * DAY_MS;
const MAX_DAILY_SPAN_MS = 90 * DAY_MS;

export function pickGranularity(spanMs: number): JoinTimelineGranularity {
  if (spanMs <= MAX_HOURLY_SPAN_MS) return "hour";
  if (spanMs <= MAX_DAILY_SPAN_MS) return "day";
  return "week";
}

function startOfBucket(timestamp: number, granularity: JoinTimelineGranularity): number {
  const date = new Date(timestamp);
  if (granularity === "hour") {
    date.setMinutes(0, 0, 0);
    return date.getTime();
  }
  date.setHours(0, 0, 0, 0);
  if (granularity === "week") date.setDate(date.getDate() - date.getDay());
  return date.getTime();
}

function startOfNextBucket(bucketStart: number, granularity: JoinTimelineGranularity): number {
  const date = new Date(bucketStart);
  if (granularity === "hour") date.setHours(date.getHours() + 1);
  else if (granularity === "day") date.setDate(date.getDate() + 1);
  else date.setDate(date.getDate() + 7);
  return date.getTime();
}

function formatBucket(bucketStart: number, granularity: JoinTimelineGranularity): string {
  const date = new Date(bucketStart);
  if (granularity === "hour") {
    return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric" });
  }
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return granularity === "week" ? `Week of ${day}` : day;
}

export function buildJoinTimeline(joins: ParticipantJoin[]): JoinTimelineBucket[] {
  if (joins.length === 0) return [];

  const sorted = [...joins].sort((a, b) => a.joinedAt - b.joinedAt);
  const firstJoinedAt = sorted[0].joinedAt;
  const lastJoinedAt = sorted[sorted.length - 1].joinedAt;
  const granularity = pickGranularity(lastJoinedAt - firstJoinedAt);

  const buckets: JoinTimelineBucket[] = [];
  let joinIndex = 0;
  let totalSoFar = 0;
  let anonymousSoFar = 0;

  for (
    let bucketStart = startOfBucket(firstJoinedAt, granularity);
    bucketStart <= lastJoinedAt;
    bucketStart = startOfNextBucket(bucketStart, granularity)
  ) {
    const bucketEnd = startOfNextBucket(bucketStart, granularity);
    let named = 0;
    let anonymous = 0;
    while (joinIndex < sorted.length && sorted[joinIndex].joinedAt < bucketEnd) {
      if (sorted[joinIndex].isAnonymous) anonymous++;
      else named++;
      joinIndex++;
    }

    totalSoFar += named + anonymous;
    anonymousSoFar += anonymous;
    buckets.push({
      label: formatBucket(bucketStart, granularity),
      named,
      anonymous,
      totalSoFar,
      anonymousPctSoFar: Math.round((anonymousSoFar / totalSoFar) * 100),
      startsAt: bucketStart,
    });
  }

  return buckets;
}
