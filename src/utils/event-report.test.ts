import { describe, expect, it } from "vitest";
import {
  formatCount,
  formatSessionStart,
  getSessionMinutes,
} from "./event-report";
import { ONE_MINUTE_MS } from "./time";

const FRIDAY_9_10_AM_EASTERN = Date.UTC(2026, 9, 23, 13, 10);

describe("getSessionMinutes", () => {
  it("counts whole minutes from start to end", () => {
    const sessionMinutes = getSessionMinutes({
      sessionStartedAt: FRIDAY_9_10_AM_EASTERN,
      sessionEndedAt: FRIDAY_9_10_AM_EASTERN + 34 * ONE_MINUTE_MS,
    });
    expect(sessionMinutes).toBe(34);
  });

  it("rounds to the nearest minute", () => {
    const sessionMinutes = getSessionMinutes({
      sessionStartedAt: FRIDAY_9_10_AM_EASTERN,
      sessionEndedAt: FRIDAY_9_10_AM_EASTERN + 33.6 * ONE_MINUTE_MS,
    });
    expect(sessionMinutes).toBe(34);
  });
});

describe("formatSessionStart", () => {
  it("shows the weekday, date, time and time zone", () => {
    const sessionStart = formatSessionStart(
      FRIDAY_9_10_AM_EASTERN,
      "America/New_York",
    );
    expect(sessionStart).toBe("Friday 10/23 · 9:10 AM EDT");
  });

  it("shows the start in the given time zone", () => {
    const sessionStart = formatSessionStart(
      FRIDAY_9_10_AM_EASTERN,
      "America/Los_Angeles",
    );
    expect(sessionStart).toBe("Friday 10/23 · 6:10 AM PDT");
  });
});

describe("formatCount", () => {
  it("adds thousands separators", () => {
    expect(formatCount(1540)).toBe("1,540");
  });

  it("leaves small numbers as they are", () => {
    expect(formatCount(64)).toBe("64");
  });
});