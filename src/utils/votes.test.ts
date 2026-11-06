import { describe, expect, it } from "vitest";
import { isFlyerVote, toSimpleVote } from "./votes";

describe("toSimpleVote", () => {
  it("counts a super agree as an agree", () => {
    expect(toSimpleVote("super_agree")).toBe("agree");
  });

  it("leaves every other vote as it is", () => {
    expect(toSimpleVote("agree")).toBe("agree");
    expect(toSimpleVote("disagree")).toBe("disagree");
    expect(toSimpleVote("pass")).toBe("pass");
  });
});

describe("isFlyerVote", () => {
  it("accepts agree and disagree", () => {
    expect(isFlyerVote("agree")).toBe(true);
    expect(isFlyerVote("disagree")).toBe(true);
  });

  it("rejects pass and super agree", () => {
    expect(isFlyerVote("pass")).toBe(false);
    expect(isFlyerVote("super_agree")).toBe(false);
  });
});
