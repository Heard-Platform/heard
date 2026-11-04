import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  isValidOnboardingQuestion,
  isValidOnboardingQuestionList,
  requireEventInSetup,
  toEventDemographicQuestionRows,
} from "./event-onboarding-utils.ts";
import { defaultLiveEventState } from "./live-event-utils.ts";
import { RouteError } from "./route-error.ts";

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

Deno.test("requireEventInSetup - blocks changes once the event is live", () => {
  const liveState = { ...defaultLiveEventState(NOW), status: "live" as const };
  const error = assertThrows(() => requireEventInSetup(liveState), RouteError);
  assertEquals(error.status, 409);
});

Deno.test("requireEventInSetup - blocks changes after the event ends", () => {
  const endedState = { ...defaultLiveEventState(NOW), status: "ended" as const };
  assertThrows(() => requireEventInSetup(endedState), RouteError);
});
