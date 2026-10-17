import _ from "lodash";
import { ONE_DAY_MS, ONE_MIN_MS } from "./time-utils.ts";
import { Community, DebateRoom } from "./types.tsx";

const ACTIVITY_HALF_LIFE_MIN = 60 * 12;

export const recencyScore = (minutesAgo: number): number =>
  1 / (1 + minutesAgo / ACTIVITY_HALF_LIFE_MIN);

const ACTIVITY_WEIGHT = 100;
const VOTE_WEIGHT = 0.6;

export const scoreRoom = (
  room: DebateRoom,
  now: number,
): number => {
  if (room.lastActivityAt == null) return 0;

  const totalVotes = room.totalVotes ?? 0;
  return (
    recencyScore((now - room.lastActivityAt) / ONE_MIN_MS) *
    (ACTIVITY_WEIGHT + totalVotes * VOTE_WEIGHT)
  );
};

const BRAND_NEW_WINDOW_MS = 5 * ONE_MIN_MS;
const ALIVE_WINDOW_MS = 3 * ONE_DAY_MS;

type FeedTier = "spotlight" | "alive" | "new" | "stale";

const getFeedTier = (room: DebateRoom, now: number): FeedTier => {
  if (now - room.createdAt < BRAND_NEW_WINDOW_MS) return "spotlight";
  if (room.lastActivityAt != null) {
    return now - room.lastActivityAt < ALIVE_WINDOW_MS ? "alive" : "stale";
  }
  return now - room.createdAt < ALIVE_WINDOW_MS ? "new" : "stale";
};

export const sortRoomsByActivity = (
  rooms: DebateRoom[],
  now: number = Date.now(),
): DebateRoom[] => {
  const tiers = _.groupBy(rooms, (room: DebateRoom) => getFeedTier(room, now));
  return [
    ..._.orderBy(tiers.spotlight ?? [], "createdAt", "desc"),
    ..._.orderBy(tiers.alive ?? [], (room: DebateRoom) => scoreRoom(room, now), "desc"),
    ..._.orderBy(tiers.new ?? [], "createdAt", "desc"),
    ..._.orderBy(tiers.stale ?? [], (room: DebateRoom) => room.totalVotes ?? 0, "desc"),
  ];
};

export const filterFeedRooms = (
  rooms: DebateRoom[],
  communities: Community[],
  memberships: Set<string>,
  userId: string,
  selectedSubheard?: string,
): DebateRoom[] => {
  const communityMap = new Map(communities.map((c) => [c.name, c]));
  return rooms.filter((room) => {
    if (selectedSubheard) return room.subHeard === selectedSubheard;
    if (!room.subHeard) return false;

    const community = communityMap.get(room.subHeard);
    if (!community) return false;

    const isAdmin = community.adminId === userId;
    return (
      !community.isPrivate ||
      memberships.has(room.subHeard) ||
      isAdmin
    );
  });
};

export const sortRoomsForFeed = (
  rooms: DebateRoom[],
  memberships: Set<string>,
  now: number = Date.now(),
): DebateRoom[] => {
  const [joined, other] = _.partition(
    rooms,
    (r: DebateRoom) => !!r.subHeard && memberships.has(r.subHeard),
  );
  return [
    ...sortRoomsByActivity(joined, now),
    ...sortRoomsByActivity(other, now),
  ];
};
