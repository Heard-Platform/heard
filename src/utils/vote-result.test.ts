import { describe, expect, it } from "vitest";
import type { Statement } from "../types";
import {
  calcVoteResult,
  getDecisiveVoteSide,
  getEmphasizedSide,
  getVoteResultDetail,
  getVoteResultHeadline,
  type VoteResult,
} from "./vote-result";

const buildStatement = (overrides: Partial<Statement>): Statement => ({
  id: "statement-1",
  text: "Metro should run later on weekends",
  author: "other-user",
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId: "room-1",
  timestamp: 0,
  round: 1,
  voters: {},
  ...overrides,
});

const calcRequiredVoteResult = (...args: Parameters<typeof calcVoteResult>): VoteResult => {
  const result = calcVoteResult(...args);
  if (!result) throw new Error("Expected a vote result");
  return result;
};

describe("getDecisiveVoteSide", () => {
  it("counts super agree as agree", () => {
    expect(getDecisiveVoteSide("super_agree")).toBe("agree");
  });

  it("has no side for a pass", () => {
    expect(getDecisiveVoteSide("pass")).toBeNull();
  });
});

describe("calcVoteResult", () => {
  it("returns no result for a pass", () => {
    expect(calcVoteResult(buildStatement({ agrees: 10 }), "pass")).toBeNull();
  });

  it("is a first vote when nobody has agreed or disagreed yet", () => {
    const result = calcRequiredVoteResult(buildStatement({ passes: 3 }), "agree");
    expect(result.kind).toBe("first_vote");
    expect(result.agreePercent).toBe(100);
    expect(result.decisiveVoteCount).toBe(1);
  });

  it("is with the majority when the voter joins the larger side", () => {
    const result = calcRequiredVoteResult(
      buildStatement({ agrees: 27, disagrees: 11 }),
      "agree",
    );
    expect(result.kind).toBe("with_majority");
    expect(result.agreePercent).toBe(72);
    expect(result.disagreePercent).toBe(28);
    expect(result.decisiveVoteCount).toBe(39);
  });

  it("is in the minority when the voter joins the smaller side", () => {
    const result = calcRequiredVoteResult(
      buildStatement({ agrees: 9, disagrees: 30 }),
      "agree",
    );
    expect(result.kind).toBe("in_minority");
    expect(result.majoritySide).toBe("disagree");
    expect(result.agreePercent).toBe(25);
  });

  it("is nearly split when the sides are within ten points", () => {
    const result = calcRequiredVoteResult(
      buildStatement({ agrees: 20, disagrees: 19 }),
      "agree",
    );
    expect(result.kind).toBe("nearly_split");
    expect(result.agreePercent).toBe(53);
  });

  it("is a swung vote when the vote breaks an exact tie", () => {
    const result = calcRequiredVoteResult(
      buildStatement({ agrees: 3, disagrees: 3 }),
      "disagree",
    );
    expect(result.kind).toBe("swung_vote");
    expect(result.majoritySide).toBe("disagree");
    expect(result.agreePercentBeforeVote).toBe(50);
  });

  it("counts super agrees toward the agree side", () => {
    const result = calcRequiredVoteResult(
      buildStatement({ agrees: 2, superAgrees: 1, disagrees: 3 }),
      "super_agree",
    );
    expect(result.kind).toBe("swung_vote");
    expect(result.agreeCount).toBe(4);
  });

  it("leaves passes out of the percentages", () => {
    const result = calcRequiredVoteResult(
      buildStatement({ agrees: 3, disagrees: 1, passes: 20 }),
      "agree",
    );
    expect(result.agreePercent).toBe(80);
    expect(result.decisiveVoteCount).toBe(5);
  });

  it("starts the bar from the split before the vote", () => {
    const result = calcRequiredVoteResult(
      buildStatement({ agrees: 1, disagrees: 3 }),
      "agree",
    );
    expect(result.agreePercentBeforeVote).toBe(25);
    expect(result.agreePercent).toBe(40);
  });
});

describe("getEmphasizedSide", () => {
  it("emphasizes the voter's side when nearly split", () => {
    const result = calcRequiredVoteResult(
      buildStatement({ agrees: 20, disagrees: 19 }),
      "disagree",
    );
    expect(result.kind).toBe("nearly_split");
    expect(getEmphasizedSide(result)).toBe("disagree");
  });

  it("emphasizes the majority otherwise", () => {
    const result = calcRequiredVoteResult(
      buildStatement({ agrees: 9, disagrees: 30 }),
      "agree",
    );
    expect(getEmphasizedSide(result)).toBe("disagree");
  });
});

describe("getVoteResultHeadline", () => {
  it.each([
    [{ agrees: 0, disagrees: 0 }, "agree", "First vote!"],
    [{ agrees: 3, disagrees: 3 }, "agree", "You swung the vote!"],
    [{ agrees: 20, disagrees: 19 }, "agree", "Nearly split, 53 to 47"],
    [{ agrees: 27, disagrees: 11 }, "agree", "72% agree with you"],
    [{ agrees: 9, disagrees: 30 }, "agree", "You're in the 25% who agree"],
    [{ agrees: 30, disagrees: 9 }, "disagree", "You're in the 25% who disagree"],
  ] as const)("for %o voting %s says %s", (counts, voteType, headline) => {
    const result = calcRequiredVoteResult(buildStatement(counts), voteType);
    expect(getVoteResultHeadline(result)).toBe(headline);
  });
});

describe("getVoteResultDetail", () => {
  it("shows the new count after a swing", () => {
    const result = calcRequiredVoteResult(
      buildStatement({ agrees: 3, disagrees: 3 }),
      "agree",
    );
    expect(getVoteResultDetail(result)).toBe("now agree 4 to 3");
  });

  it("shows the vote count otherwise", () => {
    const result = calcRequiredVoteResult(
      buildStatement({ agrees: 27, disagrees: 11 }),
      "agree",
    );
    expect(getVoteResultDetail(result)).toBe("39 votes");
  });
});
