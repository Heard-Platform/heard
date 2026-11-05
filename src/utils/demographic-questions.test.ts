import { describe, expect, it } from "vitest";
import type { DemographicQuestion } from "../types";
import {
  findFirstUnansweredQuestionIndex,
  getOptionsPlusOptOut,
  hasUnansweredQuestions,
  OPT_OUT_ANSWER,
  toggleMultiSelectAnswer,
} from "./demographic-questions";

const customQuestion = (id: string, options: string[]): DemographicQuestion => ({
  id,
  roomId: null,
  eventId: 1,
  type: "custom",
  text: `Question ${id}`,
  options,
  multiSelect: false,
  position: null,
});

describe("getOptionsPlusOptOut", () => {
  it("adds Prefer not to say as the last option", () => {
    expect(getOptionsPlusOptOut(customQuestion("1", ["Yes", "No"]))).toEqual([
      "Yes",
      "No",
      OPT_OUT_ANSWER,
    ]);
  });

  it("returns only Prefer not to say when the question has no options", () => {
    expect(
      getOptionsPlusOptOut({ id: "c", roomId: null, eventId: 1, type: "custom", text: "Ward?", multiSelect: false, position: null }),
    ).toEqual([OPT_OUT_ANSWER]);
  });

  it("never lists Prefer not to say twice", () => {
    expect(
      getOptionsPlusOptOut(customQuestion("1", [OPT_OUT_ANSWER, "Yes"])),
    ).toEqual(["Yes", OPT_OUT_ANSWER]);
  });
});

describe("toggleMultiSelectAnswer", () => {
  it("adds an option that was not picked", () => {
    expect(toggleMultiSelectAnswer(["Black"], "Jewish")).toEqual(["Black", "Jewish"]);
  });

  it("removes an option that was picked", () => {
    expect(toggleMultiSelectAnswer(["Black", "Jewish"], "Black")).toEqual(["Jewish"]);
  });

  it("clears every other pick when Prefer not to say is picked", () => {
    expect(toggleMultiSelectAnswer(["Black", "Jewish"], OPT_OUT_ANSWER)).toEqual([
      OPT_OUT_ANSWER,
    ]);
  });

  it("drops Prefer not to say when another option is picked", () => {
    expect(toggleMultiSelectAnswer([OPT_OUT_ANSWER], "Arab")).toEqual(["Arab"]);
  });

  it("unpicks Prefer not to say when tapped again", () => {
    expect(toggleMultiSelectAnswer([OPT_OUT_ANSWER], OPT_OUT_ANSWER)).toEqual([]);
  });
});

describe("findFirstUnansweredQuestionIndex", () => {
  const questions = [customQuestion("1", ["A"]), customQuestion("2", ["A"]), customQuestion("3", ["A"])];

  it("starts at the first question when nothing is answered", () => {
    expect(findFirstUnansweredQuestionIndex(questions, [])).toBe(0);
  });

  it("skips past answered questions", () => {
    expect(findFirstUnansweredQuestionIndex(questions, ["1", "2"])).toBe(2);
  });

  it("finds a gap left earlier in the list", () => {
    expect(findFirstUnansweredQuestionIndex(questions, ["1", "3"])).toBe(1);
  });

  it("returns the question count when everything is answered", () => {
    expect(findFirstUnansweredQuestionIndex(questions, ["1", "2", "3"])).toBe(3);
  });
});

describe("hasUnansweredQuestions", () => {
  const questions = [
    customQuestion("1", ["Student"]),
    customQuestion("2", ["Faculty"]),
  ];

  it("is true while any question is unanswered", () => {
    const onboarding = { questions, answeredQuestionIds: ["1"] };
    expect(hasUnansweredQuestions(onboarding)).toBe(true);
  });

  it("is false once every question is answered", () => {
    const onboarding = { questions, answeredQuestionIds: ["2", "1"] };
    expect(hasUnansweredQuestions(onboarding)).toBe(false);
  });

  it("is false for an event with no questions", () => {
    const onboarding = { questions: [], answeredQuestionIds: [] };
    expect(hasUnansweredQuestions(onboarding)).toBe(false);
  });
});
