import _ from "lodash";
import type { LiveEventStatus, LiveEventView, LiveHeartbeat, LiveScreen, Statement } from "../types";

export function orderByRoomOrder<T extends { id: string }>(
  rooms: T[],
  roomOrder: string[],
): T[] {
  const byId = _.keyBy(rooms, "id");
  const ordered = _.compact(roomOrder.map((id) => byId[id]));
  return [...ordered, ..._.differenceBy(rooms, ordered, "id")];
}

export function moveInOrder(
  order: string[],
  index: number,
  offset: -1 | 1,
): string[] {
  const target = index + offset;
  if (!_.inRange(index, order.length) || !_.inRange(target, order.length)) {
    return order;
  }
  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export type ControlsPhase = "not-started" | "live" | "last-post" | "ended";

export function getControlsPhase(
  status: LiveEventStatus,
  currentIndex: number | null,
  postCount: number,
): ControlsPhase {
  if (status === "setup" || currentIndex === null) return "not-started";
  if (status === "ended") return "ended";
  return currentIndex >= postCount - 1 ? "last-post" : "live";
}

export const EVENT_POLL_MAX_INTERVAL_MS = 30_000;

export function getIntervalWithBackoff(baseMs: number, consecutiveFailures: number): number {
  if (consecutiveFailures <= 0) return baseMs;
  return Math.min(baseMs * 2 ** consecutiveFailures, EVENT_POLL_MAX_INTERVAL_MS);
}

export function pickNewestState<T extends { updatedAt: number }>(current: T | null, incoming: T): T {
  return current && current.updatedAt > incoming.updatedAt ? current : incoming;
}

export type AttendeeScreen = "starting" | "paused" | "swiping" | "waiting" | "end";

export function getAttendeeScreen(
  eventState: Pick<LiveEventView, "status" | "votingPaused">,
  hasCardsLeft: boolean,
): AttendeeScreen {
  if (eventState.status === "setup") return "starting";
  if (eventState.status === "ended") return "end";
  if (eventState.votingPaused) return "paused";
  return hasCardsLeft ? "swiping" : "waiting";
}

const HEARTBEAT_SCREENS: Record<AttendeeScreen, LiveScreen> = {
  starting: "lobby",
  paused: "lobby",
  swiping: "swiping",
  waiting: "waiting",
  end: "end",
};

export const toLiveScreen = (screen: AttendeeScreen): LiveScreen => HEARTBEAT_SCREENS[screen];

export const HEARTBEAT_INTERVAL_MS = 10_000;

export interface SentHeartbeat {
  heartbeat: LiveHeartbeat;
  sentAt: number;
}

export function shouldSendHeartbeat(last: SentHeartbeat | null, next: LiveHeartbeat, now: number): boolean {
  return !last || !_.isEqual(last.heartbeat, next) || now - last.sentAt >= HEARTBEAT_INTERVAL_MS;
}

export interface PostDeck {
  statements: Statement[];
  votedCount: number;
}

export function buildPostDeck(
  statements: Statement[],
  userId: string,
  localVotes: Record<string, unknown>,
): PostDeck {
  const [done, left] = _.partition(
    statements,
    (statement) => !!statement.voters?.[userId] || statement.id in localVotes,
  );
  return { statements: [...done, ...left], votedCount: done.length };
}
