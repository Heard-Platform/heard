import { describe, expect, it } from "vitest";
import {
  describeSessionStatus,
  formatElapsed,
  getFinishedPercent,
  getTotalVotes,
  getVoteMixPercents,
  getVotesPerPerson,
  listPhoneStates,
  orderNewestFirst,
} from "./event-support";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;

describe("formatElapsed", () => {
  it("shows seconds under a minute", () => {
    expect(formatElapsed(45 * SECOND_MS)).toBe("45s");
  });

  it("shows minutes and padded seconds under an hour", () => {
    expect(formatElapsed(MINUTE_MS + 5 * SECOND_MS)).toBe("1m 05s");
  });

  it("shows hours and padded minutes past an hour", () => {
    expect(formatElapsed(64 * MINUTE_MS)).toBe("1h 04m");
  });

  it("never goes below zero", () => {
    expect(formatElapsed(-SECOND_MS)).toBe("0s");
  });
});

describe("getVotesPerPerson", () => {
  it("rounds to one decimal", () => {
    expect(getVotesPerPerson(842, 57)).toBe(14.8);
  });

  it("is zero with nobody here", () => {
    expect(getVotesPerPerson(12, 0)).toBe(0);
  });
});

describe("listPhoneStates", () => {
  it("lists one entry per phone, grouped in a fixed order", () => {
    expect(listPhoneStates({ idle: 1, waiting: 2, swiping: 1, lobby: 0, end: 0 })).toEqual([
      "swiping",
      "waiting",
      "waiting",
      "idle",
    ]);
  });
});

describe("getVoteMixPercents", () => {
  it("splits the post's votes into whole percents", () => {
    expect(getVoteMixPercents({ agreeVotes: 52, disagreeVotes: 34, passVotes: 14 })).toEqual({
      agree: 52,
      disagree: 34,
      pass: 14,
    });
  });

  it("is all zero before any votes", () => {
    expect(getVoteMixPercents({ agreeVotes: 0, disagreeVotes: 0, passVotes: 0 })).toEqual({
      agree: 0,
      disagree: 0,
      pass: 0,
    });
  });
});

describe("getFinishedPercent", () => {
  it("is the share of phones on the post that finished it", () => {
    expect(getFinishedPercent({ finishedCount: 19, swipingCount: 34 })).toBe(36);
  });

  it("is zero with no phones on the post", () => {
    expect(getFinishedPercent({ finishedCount: 0, swipingCount: 0 })).toBe(0);
  });
});

describe("describeSessionStatus", () => {
  const currentPost = {
    postNumber: 4,
    topic: "AI and price",
    finishedCount: 0,
    swipingCount: 0,
    agreeVotes: 0,
    disagreeVotes: 0,
    passVotes: 0,
    medianSecondsToFinish: null,
    startedAt: 0,
  };

  it("names the post while live", () => {
    expect(describeSessionStatus({ status: "live", votingPaused: false, postCount: 10, currentPost })).toBe(
      "Live · Post 4 of 10",
    );
  });

  it("says paused while voting is paused", () => {
    expect(describeSessionStatus({ status: "live", votingPaused: true, postCount: 10, currentPost })).toBe(
      "Paused · Post 4 of 10",
    );
  });

  it("covers before Start and after End", () => {
    expect(describeSessionStatus({ status: "setup", votingPaused: false, postCount: 10, currentPost: null })).toBe(
      "Not started",
    );
    expect(describeSessionStatus({ status: "ended", votingPaused: false, postCount: 10, currentPost: null })).toBe(
      "Ended",
    );
  });
});

describe("getTotalVotes", () => {
  it("adds agrees, disagrees and passes", () => {
    expect(getTotalVotes({ agreeVotes: 12, disagreeVotes: 5, passVotes: 3 })).toBe(20);
  });
});

describe("orderNewestFirst", () => {
  const attendeeStatement = (id: string, createdAt: number) => ({
    id,
    roomId: "post",
    postNumber: 1,
    text: id,
    agreeVotes: 0,
    disagreeVotes: 0,
    passVotes: 0,
    isHidden: false,
    createdAt,
  });

  it("puts the most recently written statement first without changing the input", () => {
    const attendeeStatements = [attendeeStatement("old", 1), attendeeStatement("new", 3), attendeeStatement("middle", 2)];
    expect(orderNewestFirst(attendeeStatements).map((statement) => statement.id)).toEqual(["new", "middle", "old"]);
    expect(attendeeStatements.map((statement) => statement.id)).toEqual(["old", "new", "middle"]);
  });
});
