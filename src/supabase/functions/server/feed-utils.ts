import _ from "lodash";
import { ONE_MIN_MS } from "./time-utils.ts";
import { Community, DebateRoom } from "./types.tsx";

export const recencyScore = (minutesAgo: number): number =>
  1 / (1 + minutesAgo / 30);

const ACTIVITY_WEIGHT = 100;
const CREATION_WEIGHT = 20;
const VOTE_WEIGHT = 0.6;

export const scoreRoom = (
  room: DebateRoom,
  now: number,
): number => {
  const lastActivity = room.lastActivityAt ?? room.createdAt;
  const totalVotes = room.totalVotes ?? 0;
  return (
    recencyScore((now - lastActivity) / ONE_MIN_MS) * (ACTIVITY_WEIGHT + (totalVotes * VOTE_WEIGHT)) +
    recencyScore((now - room.createdAt) / ONE_MIN_MS) * CREATION_WEIGHT
  );
};

export const sortRoomsByActivity = (
  rooms: DebateRoom[],
  now: number = Date.now(),
): DebateRoom[] =>
  rooms
    .map((room) => ({ room, score: scoreRoom(room, now) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ room }) => room);

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
