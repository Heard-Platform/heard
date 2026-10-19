import _ from "lodash";
import { getSentEmails } from "./kv-utils.tsx";
import { countEventsOfType, getEventsOfType, getAllRoomViews, getFlyerSwipeEvents, getSwipeSixEvents, getFlyerLandingEvents, getFlyerScreenEvents, getAppLoadEvents } from "./model-utils.ts";
import { FLYER_RESULTS_LINK_SOURCE } from "./template-flyer-results.ts";
import { FLYER_WELCOME_LINK_SOURCE } from "./template-flyer-welcome.ts";
import {
  RESPONSE_VOTES_NOTIF_EMAIL_TYPE,
  RESPONSE_VOTES_NOTIF_BUTTON_CLICKED_EVENT,
} from "./email-response-votes-notif-template.ts";
import {
  CLUSTER_RECOMPUTE_EVENT,
  CLUSTER_IDENTITY_KEPT_EVENT,
  CLUSTER_IDENTITY_NEW_EVENT,
} from "./clustering.tsx";
import { getEasternDate, getEasternDatesEndingAt, toTimestamp } from "./time-utils.ts";
import { selectAllWithoutLimit } from "./db-utils.ts";
import { CLUSTER_NAMING_ENDPOINT } from "./cluster-naming.ts";
import { startOfUtcWeek, WEEK_MS } from "./stats-utils.ts";
import { getAllSwipeSixCompletions } from "./swipe-six-model.ts";

const RESPONSE_VOTES_NOTIF_RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const getResponseVotesNotifStats = async (): Promise<{
  emailsSent: number;
  buttonClicks: number;
  returnedWithinWeek: number;
}> => {
  const [allSentEmails, buttonClicks, allRoomViews] = await Promise.all([
    getSentEmails(),
    countEventsOfType(RESPONSE_VOTES_NOTIF_BUTTON_CLICKED_EVENT),
    getAllRoomViews(),
  ]);
  const sentEmails = allSentEmails.filter(
    (email) => email.emailType === RESPONSE_VOTES_NOTIF_EMAIL_TYPE,
  );
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
    countEventsOfType(CLUSTER_IDENTITY_KEPT_EVENT),
    countEventsOfType(CLUSTER_IDENTITY_NEW_EVENT),
  ]);
  const recomputeTimestamps = recomputes.map((e) => toTimestamp(e.createdAt));
  const identityTotal = kept + created;

  return {
    recomputesLast7Days: recomputeTimestamps.filter((ts) => ts >= now - WEEK_MS).length,
    recomputesWeekly: countByWeek(recomputeTimestamps),
    identityKeptPercent:
      identityTotal > 0 ? Math.round((kept / identityTotal) * 1000) / 10 : null,
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

const FLYER_SWIPE_SAVED_EVENT = "flyer_results_get_results_clicked";
const FLYER_SWIPE_EXITED_EVENTS = ["flyer_swipe_closed_results", "flyer_swipe_just_looking_clicked"];

export function buildFlyerSwipeFunnel(
  events: { type: string; userId: string | null }[],
): { opened: number; swipes: number[]; saved: number; exited: number } {
  const openedUserIds = new Set<string>();
  for (const event of events) {
    if (event.userId && event.type === "flyer_swipe_opened") openedUserIds.add(event.userId);
  }

  const swipeUserIds: Set<string>[] = [];
  const savedUserIds = new Set<string>();
  const exitedUserIds = new Set<string>();
  for (const event of events) {
    if (!event.userId || !openedUserIds.has(event.userId)) continue;
    const cardMatch = event.type.match(/^flyer_swipe_card_(\d+)_/);
    if (cardMatch) {
      const index = Number(cardMatch[1]) - 1;
      for (let i = swipeUserIds.length; i <= index; i++) swipeUserIds.push(new Set());
      swipeUserIds[index].add(event.userId);
    }
    if (event.type === FLYER_SWIPE_SAVED_EVENT) savedUserIds.add(event.userId);
    if (FLYER_SWIPE_EXITED_EVENTS.includes(event.type)) exitedUserIds.add(event.userId);
  }
  for (const userId of savedUserIds) exitedUserIds.delete(userId);

  return {
    opened: openedUserIds.size,
    swipes: swipeUserIds.map((userIds) => userIds.size),
    saved: savedUserIds.size,
    exited: exitedUserIds.size,
  };
}

export const getFlyerSwipeFunnel = async () => buildFlyerSwipeFunnel(await getFlyerSwipeEvents());

export const SWIPE_SIX_CARD_COUNT = 6;
export const SWIPE_SIX_DAILY_WINDOW_DAYS = 14;

export function buildSwipeSixFunnel(
  events: { type: string; userId: string | null }[],
): { bannerShown: number; started: number; swipes: number[]; completed: number; allDoneClicked: number } {
  const countUsers = (matches: (type: string) => boolean) =>
    _(events)
      .filter((event) => !!event.userId && matches(event.type))
      .map("userId")
      .uniq()
      .size();

  return {
    bannerShown: countUsers((type) => type === "swipe_six_banner_shown"),
    started: countUsers((type) => type === "swipe_six_started"),
    swipes: _.times(SWIPE_SIX_CARD_COUNT, (i: number) =>
      countUsers((type) => type.startsWith(`swipe_six_card_${i + 1}_`)),
    ),
    completed: countUsers((type) => type === "swipe_six_completed"),
    allDoneClicked: countUsers((type) => type === "swipe_six_all_done_clicked"),
  };
}

// Completions per local date for the last few Eastern days ending at now, oldest first.
export function buildSwipeSixDailyCompletions(
  localDates: string[],
  now: number,
  days = SWIPE_SIX_DAILY_WINDOW_DAYS,
): { date: string; count: number }[] {
  const counts = _.countBy(localDates);
  return getEasternDatesEndingAt(now, days).map((date) => ({ date, count: counts[date] ?? 0 }));
}

export const getSwipeSixFunnel = async () => buildSwipeSixFunnel(await getSwipeSixEvents());

export const getSwipeSixDailyCompletions = async () => {
  const completions = await getAllSwipeSixCompletions();
  return buildSwipeSixDailyCompletions(
    completions.map((completion) => completion.localDate),
    Date.now(),
  );
};

export const FLYER_LANDING_OPENED_EVENT = "flyer_landing_opened";
export const FLYER_LANDING_EMAIL_SUBMITTED_EVENT = "flyer_landing_email_submitted";
export const FLYER_LANDING_LOOKED_AROUND_EVENT = "flyer_landing_looked_around";

export function buildFlyerLandingFunnel(
  events: { type: string; userId: string | null }[],
): { opened: number; submitted: number; lookedAround: number } {
  const countUsers = (type: string) =>
    new Set(events.filter((event) => event.userId && event.type === type).map((event) => event.userId)).size;

  return {
    opened: countUsers(FLYER_LANDING_OPENED_EVENT),
    submitted: countUsers(FLYER_LANDING_EMAIL_SUBMITTED_EVENT),
    lookedAround: countUsers(FLYER_LANDING_LOOKED_AROUND_EVENT),
  };
}

export const getFlyerLandingFunnel = async () => buildFlyerLandingFunnel(await getFlyerLandingEvents());

export interface FlyerScreenEventTypes {
  opened: string;
  emailAdded: string;
}

export const FLYER_SCREEN_EVENTS: FlyerScreenEventTypes = {
  opened: "flyer_screen_opened",
  emailAdded: "flyer_screen_email_added",
};

export const PERSONAL_FLYER_SCREEN_EVENTS: FlyerScreenEventTypes = {
  opened: "personal_flyer_screen_opened",
  emailAdded: "personal_flyer_screen_email_added",
};

export const FLYER_EMAIL_RETURNED_EVENTS = [
  `referred_by_${FLYER_WELCOME_LINK_SOURCE}`,
  `referred_by_${FLYER_RESULTS_LINK_SOURCE}`,
];
const isFlyerEmailReturn = (type: string) => FLYER_EMAIL_RETURNED_EVENTS.includes(type);

type FunnelEvent = { type: string; userId: string | null; createdAt: number | string };

export function buildFlyerScreenFunnel(
  events: FunnelEvent[],
  appLoads: { userId: string | null; createdAt: number | string }[],
  screenEvents: FlyerScreenEventTypes,
): { opened: number; emailAdded: number; returnedViaEmail: number; returnedOnMultipleDays: number } {
  const usersWith = (isMatch: (type: string) => boolean) =>
    new Set(_.compact(events.filter((event) => isMatch(event.type)).map((event) => event.userId)));
  const openedUserIds = usersWith((type) => type === screenEvents.opened);

  const emailAddedAt = new Map<string, number>();
  for (const event of events) {
    if (!event.userId || event.type !== screenEvents.emailAdded) continue;
    const at = toTimestamp(event.createdAt);
    emailAddedAt.set(event.userId, Math.min(at, emailAddedAt.get(event.userId) ?? at));
  }

  const returnedViaEmailUserIds = [...usersWith(isFlyerEmailReturn)].filter((userId) => emailAddedAt.has(userId));

  const loadDaysSinceEmailAdded = new Map<string, Set<string>>();
  for (const load of appLoads) {
    const addedAt = load.userId ? emailAddedAt.get(load.userId) : undefined;
    const at = toTimestamp(load.createdAt);
    if (addedAt === undefined || at <= addedAt) continue;
    const days = loadDaysSinceEmailAdded.get(load.userId!) ?? new Set<string>();
    days.add(getEasternDate(at));
    loadDaysSinceEmailAdded.set(load.userId!, days);
  }

  return {
    opened: openedUserIds.size,
    emailAdded: emailAddedAt.size,
    returnedViaEmail: returnedViaEmailUserIds.length,
    returnedOnMultipleDays: [...loadDaysSinceEmailAdded.values()].filter((days) => days.size > 1).length,
  };
}

export const getFlyerScreenFunnel = async (screenEvents: FlyerScreenEventTypes) => {
  const events = await getFlyerScreenEvents([
    screenEvents.opened,
    screenEvents.emailAdded,
    ...FLYER_EMAIL_RETURNED_EVENTS,
  ]);
  const emailAddedEvents = events.filter((e) => e.type === screenEvents.emailAdded);
  const emailAddedUserIds = _.uniq(_.compact(emailAddedEvents.map((e) => e.userId)));
  return buildFlyerScreenFunnel(events, await getAppLoadEvents(emailAddedUserIds), screenEvents);
};
