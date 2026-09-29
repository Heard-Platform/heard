import { getSentEmails } from "./kv-utils.tsx";
import { getEventsOfType, getAllRoomViews } from "./model-utils.ts";
import {
  RESPONSE_VOTES_NOTIF_EMAIL_TYPE,
  RESPONSE_VOTES_NOTIF_BUTTON_CLICKED_EVENT,
} from "./email-response-votes-notif-template.ts";
import {
  CLUSTER_RECOMPUTE_EVENT,
  CLUSTER_IDENTITY_KEPT_EVENT,
  CLUSTER_IDENTITY_NEW_EVENT,
} from "./clustering.tsx";
import { toTimestamp } from "./time-utils.ts";
import { selectAllWithoutLimit } from "./db-utils.ts";
import { CLUSTER_NAMING_ENDPOINT } from "./cluster-naming.ts";

const RESPONSE_VOTES_NOTIF_RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const getResponseVotesNotifStats = async (): Promise<{
  emailsSent: number;
  buttonClicks: number;
  returnedWithinWeek: number;
}> => {
  const sentEmails = (await getSentEmails()).filter(
    (email) => email.emailType === RESPONSE_VOTES_NOTIF_EMAIL_TYPE,
  );
  const buttonClicks = (
    await getEventsOfType(RESPONSE_VOTES_NOTIF_BUTTON_CLICKED_EVENT)
  ).length;

  const allRoomViews = await getAllRoomViews();
  const lastSeenAtByUserRoom = new Map<string, number>();
  for (const view of allRoomViews) {
    lastSeenAtByUserRoom.set(`${view.userId}:${view.roomId}`, view.lastSeenAt);
  }

  const returnedWithinWeek = sentEmails.filter((email) => {
    if (!email.roomId) return false;
    const lastSeenAt = lastSeenAtByUserRoom.get(`${email.userId}:${email.roomId}`);
    if (!lastSeenAt) return false;
    return (
      lastSeenAt >= email.sentAt &&
      lastSeenAt <= email.sentAt + RESPONSE_VOTES_NOTIF_RETURN_WINDOW_MS
    );
  }).length;

  return { emailsSent: sentEmails.length, buttonClicks, returnedWithinWeek };
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcWeek(timestamp: number): number {
  const date = new Date(timestamp);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - daysSinceMonday * DAY_MS;
}

export function countByWeek(timestamps: number[]): { weekStart: string; count: number }[] {
  if (timestamps.length === 0) return [];
  const counts = new Map<number, number>();
  for (const ts of timestamps) {
    const week = startOfUtcWeek(ts);
    counts.set(week, (counts.get(week) ?? 0) + 1);
  }
  const weeks = [...counts.keys()];
  const first = Math.min(...weeks);
  const last = Math.max(...weeks);
  const result: { weekStart: string; count: number }[] = [];
  for (let week = first; week <= last; week += WEEK_MS) {
    result.push({
      weekStart: new Date(week).toISOString().slice(0, 10),
      count: counts.get(week) ?? 0,
    });
  }
  return result;
}

export const getClusterStabilityStats = async (now: number = Date.now()): Promise<{
  recomputesLast7Days: number;
  recomputesWeekly: { weekStart: string; count: number }[];
  identityKeptPercent: number | null;
}> => {
  const [recomputes, kept, created] = await Promise.all([
    getEventsOfType(CLUSTER_RECOMPUTE_EVENT),
    getEventsOfType(CLUSTER_IDENTITY_KEPT_EVENT),
    getEventsOfType(CLUSTER_IDENTITY_NEW_EVENT),
  ]);
  const recomputeTimestamps = recomputes.map((e) => toTimestamp(e.createdAt));
  const identityTotal = kept.length + created.length;

  return {
    recomputesLast7Days: recomputeTimestamps.filter((ts) => ts >= now - WEEK_MS).length,
    recomputesWeekly: countByWeek(recomputeTimestamps),
    identityKeptPercent:
      identityTotal > 0 ? Math.round((kept.length / identityTotal) * 1000) / 10 : null,
  };
};

export const getClusterNamingTokens = async (): Promise<number> => {
  const calls = await selectAllWithoutLimit<{ totalTokens: number }>(
    "llm_api_calls",
    { endpoint: CLUSTER_NAMING_ENDPOINT },
    "createdAt",
  );
  return calls.reduce((sum, call) => sum + call.totalTokens, 0);
};
