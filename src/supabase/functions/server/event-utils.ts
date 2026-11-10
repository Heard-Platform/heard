import { getEventById } from "./model-utils.ts";
import {
  getAllDebates,
  getCommunity,
  getDebate,
  getEventDisplayKey,
  getEventPresences,
  getLiveEventState,
  getUser,
  saveEventDisplayKey,
} from "./kv-utils.tsx";
import {
  loadEventStatementsAndVotes,
} from "./event-content-utils.ts";
import { RouteError } from "./route-error.ts";
import {
  canDriveEvent,
  canModerateEvent,
  createDisplayKey,
  endEvent,
  EVENT_POST_CLOSED_ERRORS,
  eventPostClosedReason,
  eventStateOrDefault,
  type EventActionName as EventActionName,
  changeActivePost,
  reloadEvent,
  reorderLiveEvent,
  requireEventIsLive,
  setVotingPaused,
  openEvent,
  startEvent,
  startVoting,
  countEventTotals,
  countEventHeadcount,
  toLiveEventView,
} from "./live-event-utils.ts";
import type {
  DebateRoom,
  Event,
  LiveEventState as EventState,
  LiveEventView,
  EventTotals,
  Statement,
  User,
} from "./types.tsx";

export const parseEventId = (eventIdStr: string | undefined): number => {
  const eventId = Number(eventIdStr);
  if (!eventIdStr || !Number.isInteger(eventId)) throw new RouteError("A valid event ID is required", 400);
  return eventId;
};

const getDebateOrThrow = async (
  roomId: string,
): Promise<DebateRoom> => {
  const room = await getDebate(roomId);
  if (!room) throw new RouteError("Post not found", 404);
  return room;
};

export const getOrCreateEventDisplayKey = async (eventId: number): Promise<string> => {
  const storedDisplayKey = await getEventDisplayKey(eventId);
  if (storedDisplayKey) return storedDisplayKey;
  const displayKey = createDisplayKey();
  await saveEventDisplayKey(eventId, displayKey);
  return displayKey;
};

export const getEventRooms = async (eventId: number): Promise<DebateRoom[]> =>
  (await getAllDebates()).filter((room) => room.eventId === eventId);

export const loadEventView = async (eventId: number, state: EventState, now: number): Promise<LiveEventView> =>
  toLiveEventView(state, countEventHeadcount(await getEventPresences(eventId), state, now));

export type EventPostCheck = { allowed: true } | { allowed: false; error: string };

const ALLOWED: EventPostCheck = { allowed: true };

const checkEventPostOpen = async (room: Pick<DebateRoom, "id" | "eventId">, eventId: number): Promise<EventPostCheck> => {
  const state = eventStateOrDefault(await getLiveEventState(eventId), Date.now());
  const closedReason = eventPostClosedReason(state, room.id);
  return closedReason ? { allowed: false, error: EVENT_POST_CLOSED_ERRORS[closedReason] } : ALLOWED;
};

const canModerateEventId = async (userId: string, eventId: number): Promise<boolean> => {
  const event = await getEventById(eventId);
  if (!event) return false;
  return canModerateEvent(userId, event, await getCommunity(event.communityName));
};

export const checkEventVoting = async (room: Pick<DebateRoom, "id" | "eventId">): Promise<EventPostCheck> =>
  room.eventId == null ? ALLOWED : checkEventPostOpen(room, room.eventId);

export const checkEventPosting = async (
  room: Pick<DebateRoom, "id" | "eventId">,
  user: Pick<User, "id">,
): Promise<EventPostCheck> => {
  if (room.eventId == null) return ALLOWED;
  const check = await checkEventPostOpen(room, room.eventId);
  if (check.allowed || (await canModerateEventId(user.id, room.eventId))) return ALLOWED;
  return check;
};

const loadEventTotals = async (state: EventState): Promise<EventTotals> => {
  const { statements, votes } = await loadEventStatementsAndVotes(
    state.roomOrder,
  );
  return countEventTotals(
    state.roomOrder,
    statements,
    votes,
    state.startedAt ?? 0,
  );
};

export const requireCanDriveEvent = async (
  event: Event,
  userId: string | undefined,
  providedDisplayKey: string | undefined,
): Promise<void> => {
  const [community, user, storedDisplayKey] = await Promise.all([
    getCommunity(event.communityName),
    userId ? getUser(userId) : null,
    getEventDisplayKey(event.id),
  ]);
  const isModeratorOrDeveloper =
    !!userId &&
    (canModerateEvent(userId, event, community) ||
      !!user?.isDeveloper);
  if (
    !canDriveEvent(
      isModeratorOrDeveloper,
      providedDisplayKey,
      storedDisplayKey,
    )
  ) {
    throw new RouteError(
      "This link can't open the support view. Open it from the event page.",
      403,
    );
  }
};

export const loadEventRoomsInOrder = async (
  roomOrder: string[],
): Promise<DebateRoom[]> =>
  (await Promise.all(roomOrder.map(getDebate))).filter(
    (room): room is DebateRoom => room !== null,
  );

export interface EventPost {
  room: DebateRoom;
  statements: Statement[];
}

export const loadEventPost = async (
  roomId: string,
): Promise<EventPost> => {
  const [room, { statements }] = await Promise.all([
    getDebateOrThrow(roomId),
    loadEventStatementsAndVotes([roomId]),
  ]);
  return { room, statements };
};

export interface EventActionParams {
  roomOrder?: string[];
  fromIndex?: number;
}

export const applyEventAction = async (
  eventId: number,
  state: EventState,
  action: EventActionName,
  { roomOrder, fromIndex }: EventActionParams,
  now: number,
): Promise<EventState> => {
  switch (action) {
    case "reorder": {
      if (!roomOrder) throw new RouteError("roomOrder is required", 400);
      const rooms = await getEventRooms(eventId);
      return reorderLiveEvent(state, roomOrder, rooms.map((room) => room.id), now);
    }
    case "open":
      return openEvent(state, now);
    case "start":
      return startEvent(state, await getEventRooms(eventId), now);
    case "start-voting":
      return startVoting(state, now);
    case "next":
      return changeActivePost(state, 1, fromIndex, now);
    case "back":
      return changeActivePost(state, -1, fromIndex, now);
    case "pause":
      return setVotingPaused(state, true, now);
    case "resume":
      return setVotingPaused(state, false, now);
    case "end":
      requireEventIsLive(state);
      return endEvent(state, await loadEventTotals(state), now);
    case "reload":
      return reloadEvent(state, now);
  }
};
