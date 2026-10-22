import _ from "lodash";
import { RouteError } from "./route-error.ts";
import type {
  Community,
  DebateRoom,
  Event,
  EventPresence,
  LiveEventState,
  LiveScreen,
  LiveEventView,
  EventTotals,
  Statement,
  Vote,
} from "./types.tsx";

export const LIVE_SCREENS: readonly LiveScreen[] = ["lobby", "swiping", "waiting", "end"];

export const PRESENCE_WINDOW_MS = 5 * 60_000;

export interface EventHeadcount {
  peopleHere: number;
  finishedCurrentPost: number;
}

export const EVENT_ACTIONS = ["start", "next", "back", "pause", "resume", "end", "reorder", "reload"] as const;

export type EventActionName = typeof EVENT_ACTIONS[number];

export type EventPostClosedReason = "not-started" | "not-current" | "paused";

export const EVENT_POST_CLOSED_ERRORS: Record<EventPostClosedReason, string> = {
  "not-started": "This event hasn't started yet.",
  "not-current": "This post isn't open right now.",
  paused: "Voting is paused right now.",
};

export const defaultLiveEventState = (now: number): LiveEventState => ({
  roomOrder: [],
  currentIndex: null,
  status: "setup",
  votingPaused: false,
  reloadNonce: 0,
  totals: null,
  startedAt: null,
  updatedAt: now,
});

export const eventStateOrDefault = (stored: LiveEventState | null, now: number): LiveEventState =>
  stored ? { ...defaultLiveEventState(stored.updatedAt), ...stored } : defaultLiveEventState(now);

export const toLiveEventView = (state: LiveEventState, headcount: EventHeadcount): LiveEventView => ({
  ...state,
  currentRoomId: currentRoomId(state),
  ...headcount,
});

export const countEventHeadcount = (
  presences: EventPresence[],
  state: LiveEventState,
  now: number,
): EventHeadcount => {
  const roomId = currentRoomId(state);
  const here = presences.filter((presence) => now - presence.updatedAt <= PRESENCE_WINDOW_MS);
  return {
    peopleHere: here.length,
    finishedCurrentPost: here.filter(
      (presence) => roomId !== null && presence.screen === "waiting" && presence.shownRoomId === roomId,
    ).length,
  };
};

export const isLiveScreen = (value: string): value is LiveScreen =>
  (LIVE_SCREENS as readonly string[]).includes(value);

const currentRoomId = (state: LiveEventState): string | null =>
  state.currentIndex === null ? null : state.roomOrder[state.currentIndex] ?? null;

export const isCommunityModerator = (
  userId: string,
  community: Pick<Community, "adminId" | "modIds"> | null,
): boolean => community?.adminId === userId || !!community?.modIds?.includes(userId);

export const canModerateEvent = (
  userId: string,
  event: Pick<Event, "creatorId">,
  community: Pick<Community, "adminId" | "modIds"> | null,
): boolean => event.creatorId === userId || isCommunityModerator(userId, community);

export const eventPostClosedReason = (state: LiveEventState, roomId: string): EventPostClosedReason | null => {
  if (state.status === "ended") return null;
  if (state.status === "setup") return "not-started";
  if (currentRoomId(state) !== roomId) return "not-current";
  return state.votingPaused ? "paused" : null;
};

export const sessionRoomOrder = (
  storedOrder: string[],
  eventRooms: Pick<DebateRoom, "id" | "createdAt">[],
): string[] => {
  const eventRoomIds = new Set(eventRooms.map((room) => room.id));
  const kept = storedOrder.filter((id) => eventRoomIds.has(id));
  const added = _.sortBy(eventRooms, "createdAt")
    .map((room: Pick<DebateRoom, "id">) => room.id)
    .filter((id: string) => !kept.includes(id));
  return [...kept, ...added];
};

export const reorderLiveEvent = (
  state: LiveEventState,
  roomOrder: string[],
  eventRoomIds: string[],
  now: number,
): LiveEventState => {
  if (state.status !== "setup") {
    throw new RouteError("Posts can only be reordered before the session starts", 409);
  }
  if (_.uniq(roomOrder).length !== roomOrder.length) {
    throw new RouteError("Each post can appear only once in the order", 400);
  }
  if (!_.isEqual(_.sortBy(roomOrder), _.sortBy(eventRoomIds))) {
    throw new RouteError("The event's posts have changed. Refresh and try again", 409);
  }
  return { ...state, roomOrder, updatedAt: now };
};

export const requireEventIsLive = (state: LiveEventState): number => {
  if (state.status !== "live" || state.currentIndex === null) {
    throw new RouteError("The session isn't live", 409);
  }
  return state.currentIndex;
};

const requireFromIndex = (currentIndex: number, fromIndex: number | undefined) => {
  if (fromIndex === undefined) throw new RouteError("fromIndex is required", 400);
  if (fromIndex !== currentIndex) throw new RouteError("The session already moved on", 409);
};

export const startEvent = (
  state: LiveEventState,
  eventRooms: Pick<DebateRoom, "id" | "createdAt">[],
  now: number,
): LiveEventState => {
  if (state.status !== "setup") throw new RouteError("The session has already started", 409);
  const roomOrder = sessionRoomOrder(state.roomOrder, eventRooms);
  if (roomOrder.length === 0) throw new RouteError("Add a post to the event before starting", 409);
  return {
    ...state,
    roomOrder,
    currentIndex: 0,
    status: "live",
    votingPaused: false,
    startedAt: now,
    updatedAt: now,
  };
};

export const changeActivePost = (
  state: LiveEventState,
  offset: -1 | 1,
  fromIndex: number | undefined,
  now: number,
): LiveEventState => {
  const currentIndex = requireEventIsLive(state);
  requireFromIndex(currentIndex, fromIndex);
  const target = currentIndex + offset;
  if (target < 0) throw new RouteError("This is the first post", 409);
  if (target >= state.roomOrder.length) throw new RouteError("This is the last post", 409);
  return { ...state, currentIndex: target, votingPaused: false, updatedAt: now };
};

export const setVotingPaused = (state: LiveEventState, votingPaused: boolean, now: number): LiveEventState => {
  requireEventIsLive(state);
  return { ...state, votingPaused, updatedAt: now };
};

export const endEvent = (state: LiveEventState, totals: EventTotals, now: number): LiveEventState => {
  requireEventIsLive(state);
  return { ...state, status: "ended", votingPaused: false, totals, updatedAt: now };
};

export const reloadEvent = (state: LiveEventState, now: number): LiveEventState => ({
  ...state,
  reloadNonce: state.reloadNonce + 1,
  updatedAt: now,
});

export const countEventTotals = (
  roomOrder: string[],
  statements: Pick<Statement, "roomId" | "timestamp">[],
  votes: (Pick<Vote, "userId" | "timestamp"> & { roomId: string })[],
  startedAt: number,
): EventTotals => {
  const sessionVotes = votes.filter((vote) => vote.timestamp >= startedAt);
  const people = new Set(sessionVotes.map((vote) => vote.userId));
  const lastRoomId = _.last(roomOrder);
  const stayed = new Set(sessionVotes.filter((vote) => vote.roomId === lastRoomId).map((vote) => vote.userId));
  return {
    people: people.size,
    votes: sessionVotes.length,
    statementsFromRoom: statements.filter((statement) => statement.timestamp >= startedAt).length,
    stayedToEndPercent: people.size === 0 ? 0 : Math.round((stayed.size / people.size) * 100),
  };
};
