import { describe, expect, it } from "vitest";
import { buildEventDayCounts, filterToTimelineWindow, startOfLocalDay } from "./event-timeline-utils";
import type { UserEvent } from "../../../types";
import { ONE_DAY_MS } from "../../../utils/time";

const now = new Date(2026, 9, 19, 15, 0, 0).getTime();
const today = startOfLocalDay(now);

const event = (type: string, createdAt: number): UserEvent => ({
  id: `${type}-${createdAt}`,
  type,
  userId: "u-1",
  createdAt,
});

describe("buildEventDayCounts", () => {
  it("counts each event type per local day, oldest day first", () => {
    const grid = buildEventDayCounts(
      [
        event("vote", today + 1000),
        event("vote", today + 2000),
        event("vote", today - ONE_DAY_MS + 1000),
        event("initial_load", today - 6 * ONE_DAY_MS),
      ],
      now,
    );

    expect(grid.dayStarts).toHaveLength(7);
    expect(grid.dayStarts[6]).toBe(today);
    expect(grid.rows.map((row) => row.type)).toEqual(["vote", "initial_load"]);
    expect(grid.rows[0].countsByDay).toEqual([0, 0, 0, 0, 0, 1, 2]);
    expect(grid.rows[1].countsByDay).toEqual([1, 0, 0, 0, 0, 0, 0]);
    expect(grid.maxCount).toBe(2);
  });

  it("ignores events older than the first timeline day", () => {
    const grid = buildEventDayCounts([event("vote", today - 7 * ONE_DAY_MS + 1000)], now);
    expect(grid.rows).toEqual([]);
    expect(grid.maxCount).toBe(0);
  });
});

describe("filterToTimelineWindow", () => {
  it("drops events from before the first timeline day", () => {
    const kept = event("vote", today - 6 * ONE_DAY_MS);
    const dropped = event("vote", today - 6 * ONE_DAY_MS - 1);
    expect(filterToTimelineWindow([kept, dropped], now)).toEqual([kept]);
  });
});
