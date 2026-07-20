import { selectAll } from "./db-utils.ts";
import { getAllRealUsers } from "./kv-utils.tsx";
import { DebateRoom, UserEvent } from "./types.tsx";
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

export interface RoomTrafficSources {
  trafficSources: TrafficSourceCount[];
  referrers: ReferrerShareCount[];
}

export interface FlyerUser {
  userId: string;
  createdAt: number | string;
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

interface Attribution {
  key: Exclude<TrafficSourceKey, "other">;
  referralUserId?: string;
}

export function computeRoomTrafficSources(
  room: Pick<
    DebateRoom,
    "id" | "hostId" | "cohostIds" | "participants"
  >,
  events: UserEvent[],
  flyerUsers: FlyerUser[],
): RoomTrafficSources {
  const excluded = new Set([room.hostId, ...(room.cohostIds ?? [])]);
  const participantIds = new Set(
    room.participants.filter((id) => !excluded.has(id)),
  );

  const flyerEvents: UserEvent[] = flyerUsers.map((flyerUser) => ({
    type: FLYER_SIGNUP_EVENT_TYPE,
    userId: flyerUser.userId,
    createdAt: toTimestamp(flyerUser.createdAt),
  }));

  const allEvents = [...events, ...flyerEvents].sort(
    (a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt),
  );

  const firstByUser = new Map<string, Attribution>();
  for (const event of allEvents) {
    if (!event.userId || !participantIds.has(event.userId)) continue;
    if (firstByUser.has(event.userId)) continue;

    const key = isDirectRoomLoad(event, room.id)
      ? "direct"
      : EVENT_TYPE_TO_KEY[event.type];
    if (!key) continue;

    firstByUser.set(event.userId, {
      key,
      referralUserId:
        key === "referral" ? event.referralUserId : undefined,
    });
  }

  const counts: Record<Exclude<TrafficSourceKey, "other">, number> = {
    direct: 0,
    newsletter: 0,
    referral: 0,
    flyer: 0,
    social: 0,
  };
  const sharesByReferrer = new Map<string, number>();

  for (const attribution of firstByUser.values()) {
    counts[attribution.key]++;
    if (
      attribution.key === "referral" &&
      attribution.referralUserId
    ) {
      sharesByReferrer.set(
        attribution.referralUserId,
        (sharesByReferrer.get(attribution.referralUserId) ?? 0) + 1,
      );
    }
  }

  const referrers: ReferrerShareCount[] = Array.from(
    sharesByReferrer.values(),
  )
    .sort((a, b) => b - a)
    .map((shares, i) => ({ id: `referrer-${i}`, shares }));

  const attributed =
    counts.direct +
    counts.newsletter +
    counts.referral +
    counts.flyer +
    counts.social;
  const otherCount = Math.max(0, participantIds.size - attributed);

  return {
    trafficSources: [
      { key: "direct", count: counts.direct },
      { key: "newsletter", count: counts.newsletter },
      { key: "referral", count: counts.referral },
      { key: "flyer", count: counts.flyer },
      { key: "social", count: counts.social },
      { key: "other", count: otherCount },
    ],
    referrers,
  };
}

export interface ReferralEventSourceCount {
  source: string;
  count: number;
}

// One row per person who arrived via a referred_by_* event, whatever the
// source — referrer fields are only populated for source === "user", the
// only source that has a sharer to attribute.
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
  const [referredByEvents, initialLoadEvents, users] =
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
      getAllRealUsers(),
    ]);

  const realUserIds = new Set(users.map((user) => user.id));

  const flyerUsers: FlyerUser[] = users
    .filter((user) => user.flyerId === room.id)
    .map((user) => ({ userId: user.id, createdAt: user.createdAt }));

  const realRoom = {
    ...room,
    participants: room.participants.filter((id) => realUserIds.has(id)),
  };

  return computeRoomTrafficSources(
    realRoom,
    [...referredByEvents, ...initialLoadEvents],
    flyerUsers,
  );
}
