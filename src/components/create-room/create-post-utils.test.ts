import { describe, expect, it } from "vitest";
import type { NewDemographicQuestion } from "../../types";
import {
  addHotTake,
  canCreatePost,
  cleanHotTakes,
  dropBlankCustomQuestions,
  hasIncompleteCustomQuestion,
  formatDebateLengthShort,
  removeHotTake,
  updateHotTake,
} from "./create-post-utils";

describe("formatDebateLengthShort", () => {
  it("labels the presets", () => {
    expect(formatDebateLengthShort(10)).toBe("10m");
    expect(formatDebateLengthShort(60)).toBe("1h");
    expect(formatDebateLengthShort(720)).toBe("12h");
    expect(formatDebateLengthShort(1440)).toBe("1d");
    expect(formatDebateLengthShort(4320)).toBe("3d");
    expect(formatDebateLengthShort(10080)).toBe("7d");
  });

  it("rounds custom lengths", () => {
    expect(formatDebateLengthShort(95)).toBe("2h");
    expect(formatDebateLengthShort(14000)).toBe("10d");
    expect(formatDebateLengthShort(0.2)).toBe("1m");
  });
});

describe("hot take edits", () => {
  const takes = ["one", "two", "three"];

  it("adds a trimmed take and ignores blanks", () => {
    expect(addHotTake(takes, "  four ")).toEqual(["one", "two", "three", "four"]);
    expect(addHotTake(takes, "   ")).toBe(takes);
  });

  it("updates only the edited take", () => {
    expect(updateHotTake(takes, 1, "TWO")).toEqual(["one", "TWO", "three"]);
  });

  it("removes by index", () => {
    expect(removeHotTake(takes, 0)).toEqual(["two", "three"]);
  });

  it("cleans blanks and whitespace before posting", () => {
    expect(cleanHotTakes([" a ", "", "  ", "b"])).toEqual(["a", "b"]);
  });
});

describe("canCreatePost", () => {
  const base = {
    topic: "People with white shoes need to clean them",
    hotTakes: ["Dirty white sneakers look worse than any other dirty shoe."],
    subHeard: "test",
    needsCommunity: true,
  };

  it("allows a complete post", () => {
    expect(canCreatePost(base)).toBe(true);
  });

  it("needs a topic of at least 5 characters", () => {
    expect(canCreatePost({ ...base, topic: "  shoe  " })).toBe(false);
    expect(canCreatePost({ ...base, topic: "  shoes  " })).toBe(true);
  });

  it("needs at least one non-blank hot take", () => {
    expect(canCreatePost({ ...base, hotTakes: [] })).toBe(false);
    expect(canCreatePost({ ...base, hotTakes: ["   "] })).toBe(false);
  });

  it("needs a community unless it's an event post", () => {
    expect(canCreatePost({ ...base, subHeard: "" })).toBe(false);
    expect(canCreatePost({ ...base, subHeard: "", needsCommunity: false })).toBe(true);
  });
});

describe("custom demographic questions", () => {
  const standard: NewDemographicQuestion = { draftId: "s", type: "gender" };
  const complete: NewDemographicQuestion = { draftId: "c", type: "custom", text: "Ward?", options: ["1", "2"] };
  const oneOption: NewDemographicQuestion = { draftId: "o", type: "custom", text: "Ward?", options: ["1", " "] };
  const noText: NewDemographicQuestion = { draftId: "t", type: "custom", text: " ", options: ["1", "2"] };
  const blank: NewDemographicQuestion = { draftId: "b", type: "custom", text: "", options: ["", " "] };

  it("flags a custom question missing text or a second option", () => {
    expect(hasIncompleteCustomQuestion([standard, complete])).toBe(false);
    expect(hasIncompleteCustomQuestion([oneOption])).toBe(true);
    expect(hasIncompleteCustomQuestion([noText])).toBe(true);
    expect(hasIncompleteCustomQuestion([blank])).toBe(true);
  });

  it("drops only completely blank custom questions", () => {
    expect(dropBlankCustomQuestions([standard, complete, oneOption, blank])).toEqual([standard, complete, oneOption]);
  });
});
