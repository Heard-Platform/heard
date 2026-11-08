import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  collectAnsweredQuestionIds,
  findEventQuestionOrThrow,
  isValidAnswerList,
  isValidOnboardingQuestion,
  isValidOnboardingQuestionList,
  OPT_OUT_ANSWER,
  requireEventDoorsOpen,
  requireEventInSetup,
  toEventDemographicQuestionRows,
} from "./event-onboarding-utils.ts";
import { defaultLiveEventState } from "./live-event-utils.ts";
import { RouteError } from "./route-error.ts";
import type {
  DemographicAnswer,
  DemographicQuestion,
} from "./types.tsx";

const NOW = 1_762_000_000_000;

const validQuestion = { text: "Are you a...", options: ["Student", "Faculty"], multiSelect: false };

Deno.test("isValidOnboardingQuestion - accepts text, options and a pick-any setting", () => {
  assertEquals(isValidOnboardingQuestion(validQuestion), true);
});

Deno.test("isValidOnboardingQuestion - rejects blank text", () => {
  assertEquals(isValidOnboardingQuestion({ ...validQuestion, text: "  " }), false);
});

Deno.test("isValidOnboardingQuestion - accepts a single option, since Prefer not to say is added on top", () => {
  assertEquals(isValidOnboardingQuestion({ ...validQuestion, options: ["Student", " "] }), true);
});

Deno.test("isValidOnboardingQuestion - rejects a question with only blank options", () => {
  assertEquals(isValidOnboardingQuestion({ ...validQuestion, options: [" ", ""] }), false);
});

Deno.test("isValidOnboardingQuestion - rejects options that aren't text", () => {
  assertEquals(isValidOnboardingQuestion({ ...validQuestion, options: ["Student", 2] }), false);
});

Deno.test("isValidOnboardingQuestion - rejects a missing pick-any setting", () => {
  assertEquals(isValidOnboardingQuestion({ text: "Are you a...", options: ["Student", "Faculty"] }), false);
});

Deno.test("isValidOnboardingQuestion - rejects anything that isn't an object", () => {
  assertEquals(isValidOnboardingQuestion("Are you a..."), false);
  assertEquals(isValidOnboardingQuestion(null), false);
});

Deno.test("isValidOnboardingQuestionList - accepts an empty list, which clears the questions", () => {
  assertEquals(isValidOnboardingQuestionList([]), true);
});

Deno.test("isValidOnboardingQuestionList - rejects a list with one bad question", () => {
  assertEquals(isValidOnboardingQuestionList([validQuestion, { ...validQuestion, text: "" }]), false);
});

Deno.test("toEventDemographicQuestionRows - makes custom event questions in the given order", () => {
  const rows = toEventDemographicQuestionRows(7, [
    validQuestion,
    { text: "How do you identify?", options: ["Black", "White"], multiSelect: true },
  ]);
  assertEquals(rows, [
    {
      roomId: null,
      eventId: 7,
      type: "custom",
      text: "Are you a...",
      options: ["Student", "Faculty"],
      multiSelect: false,
      position: 0,
    },
    {
      roomId: null,
      eventId: 7,
      type: "custom",
      text: "How do you identify?",
      options: ["Black", "White"],
      multiSelect: true,
      position: 1,
    },
  ]);
});

Deno.test("toEventDemographicQuestionRows - trims text and drops blank options", () => {
  const [row] = toEventDemographicQuestionRows(7, [
    { text: "  Are you a...  ", options: [" Student ", "", "Faculty"], multiSelect: false },
  ]);
  assertEquals(row.text, "Are you a...");
  assertEquals(row.options, ["Student", "Faculty"]);
});

Deno.test("requireEventInSetup - allows changes before Start", () => {
  requireEventInSetup(defaultLiveEventState(NOW));
});

Deno.test("requireEventInSetup - blocks changes once the doors are open", () => {
  const openState = { ...defaultLiveEventState(NOW), status: "open" as const };
  assertThrows(() => requireEventInSetup(openState), RouteError);
});

Deno.test("requireEventInSetup - blocks changes once the event is live", () => {
  const liveState = { ...defaultLiveEventState(NOW), status: "live" as const };
  const error = assertThrows(() => requireEventInSetup(liveState), RouteError);
  assertEquals(error.status, 409);
});

Deno.test("requireEventInSetup - blocks changes after the event ends", () => {
  const endedState = { ...defaultLiveEventState(NOW), status: "ended" as const };
  assertThrows(() => requireEventInSetup(endedState), RouteError);
});

const singleChoiceQuestion: DemographicQuestion = {
  id: 11,
  roomId: null,
  eventId: 7,
  type: "custom",
  text: "Are you a...",
  options: ["Student", "Faculty"],
  multiSelect: false,
  position: 0,
};

const pickAnyQuestion: DemographicQuestion = {
  ...singleChoiceQuestion,
  id: 12,
  text: "How do you identify?",
  options: ["Black", "White", "Jewish"],
  multiSelect: true,
  position: 1,
};

const answerRow = (
  questionId: number,
  answer: string | null,
): DemographicAnswer => ({
  id: 1,
  userId: "user-1",
  questionId,
  answer,
  createdAt: NOW,
});

Deno.test(
  "requireEventDoorsOpen - blocks answers while the doors are closed",
  () => {
    const error = assertThrows(
      () => requireEventDoorsOpen(defaultLiveEventState(NOW)),
      RouteError,
    );
    assertEquals(error.status, 409);
  },
);

Deno.test(
  "requireEventDoorsOpen - allows answers once the doors are open and after Start",
  () => {
    requireEventDoorsOpen({
      ...defaultLiveEventState(NOW),
      status: "open",
    });
    requireEventDoorsOpen({
      ...defaultLiveEventState(NOW),
      status: "live",
    });
  },
);

Deno.test(
  "findEventQuestionOrThrow - finds the event's question by id",
  () => {
    const questions = [singleChoiceQuestion, pickAnyQuestion];
    assertEquals(
      findEventQuestionOrThrow(questions, 12),
      pickAnyQuestion,
    );
  },
);

Deno.test(
  "findEventQuestionOrThrow - rejects a question from somewhere else",
  () => {
    const error = assertThrows(
      () => findEventQuestionOrThrow([singleChoiceQuestion], 99),
      RouteError,
    );
    assertEquals(error.status, 404);
  },
);

Deno.test(
  "isValidAnswerList - single choice takes exactly one option",
  () => {
    assertEquals(
      isValidAnswerList(singleChoiceQuestion, ["Student"]),
      true,
    );
    assertEquals(isValidAnswerList(singleChoiceQuestion, []), false);
    assertEquals(
      isValidAnswerList(singleChoiceQuestion, ["Student", "Faculty"]),
      false,
    );
  },
);

Deno.test(
  "isValidAnswerList - Prefer not to say counts as an option on any question",
  () => {
    assertEquals(
      isValidAnswerList(singleChoiceQuestion, [OPT_OUT_ANSWER]),
      true,
    );
    assertEquals(
      isValidAnswerList(pickAnyQuestion, [OPT_OUT_ANSWER]),
      true,
    );
  },
);

Deno.test(
  "isValidAnswerList - pick any takes several options, or none for Skip",
  () => {
    assertEquals(
      isValidAnswerList(pickAnyQuestion, ["Black", "Jewish"]),
      true,
    );
    assertEquals(isValidAnswerList(pickAnyQuestion, []), true);
  },
);

Deno.test(
  "isValidAnswerList - rejects an option the question doesn't have",
  () => {
    assertEquals(
      isValidAnswerList(singleChoiceQuestion, ["Alumni"]),
      false,
    );
    assertEquals(
      isValidAnswerList(pickAnyQuestion, ["Black", "Alumni"]),
      false,
    );
  },
);

Deno.test("isValidAnswerList - rejects the same option twice", () => {
  assertEquals(
    isValidAnswerList(pickAnyQuestion, ["Black", "Black"]),
    false,
  );
});

Deno.test(
  "isValidAnswerList - rejects Prefer not to say alongside other options",
  () => {
    assertEquals(
      isValidAnswerList(pickAnyQuestion, ["Black", OPT_OUT_ANSWER]),
      false,
    );
  },
);

Deno.test(
  "collectAnsweredQuestionIds - lists each question once, even with several picks",
  () => {
    const answers = [
      answerRow(12, "Black"),
      answerRow(12, "Jewish"),
      answerRow(11, "Student"),
    ];
    assertEquals(collectAnsweredQuestionIds(answers), [12, 11]);
  },
);

Deno.test(
  "collectAnsweredQuestionIds - counts a Skip as answered",
  () => {
    assertEquals(
      collectAnsweredQuestionIds([answerRow(12, null)]),
      [12],
    );
  },
);
