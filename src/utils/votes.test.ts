import { describe, expect, it } from "vitest";
import { toSimpleVote } from "./votes";

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
