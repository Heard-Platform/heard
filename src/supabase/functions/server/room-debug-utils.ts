import { selectAll } from "./db-utils.ts";
import { getStatementsForRoomIncludingHidden, getUser, getVotesForStatement } from "./kv-utils.tsx";
import { REFERRAL_EVENT_TYPES } from "./room-attribution-utils.ts";
import { getRoomParticipants } from "./room-utils.ts";
import { DebateRoom, RoomView, UserEvent, VoteType } from "./types.tsx";

export interface RoomDebugParticipant {
  id: string;
  nickname: string;
  isAnonymous: boolean;
  convertedFromAnonAt?: number;
  createdAt: number;
  isHost: boolean;
  isCohost: boolean;
  isTestUser: boolean;
  webdriver: boolean;
  fingerprint?: string;
  ipAddress?: string;
}

export interface RoomDebugStatement {
  id: string;
  author: string;
  anonymousUserId?: string;
  text: string;
  isHidden: boolean;
  timestamp: number;
}

export interface RoomDebugVote {
  statementId: string;
  userId: string;
  voteType: VoteType;
  anonymousUserId?: string;
  timestamp: number;
}

export interface RoomDebugEvent {
  type: string;
  userId: string | null;
  createdAt: number;
  url?: string;
  referralUserId?: string;
}

export interface RoomDebugView {
  userId: string;
  lastSeenAt: number;
}

export interface RoomDebugData {
  participants: RoomDebugParticipant[];
  getRoomParticipantsResult: string[];
  statements: RoomDebugStatement[];
  votes: RoomDebugVote[];
  events: RoomDebugEvent[];
  roomViews: RoomDebugView[];
}

export async function getRoomDebugData(room: DebateRoom): Promise<RoomDebugData> {
  const [statements, referredByEvents, initialLoadEvents, roomViews, getRoomParticipantsResult] = await Promise.all([
    getStatementsForRoomIncludingHidden(room.id),
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
    selectAll<RoomView>("room_views", { roomId: room.id }),
    getRoomParticipants(room.id),
  ]);

  const votesByStatement = await Promise.all(
    statements.map((statement) => getVotesForStatement(statement.id)),
  );

  const users = await Promise.all(
    room.participants.map((id) => getUser(id)),
  );
  const participants: RoomDebugParticipant[] = room.participants.map((id, i) => {
    const user = users[i];
    return {
      id,
      nickname: user?.nickname ?? "(user not found)",
      isAnonymous: !!user?.isAnonymous,
      convertedFromAnonAt: user?.convertedFromAnonAt,
      createdAt: user?.createdAt ?? 0,
      isHost: id === room.hostId,
      isCohost: !!room.cohostIds?.includes(id),
      isTestUser: !!user?.isTestUser,
      webdriver: !!user?.webdriver,
      fingerprint: user?.fingerprint,
      ipAddress: user?.ipAddress,
    };
  });

  return {
    participants,
    getRoomParticipantsResult,
    statements: statements.map((statement) => ({
      id: statement.id,
      author: statement.author,
      anonymousUserId: statement.anonymousUserId,
      text: statement.text,
      isHidden: !!statement.isHidden,
      timestamp: statement.timestamp,
    })),
    votes: votesByStatement.flat().map((vote) => ({
      statementId: vote.statementId,
      userId: vote.userId,
      voteType: vote.voteType,
      anonymousUserId: vote.anonymousUserId,
      timestamp: vote.timestamp,
    })),
    events: [...referredByEvents, ...initialLoadEvents].map((event) => ({
      type: event.type,
      userId: event.userId,
      createdAt: event.createdAt,
      url: event.url,
      referralUserId: event.referralUserId,
    })),
    roomViews: roomViews.map((view) => ({ userId: view.userId, lastSeenAt: view.lastSeenAt })),
  };
}
