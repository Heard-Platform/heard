import { describe, it, expect } from "vitest";
import {
  describeVotes,
  EMPTY_RING_THICKNESS_PX,
  maxVoteTotal,
  ringThicknessPx,
  voteShares,
} from "./flyer-votes";

describe("voteShares", () => {
  it("splits the ring by agree and disagree share", () => {
    expect(voteShares({ agrees: 3, disagrees: 1 })).toEqual({
      total: 4,
      agreeFraction: 0.75,
      disagreeFraction: 0.25,
    });
  });

  it("returns empty shares when there are no votes", () => {
    expect(voteShares({ agrees: 0, disagrees: 0 })).toEqual({
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

describe("maxVoteTotal", () => {
  it("finds the busiest flyer", () => {
    expect(maxVoteTotal([{ agrees: 4, disagrees: 1 }, { agrees: 10, disagrees: 6 }])).toBe(16);
    expect(maxVoteTotal([])).toBe(0);
  });
});

describe("describeVotes", () => {
  it("summarizes a flyer's votes", () => {
    expect(describeVotes({ agrees: 10, disagrees: 4 })).toBe("14 flyer votes · 10 agree / 4 disagree");
    expect(describeVotes({ agrees: 0, disagrees: 0 })).toBe("No flyer votes yet");
  });
});
