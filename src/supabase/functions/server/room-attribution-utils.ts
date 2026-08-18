import { selectAll } from "./db-utils.ts";
import { getAllRealUsers, getAllUsers } from "./kv-utils.tsx";
import { getRoomParticipants } from "./room-utils.ts";
import { DebateRoom, User, UserEvent } from "./types.tsx";
import { obfuscateEmail } from "./utils.tsx";

export type TrafficSourceKey =
  | "direct"
  | "newsletter"
  | "referral"
  | "flyer"
  | "social"
  | "other";

export interface TrafficSourceCount {
  key: TrafficSourceKey;
  count: number;
}

export interface ReferrerShareCount {
  id: string;
  shares: number;
}

export interface AnonymityBreakdown {
  anonymous: number;
  named: number;
}

export interface RoomTrafficSources {
  trafficSources: TrafficSourceCount[];
  referrers: ReferrerShareCount[];
  anonymity: AnonymityBreakdown;
}

export const REFERRAL_EVENT_TYPES = [
  "referred_by_newsletter",
  "referred_by_user",
  "referred_by_social",
];

const FLYER_SIGNUP_EVENT_TYPE = "flyer_signup";

const EVENT_TYPE_TO_KEY: Record<
  string,
  Exclude<TrafficSourceKey, "other" | "direct">
> = {
  referred_by_newsletter: "newsletter",
  referred_by_user: "referral",
  referred_by_social: "social",
  [FLYER_SIGNUP_EVENT_TYPE]: "flyer",
};

function toTimestamp(val: number | string | undefined): number {
  if (!val) return 0;
  const n = Number(val);
  return isNaN(n) ? new Date(val).getTime() : n;
}

function isDirectRoomLoad(event: UserEvent, roomId: string): boolean {
  if (event.type !== "initial_load" || !event.url) return false;
  try {
    const parsed = new URL(event.url);
    return (
      parsed.pathname === `/room/${roomId}` &&
      !parsed.searchParams.has("src")
    );
  } catch {
    return false;
  }
}

export function computeRoomTrafficSources(
  room: Pick<DebateRoom, "id" | "hostId" | "cohostIds">,
  participantIds: string[],
  events: UserEvent[],
  users: User[],
): RoomTrafficSources {
  const excluded = new Set([room.hostId, ...(room.cohostIds ?? [])]);
  const usersById = new Map(users.map((user) => [user.id, user]));

  const eventsByUserId = new Map<string, UserEvent[]>();
  for (const event of events) {
    if (!event.userId) continue;
    const userEvents = eventsByUserId.get(event.userId);
    if (userEvents) userEvents.push(event);
    else eventsByUserId.set(event.userId, [event]);
  }

  const roomParticipantIds = participantIds.filter(
    (id) => usersById.has(id) && !excluded.has(id),
  );

  const counts: Record<TrafficSourceKey, number> = {
    direct: 0,
    newsletter: 0,
    referral: 0,
    flyer: 0,
    social: 0,
    other: 0,
  };
  const sharesByReferrer = new Map<string, number>();
  let anonymous = 0;

  for (const participantId of roomParticipantIds) {
    const user = usersById.get(participantId)!;
    if (user.isAnonymous) anonymous++;

    const signals = [...(eventsByUserId.get(participantId) ?? [])];
    if (user.flyerId === room.id) {
      signals.push({
        type: FLYER_SIGNUP_EVENT_TYPE,
        userId: participantId,
        createdAt: toTimestamp(user.createdAt),
      });
    }
    signals.sort(
      (a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt),
    );

    let key: TrafficSourceKey = "other";
    let referralUserId: string | undefined;
    for (const signal of signals) {
      const signalKey = isDirectRoomLoad(signal, room.id)
        ? "direct"
        : EVENT_TYPE_TO_KEY[signal.type];
      if (!signalKey) continue;
      key = signalKey;
      referralUserId =
        signalKey === "referral" ? signal.referralUserId : undefined;
      break;
    }

    counts[key]++;
    if (key === "referral" && referralUserId) {
      sharesByReferrer.set(
        referralUserId,
        (sharesByReferrer.get(referralUserId) ?? 0) + 1,
      );
    }
  }

  const anonymity: AnonymityBreakdown = {
    anonymous,
    named: roomParticipantIds.length - anonymous,
  };

  const referrers: ReferrerShareCount[] = Array.from(
    sharesByReferrer.values(),
  )
    .sort((a, b) => b - a)
    .map((shares, i) => ({ id: `referrer-${i}`, shares }));

  return {
    trafficSources: [
      { key: "direct", count: counts.direct },
      { key: "newsletter", count: counts.newsletter },
      { key: "referral", count: counts.referral },
      { key: "flyer", count: counts.flyer },
      { key: "social", count: counts.social },
      { key: "other", count: counts.other },
    ],
    referrers,
    anonymity,
  };
}

export interface ReferralEventSourceCount {
  source: string;
  count: number;
}

export interface ReferralEventDetail {
  refereeUserId: string;
  refereeEmail?: string;
  source: string;
  referrerUserId?: string;
  referrerEmail?: string;
  roomId?: string;
  createdAt: number;
}

export interface ReferralEventSummary {
  bySource: ReferralEventSourceCount[];
  referrals: ReferralEventDetail[];
}

export function computeReferralEventSummary(
  events: UserEvent[],
  emailByUserId: Record<string, string> = {},
): ReferralEventSummary {
  const sourceCounts = new Map<string, number>();
  const referrals: ReferralEventDetail[] = [];

  for (const event of events) {
    const source = event.type.replace(/^referred_by_/, "");
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);

    if (!event.userId) continue;

    const refereeEmail = emailByUserId[event.userId];
    const referrerEmail = event.referralUserId ? emailByUserId[event.referralUserId] : undefined;

    referrals.push({
      refereeUserId: event.userId,
      source,
      ...(refereeEmail ? { refereeEmail: obfuscateEmail(refereeEmail) } : {}),
      ...(event.referralUserId ? { referrerUserId: event.referralUserId } : {}),
      ...(referrerEmail ? { referrerEmail: obfuscateEmail(referrerEmail) } : {}),
      ...(event.roomId ? { roomId: event.roomId } : {}),
      createdAt: toTimestamp(event.createdAt),
    });
  }

  return {
    bySource: Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    referrals: referrals.sort((a, b) => b.createdAt - a.createdAt),
  };
}

export async function getReferralEventSummary(): Promise<ReferralEventSummary> {
  const [events, users] = await Promise.all([
    selectAll<UserEvent>(
      "user_events",
      {},
      (q: any) => q.like("type", "referred_by_%"),
    ),
    getAllRealUsers(),
  ]);

  const emailByUserId: Record<string, string> = {};
  const realUserIds = new Set<string>();
  for (const user of users) {
    realUserIds.add(user.id);
    if (user.email) emailByUserId[user.id] = user.email;
  }

  const realEvents = events.filter((e) => !e.userId || realUserIds.has(e.userId));

  return computeReferralEventSummary(realEvents, emailByUserId);
}

export async function getRoomTrafficSources(
  room: DebateRoom,
): Promise<RoomTrafficSources> {
  const [referredByEvents, initialLoadEvents, users, participantIds] =
    await Promise.all([
      selectAll<UserEvent>(
        "user_events",
        { roomId: room.id },
        (q: any) => q.in("type", REFERRAL_EVENT_TYPES),
      ),
      selectAll<UserEvent>(
        "user_events",
        { type: "initial_load" },
        (q: any) => q.like("url", `%/room/${room.id}%`),
      ),
      getAllUsers(),
      getRoomParticipants(room.id),
    ]);

  return computeRoomTrafficSources(
    room,
    participantIds,
    [...referredByEvents, ...initialLoadEvents],
    users,
  );
}
