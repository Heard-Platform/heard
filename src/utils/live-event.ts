import _ from "lodash";
import type {
  LiveEventStatus,
  LiveEventView,
  LiveHeartbeat,
  LiveScreen,
  Statement,
} from "../types";

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
  currentIndex: number,
  offset: -1 | 1,
): string[] {
  const target = currentIndex + offset;
  if (!_.inRange(currentIndex, order.length) || !_.inRange(target, order.length)) {
    return order;
  }
  const next = [...order];
  [next[currentIndex], next[target]] = [next[target], next[currentIndex]];
  return next;
}

export function isBeforeSessionStart(
  status: LiveEventStatus,
): boolean {
  return status === "setup" || status === "open";
}

export const EVENT_POLL_MS = 3000;
export const EVENT_POLL_MAX_INTERVAL_MS = 30_000;

export function getIntervalWithBackoff(baseMs: number, consecutiveFailures: number): number {
  if (consecutiveFailures <= 0) return baseMs;
  return Math.min(baseMs * 2 ** consecutiveFailures, EVENT_POLL_MAX_INTERVAL_MS);
}

export function pickNewestState<T extends { updatedAt: number }>(current: T | null, incoming: T): T {
  return current && current.updatedAt > incoming.updatedAt ? current : incoming;
}

export type AttendeeScreen =
  | "closed"
  | "onboarding"
  | "starting"
  | "paused"
  | "swiping"
  | "waiting"
  | "end";

export interface AttendeeProgress {
  isAnsweringQuestions: boolean;
  hasCardsLeft: boolean;
  isWritingStatement: boolean;
}

export function getAttendeeScreen(
  eventState: Pick<
    LiveEventView,
    "status" | "isIntroducingPost" | "votingPaused"
  >,
  progress: AttendeeProgress,
): AttendeeScreen {
  if (eventState.status === "setup") return "closed";
  if (eventState.status === "ended") return "end";
  if (progress.isAnsweringQuestions) return "onboarding";
  if (eventState.status === "open") return "starting";
  if (eventState.isIntroducingPost || eventState.votingPaused) {
    return "paused";
  }
  const isReadyToSwipe =
    progress.hasCardsLeft && !progress.isWritingStatement;
  return isReadyToSwipe ? "swiping" : "waiting";
}

const HEARTBEAT_SCREENS: Record<Exclude<AttendeeScreen, "closed">, LiveScreen> = {
  onboarding: "onboarding",
  starting: "lobby",
  paused: "lobby",
  swiping: "swiping",
  waiting: "waiting",
  end: "end",
};

export const toLiveScreen = (screen: AttendeeScreen): LiveScreen | null =>
  screen === "closed" ? null : HEARTBEAT_SCREENS[screen];

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
