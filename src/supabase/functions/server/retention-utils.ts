import { User, Vote, Statement, DebateRoom } from "./types.tsx";
import { buildActiveDaysMap } from "./stats-utils.ts";
import { obfuscateEmail, obfuscatePhone } from "./utils.tsx";
import { getWeekStart, buildParticipatedRoomsByUser, type CohortTopPost } from "./cohort-utils.ts";

export interface UserRetentionRow {
  id: string;
  idPrefix: string;
  nickname: string;
  obfuscatedEmail: string;
  obfuscatedPhone: string;
  createdAt: number;
  activeDays: number;
  activeWeeks: number;
  topPosts: CohortTopPost[];
}

const TOP_POSTS_PER_USER = 3;
const ID_PREFIX_LENGTH = 8;

function buildUserVotesByRoom(
  votes: Vote[],
  statements: Statement[],
): Map<string, Map<string, number>> {
  const statementRoomMap = new Map<string, string>();
  for (const s of statements) statementRoomMap.set(s.id, s.roomId);

  const userVotesByRoom = new Map<string, Map<string, number>>();
  for (const v of votes) {
    const roomId = statementRoomMap.get(v.statementId);
    if (!roomId) continue;
    if (!userVotesByRoom.has(v.userId)) userVotesByRoom.set(v.userId, new Map());
    const roomCounts = userVotesByRoom.get(v.userId)!;
    roomCounts.set(roomId, (roomCounts.get(roomId) ?? 0) + 1);
  }
  return userVotesByRoom;
}

export function buildUserRetentionTable(
  users: User[],
  votes: Vote[],
  statements: Statement[],
  rooms: DebateRoom[],
): UserRetentionRow[] {
  const roomById = new Map<string, DebateRoom>();
  for (const room of rooms) roomById.set(room.id, room);

  const userVotesByRoom = buildUserVotesByRoom(votes, statements);
  const participatedRoomsByUser = buildParticipatedRoomsByUser(votes, statements);
  const activeDaysByUser = buildActiveDaysMap(votes, statements);

  return users.map((user) => {
    const activeDays = activeDaysByUser.get(user.id) ?? new Set<number>();
    const activeWeeks = new Set<number>();
    for (const day of activeDays) activeWeeks.add(getWeekStart(day));

    const participatedRoomIds = participatedRoomsByUser.get(user.id) ?? new Set<string>();
    const userRoomVotes = userVotesByRoom.get(user.id) ?? new Map<string, number>();
    const topPosts = [...participatedRoomIds]
      .map((roomId) => ({ room: roomById.get(roomId), votes: userRoomVotes.get(roomId) ?? 0 }))
      .filter((entry): entry is { room: DebateRoom; votes: number } => !!entry.room)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, TOP_POSTS_PER_USER)
      .map(({ room, votes }) => ({
        id: room.id,
        topic: room.topic,
        votes,
        subHeard: room.subHeard,
      }));

    return {
      id: user.id,
      idPrefix: user.id.slice(0, ID_PREFIX_LENGTH),
      nickname: user.nickname || "(no nickname)",
      obfuscatedEmail: user.email ? obfuscateEmail(user.email) : "—",
      obfuscatedPhone: user.phoneNumber ? obfuscatePhone(user.phoneNumber) : "—",
      createdAt: user.createdAt,
      activeDays: activeDays.size,
      activeWeeks: activeWeeks.size,
      topPosts,
    };
  });
}
