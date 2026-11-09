import { getEventById } from "./model-utils.ts";
import {
  getAllDebates,
  getCommunity,
  getDebate,
  getEventDisplayKey,
  getEventPresences,
  getLiveEventState,
  findStatementInAnyRoom,
  getStatementsForRoom,
  getStatementsForRoomIncludingHidden,
  getUser,
  getVotesForStatement,
  saveEventDisplayKey,
  saveStatement,
} from "./kv-utils.tsx";
import { markStatementHidden, markStatementVisible } from "./moderation-utils.ts";
import { buildSupportViewStats } from "./support-view-utils.ts";
import {
  buildEventReport,
  type EventReportVote,
} from "./event-report-utils.ts";
import { applyCampNames } from "./event-report-camp-utils.ts";
import {
  loadEventReportCampNames,
} from "./event-report-camp-naming.ts";
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
  EventReport,
  LiveEventState as EventState,
  LiveEventView,
  EventTotals,
  Statement,
  SupportViewStats,
  User,
} from "./types.tsx";

export const parseEventId = (eventIdStr: string | undefined): number => {
  const eventId = Number(eventIdStr);
  if (!eventIdStr || !Number.isInteger(eventId)) throw new RouteError("A valid event ID is required", 400);
  return eventId;
};

export const getEventOrThrow = async (eventId: number): Promise<Event> => {
  const event = await getEventById(eventId);
  if (!event) throw new RouteError("Event not found", 404);
  return event;
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

const loadVotesForStatements = async (statements: Statement[]): Promise<EventReportVote[]> =>
  (await Promise.all(
    statements.map(async (statement) =>
      (await getVotesForStatement(statement.id)).map((vote) => ({ ...vote, roomId: statement.roomId })),
    ),
  )).flat();

const loadVisibleEventStatements = async (
  roomOrder: string[],
): Promise<Statement[]> =>
  (await Promise.all(roomOrder.map(getStatementsForRoom))).flat();

const loadEventTotals = async (state: EventState): Promise<EventTotals> => {
  const statements = await loadVisibleEventStatements(state.roomOrder);
  return countEventTotals(state.roomOrder, statements, await loadVotesForStatements(statements), state.startedAt ?? 0);
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

const loadEventRoomsInOrder = async (
  roomOrder: string[],
): Promise<DebateRoom[]> =>
  (await Promise.all(roomOrder.map(getDebate))).filter(
    (room): room is DebateRoom => room !== null,
  );

export const loadSupportViewStats = async (
  event: Event,
  state: EventState,
  now: number,
): Promise<SupportViewStats> => {
  const [rooms, presences, statements] = await Promise.all([
    loadEventRoomsInOrder(state.roomOrder),
    getEventPresences(event.id),
    Promise.all(
      state.roomOrder.map(getStatementsForRoomIncludingHidden),
    ).then((roomStatements) => roomStatements.flat()),
  ]);
  return buildSupportViewStats({
    eventName: event.name,
    state,
    rooms,
    presences,
    statements,
    votes: await loadVotesForStatements(statements),
    now,
  });
};

export const loadEventReport = async (
  eventId: number,
  now: number,
): Promise<EventReport> => {
  const event = await getEventOrThrow(eventId);
  const state = eventStateOrDefault(
    await getLiveEventState(eventId),
    now,
  );
  const [community, rooms, statements] = await Promise.all([
    getCommunity(event.communityName),
    loadEventRoomsInOrder(state.roomOrder),
    loadVisibleEventStatements(state.roomOrder),
  ]);
  const { report, campNamingRequest } = buildEventReport({
    event,
    community,
    state,
    rooms,
    statements,
    votes: await loadVotesForStatements(statements),
    now,
  });
  const campNames = await loadEventReportCampNames(
    event.id,
    event.name,
    campNamingRequest,
    now,
  );
  return {
    ...report,
    campAnalysis: applyCampNames(report.campAnalysis, campNames),
  };
};

export const setEventStatementHidden = async (
  state: EventState,
  statementId: string,
  isHidden: boolean,
  userId: string | undefined,
): Promise<Statement> => {
  const statement = await findStatementInAnyRoom(statementId);
  if (!statement || !state.roomOrder.includes(statement.roomId)) {
    throw new RouteError("That statement isn't part of this event", 404);
  }
  const updated = isHidden
    ? markStatementHidden(statement, userId ?? "display-link")
    : markStatementVisible(statement);
  await saveStatement(updated);
  return updated;
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
