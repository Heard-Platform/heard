import { describe, expect, it } from "vitest";
import type { DemographicQuestion, EventOnboardingQuestionDraft } from "../types";
import {
  canSaveEventOnboardingQuestions,
  haveEventOnboardingQuestionsChanged,
  isDuplicateQuestionText,
  isEventOnboardingQuestionDraftComplete,
  moveEventOnboardingQuestionDraft,
  toEventOnboardingQuestionDrafts,
  toEventOnboardingQuestionInputs,
} from "./event-onboarding-questions";

const draft = (draftId: string, text: string, options: string[], multiSelect = false): EventOnboardingQuestionDraft => ({
  draftId,
  text,
  options,
  multiSelect,
});

const savedQuestion = (id: string, text: string, options: string[], multiSelect = false): DemographicQuestion => ({
  id,
  roomId: null,
  eventId: 7,
  type: "custom",
  text,
  options,
  multiSelect,
  position: 0,
});

describe("toEventOnboardingQuestionDrafts", () => {
  it("keeps each saved question's id as its draft id", () => {
    expect(toEventOnboardingQuestionDrafts([savedQuestion("12", "Are you a...", ["Student"], true)])).toEqual([
      draft("12", "Are you a...", ["Student"], true),
    ]);
  });
});

describe("toEventOnboardingQuestionInputs", () => {
  it("drops the draft ids", () => {
    expect(toEventOnboardingQuestionInputs([draft("a", "Are you a...", ["Student"])])).toEqual([
      { text: "Are you a...", options: ["Student"], multiSelect: false },
    ]);
  });
});

describe("isEventOnboardingQuestionDraftComplete", () => {
  it("accepts text with a single option, since Prefer not to say is added on top", () => {
    expect(isEventOnboardingQuestionDraftComplete(draft("a", "Are you a...", ["Student", " "]))).toBe(true);
  });

  it("rejects blank text", () => {
    expect(isEventOnboardingQuestionDraftComplete(draft("a", " ", ["Student"]))).toBe(false);
  });

  it("rejects a question whose options are all blank", () => {
    expect(isEventOnboardingQuestionDraftComplete(draft("a", "Are you a...", ["", " "]))).toBe(false);
  });
});

describe("isDuplicateQuestionText", () => {
  it("flags the same text ignoring case and spaces", () => {
    const drafts = [draft("a", "Are you a...", ["Student"]), draft("b", " are you a... ", ["Faculty"])];
    expect(isDuplicateQuestionText(drafts[0], drafts)).toBe(true);
  });
});

describe("canSaveEventOnboardingQuestions", () => {
  it("allows saving no questions at all", () => {
    expect(canSaveEventOnboardingQuestions([])).toBe(true);
  });

  it("allows complete, distinct questions", () => {
    expect(
      canSaveEventOnboardingQuestions([draft("a", "Are you a...", ["Student"]), draft("b", "Gender?", ["Female"])]),
    ).toBe(true);
  });

  it("blocks an incomplete question", () => {
    expect(canSaveEventOnboardingQuestions([draft("a", "", ["Student"])])).toBe(false);
  });

  it("blocks duplicate options within a question", () => {
    expect(canSaveEventOnboardingQuestions([draft("a", "Are you a...", ["Student", "student"])])).toBe(false);
  });

  it("blocks two questions with the same text", () => {
    expect(
      canSaveEventOnboardingQuestions([draft("a", "Are you a...", ["Student"]), draft("b", "Are you a...", ["Faculty"])]),
    ).toBe(false);
  });
});

describe("haveEventOnboardingQuestionsChanged", () => {
  const savedDrafts = [draft("1", "Are you a...", ["Student"])];

  it("is false when the drafts match what's saved", () => {
    expect(haveEventOnboardingQuestionsChanged([draft("1", "Are you a...", ["Student"])], savedDrafts)).toBe(false);
  });

  it("is true when the pick-any setting changes", () => {
    expect(haveEventOnboardingQuestionsChanged([draft("1", "Are you a...", ["Student"], true)], savedDrafts)).toBe(true);
  });

  it("is true when a question is added", () => {
    const drafts = [...savedDrafts, draft("new", "", ["", ""])];
    expect(haveEventOnboardingQuestionsChanged(drafts, savedDrafts)).toBe(true);
  });
});

describe("moveEventOnboardingQuestionDraft", () => {
  const drafts = [draft("a", "A", ["1"]), draft("b", "B", ["1"]), draft("c", "C", ["1"])];

  it("moves a question down one place", () => {
    expect(moveEventOnboardingQuestionDraft(drafts, 0, 1).map((moved) => moved.draftId)).toEqual(["b", "a", "c"]);
  });

  it("leaves the order alone when moving past the end", () => {
    expect(moveEventOnboardingQuestionDraft(drafts, 2, 1).map((moved) => moved.draftId)).toEqual(["a", "b", "c"]);
  });
});
