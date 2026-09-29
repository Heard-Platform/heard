import { describe, expect, it } from "vitest";
import { buildJoinTimeline, pickGranularity } from "./join-timeline";

const at = (day: number, hour = 0, minute = 0) =>
  new Date(2026, 0, day, hour, minute).getTime();

describe("pickGranularity", () => {
  it("uses hours for spans up to two days", () => {
    expect(pickGranularity(at(3) - at(1))).toBe("hour");
  });

  it("uses days for spans up to ninety days", () => {
    expect(pickGranularity(at(4) - at(1))).toBe("day");
  });

  it("uses weeks for longer spans", () => {
    expect(pickGranularity(at(100) - at(1))).toBe("week");
  });
});

describe("buildJoinTimeline", () => {
  it("returns no buckets when nobody has joined", () => {
    expect(buildJoinTimeline([])).toEqual([]);
  });

  it("splits joins into anonymous and named per bucket", () => {
    const buckets = buildJoinTimeline([
      { isAnonymous: true, joinedAt: at(1, 10, 5) },
      { isAnonymous: false, joinedAt: at(1, 10, 40) },
      { isAnonymous: false, joinedAt: at(1, 12, 0) },
    ]);

    expect(buckets.map(({ named, anonymous }) => ({ named, anonymous }))).toEqual([
      { named: 1, anonymous: 1 },
      { named: 0, anonymous: 0 },
      { named: 1, anonymous: 0 },
    ]);
  });

  it("fills empty buckets so the timeline is continuous", () => {
    const buckets = buildJoinTimeline([
      { isAnonymous: false, joinedAt: at(1, 9) },
      { isAnonymous: false, joinedAt: at(5, 9) },
    ]);

    expect(buckets.map((bucket) => bucket.startsAt)).toEqual([
      at(1),
      at(2),
      at(3),
      at(4),
      at(5),
    ]);
  });

  it("tracks the cumulative anonymous share", () => {
    const buckets = buildJoinTimeline([
      { isAnonymous: true, joinedAt: at(1, 9) },
      { isAnonymous: false, joinedAt: at(1, 10) },
      { isAnonymous: false, joinedAt: at(1, 11) },
      { isAnonymous: false, joinedAt: at(1, 11, 30) },
    ]);

    expect(
      buckets.map(({ totalSoFar, anonymousPctSoFar }) => ({ totalSoFar, anonymousPctSoFar })),
    ).toEqual([
      { totalSoFar: 1, anonymousPctSoFar: 100 },
      { totalSoFar: 2, anonymousPctSoFar: 50 },
      { totalSoFar: 4, anonymousPctSoFar: 25 },
    ]);
  });

  it("sorts unsorted input before bucketing", () => {
    const buckets = buildJoinTimeline([
      { isAnonymous: false, joinedAt: at(2, 9) },
      { isAnonymous: true, joinedAt: at(1, 9) },
    ]);

    expect(buckets[0].anonymous).toBe(1);
    expect(buckets[buckets.length - 1].named).toBe(1);
  });
});
