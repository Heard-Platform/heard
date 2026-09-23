import { describe, it, expect } from "vitest";
import {
  EMPTY_RING_THICKNESS_PX,
  indexVotesByTapTime,
  maxVoteTotal,
  ringThicknessPx,
  voteShares,
} from "./flyer-votes";

describe("voteShares", () => {
  it("splits the ring by agree and disagree share", () => {
    expect(voteShares({ tappedAtMs: 1, agrees: 3, disagrees: 1 })).toEqual({
      total: 4,
      agreeFraction: 0.75,
      disagreeFraction: 0.25,
    });
  });

  it("returns empty shares when there are no votes", () => {
    expect(voteShares({ tappedAtMs: 1, agrees: 0, disagrees: 0 })).toEqual({
      total: 0,
      agreeFraction: 0,
      disagreeFraction: 0,
    });
  });
});

describe("ringThicknessPx", () => {
  it("uses the thin empty ring when a flyer has no votes", () => {
    expect(ringThicknessPx(0, 20)).toBe(EMPTY_RING_THICKNESS_PX);
  });

  it("grows with votes and tops out at the busiest flyer", () => {
    const quiet = ringThicknessPx(2, 20);
    const busy = ringThicknessPx(20, 20);
    expect(quiet).toBeGreaterThan(EMPTY_RING_THICKNESS_PX);
    expect(busy).toBeGreaterThan(quiet);
    expect(ringThicknessPx(40, 20)).toBe(busy);
  });
});

describe("indexVotesByTapTime and maxVoteTotal", () => {
  it("keys tallies by tap time and finds the busiest flyer", () => {
    const votes = indexVotesByTapTime([
      { tappedAtMs: 1_000, agrees: 4, disagrees: 1 },
      { tappedAtMs: 9_000, agrees: 10, disagrees: 6 },
    ]);

    expect(votes[9_000].agrees).toBe(10);
    expect(maxVoteTotal(votes)).toBe(16);
  });
});
