import { ONE_MIN_MS } from "./time-utils.ts";
import { DebateRoom } from "./types.tsx";

export const recencyScore = (minutesAgo: number): number =>
  1 / (1 + minutesAgo / 30);

const ACTIVITY_WEIGHT = 100;
const CREATION_WEIGHT = 20;
const VOTE_WEIGHT = 0.3;

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
