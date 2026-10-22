import _ from "lodash";
import type { LiveEventStatus } from "../types";

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
