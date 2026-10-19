import type { UserEvent } from "../../../types";
import { ONE_DAY_MS } from "../../../utils/time";

export const TIMELINE_DAYS = 7;

export interface EventTypeDayCounts {
  type: string;
  countsByDay: number[];
  total: number;
}

export interface EventDayCountsGrid {
  dayStarts: number[];
  rows: EventTypeDayCounts[];
  maxCount: number;
}

export function startOfLocalDay(ts: number): number {
  const date = new Date(ts);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function getTimelineDayStarts(now: number): number[] {
  const todayStart = startOfLocalDay(now);
  return Array.from(
    { length: TIMELINE_DAYS },
    (_, i) => todayStart - (TIMELINE_DAYS - 1 - i) * ONE_DAY_MS,
  );
}

export function filterToTimelineWindow(events: UserEvent[], now: number): UserEvent[] {
  const windowStart = getTimelineDayStarts(now)[0];
  return events.filter((event) => event.createdAt >= windowStart);
}

export function buildEventDayCounts(events: UserEvent[], now: number): EventDayCountsGrid {
  const dayStarts = getTimelineDayStarts(now);
  const dayIndexByStart = new Map(dayStarts.map((day, i) => [day, i]));
  const countsByType = new Map<string, number[]>();

  for (const event of events) {
    const dayIndex = dayIndexByStart.get(startOfLocalDay(event.createdAt));
    if (dayIndex === undefined) continue;
    const counts = countsByType.get(event.type) ?? new Array(TIMELINE_DAYS).fill(0);
    counts[dayIndex] += 1;
    countsByType.set(event.type, counts);
  }

  const rows = Array.from(countsByType, ([type, countsByDay]) => ({
    type,
    countsByDay,
    total: countsByDay.reduce((sum, count) => sum + count, 0),
  })).sort((a, b) => b.total - a.total || a.type.localeCompare(b.type));

  const maxCount = Math.max(0, ...rows.flatMap((row) => row.countsByDay));
  return { dayStarts, rows, maxCount };
}

export function formatDayLabel(dayStart: number): string {
  return new Date(dayStart).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatEventTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toUrlPath(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}
