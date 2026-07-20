import { selectAll } from "./db-utils.ts";
import { getAllRealUsers } from "./kv-utils.tsx";
import { DebateRoom, UserEvent } from "./types.tsx";

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

export interface FlyerSignup {
  userId: string;
  createdAt: number | string;
}

export const REFERRED_BY_EVENT_TYPES = [
  "referred_by_newsletter",
  "referred_by_user",
  "referred_by_social",
];

const EVENT_TYPE_TO_KEY: Record<string, Exclude<TrafficSourceKey, "other" | "direct" | "flyer">> = {
  referred_by_newsletter: "newsletter",
  referred_by_user: "referral",
  referred_by_social: "social",
};

function toTimestamp(val: number | string | undefined): number {
  if (!val) return 0;
  const n = Number(val);
  return isNaN(n) ? new Date(val).getTime() : n;
}

function isDirectRoomLoad(url: string | undefined, roomId: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.pathname === `/room/${roomId}` && !parsed.searchParams.has("src");
  } catch {
    return false;
  }
}

interface AttributionCandidate {
  userId: string;
  key: Exclude<TrafficSourceKey, "other">;
  createdAt: number;
  referralUserId?: string;
}

export function computeRoomTrafficSources(
  room: Pick<DebateRoom, "id" | "hostId" | "cohostIds" | "participants">,
  events: UserEvent[],
  flyerSignups: FlyerSignup[],
): RoomTrafficSources {
  const excluded = new Set([room.hostId, ...(room.cohostIds ?? [])]);
  const participantIds = new Set(room.participants.filter((id) => !excluded.has(id)));

  const candidates: AttributionCandidate[] = [];

  for (const event of events) {
    if (!event.userId || !participantIds.has(event.userId)) continue;

    const key = event.type === "initial_load"
      ? (isDirectRoomLoad(event.url, room.id) ? "direct" : undefined)
      : EVENT_TYPE_TO_KEY[event.type];
    if (!key) continue;

    candidates.push({
      userId: event.userId,
      key,
      createdAt: toTimestamp(event.createdAt),
      referralUserId: key === "referral" ? event.referralUserId : undefined,
    });
  }

  for (const signup of flyerSignups) {
    if (!participantIds.has(signup.userId)) continue;
    candidates.push({ userId: signup.userId, key: "flyer", createdAt: toTimestamp(signup.createdAt) });
  }

  const firstByUser = new Map<string, AttributionCandidate>();
  for (const candidate of candidates) {
    const existing = firstByUser.get(candidate.userId);
    if (!existing || candidate.createdAt < existing.createdAt) {
      firstByUser.set(candidate.userId, candidate);
    }
  }

  const counts: Record<Exclude<TrafficSourceKey, "other">, number> = {
    direct: 0,
    newsletter: 0,
    referral: 0,
    flyer: 0,
    social: 0,
  };
  const sharesByReferrer = new Map<string, number>();

  for (const candidate of firstByUser.values()) {
    counts[candidate.key]++;
    if (candidate.key === "referral" && candidate.referralUserId) {
      sharesByReferrer.set(
        candidate.referralUserId,
        (sharesByReferrer.get(candidate.referralUserId) ?? 0) + 1,
      );
    }
  }

  // Anonymized: rank-ordered share counts only, no referrer identity leaves the server.
  const referrers: ReferrerShareCount[] = Array.from(sharesByReferrer.values())
    .sort((a, b) => b - a)
    .map((shares, i) => ({ id: `referrer-${i}`, shares }));

  const attributed = counts.direct + counts.newsletter + counts.referral + counts.flyer + counts.social;
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

export async function getRoomTrafficSources(room: DebateRoom): Promise<RoomTrafficSources> {
  const [referredByEvents, initialLoadEvents, users] = await Promise.all([
    selectAll<UserEvent>(
      "user_events",
      { roomId: room.id },
      (q: any) => q.in("type", REFERRED_BY_EVENT_TYPES),
    ),

    selectAll<UserEvent>(
      "user_events",
      { type: "initial_load" },
      (q: any) => q.like("url", `%/room/${room.id}%`),
    ),
    getAllRealUsers(),
  ]);

  const flyerSignups: FlyerSignup[] = users
    .filter((user) => user.flyerId === room.id)
    .map((user) => ({ userId: user.id, createdAt: user.createdAt }));

  return computeRoomTrafficSources(room, [...referredByEvents, ...initialLoadEvents], flyerSignups);
}
