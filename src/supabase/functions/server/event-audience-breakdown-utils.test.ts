import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  calcAudienceBreakdown,
  calcAudienceQuestionBreakdown,
  toRoundedPercent,
} from "./event-audience-breakdown-utils.ts";
import { OPT_OUT_ANSWER } from "./demographics-utils.ts";
import type {
  DemographicAnswer,
  DemographicQuestion,
} from "./types.tsx";

const ROLE_QUESTION: DemographicQuestion = {
  id: 1,
  roomId: null,
  eventId: 7,
  type: "custom",
  text: "Are you a...",
  options: ["Student", "Faculty", "Staff", "Other"],
  multiSelect: false,
  position: 0,
};

const IDENTITY_QUESTION: DemographicQuestion = {
  id: 2,
  roomId: null,
  eventId: 7,
  type: "custom",
  text: "How do you identify?",
  options: ["Black", "White", "Jewish", "Arab"],
  multiSelect: true,
  position: 1,
};

let nextAnswerId = 1;

const answer = (
  userId: string,
  questionId: number,
  label: string | null,
): DemographicAnswer => ({
  id: nextAnswerId++,
  userId,
  questionId,
  answer: label,
  createdAt: 0,
});

const answersFromPeople = (
  questionId: number,
  label: string | null,
  firstPersonNumber: number,
  peopleCount: number,
): DemographicAnswer[] =>
  Array.from({ length: peopleCount }, (_, offset) =>
    answer(`user-${firstPersonNumber + offset}`, questionId, label),
  );

Deno.test("rounds to the nearest 5 percent, never below 5", () => {
  assertEquals(toRoundedPercent(5, 10), 50);
  assertEquals(toRoundedPercent(6, 17), 35);
  assertEquals(toRoundedPercent(5, 300), 5);
});

Deno.test("hides a question until 5 people answered it", () => {
  const answers = answersFromPeople(1, "Student", 0, 4);

  const breakdown = calcAudienceQuestionBreakdown(ROLE_QUESTION, answers);

  assertEquals(breakdown.hasEnoughAnswers, false);
  assertEquals(breakdown.options, []);
});

Deno.test("shows options picked by at least 5 people in question order", () => {
  const answers = [
    ...answersFromPeople(1, "Faculty", 0, 5),
    ...answersFromPeople(1, "Student", 5, 15),
  ];

  const breakdown = calcAudienceQuestionBreakdown(ROLE_QUESTION, answers);

  assertEquals(breakdown.options, [
    { label: "Student", percent: 75, isOptOut: false },
    { label: "Faculty", percent: 25, isOptOut: false },
  ]);
  assertEquals(breakdown.hasHiddenAnswers, false);
});

Deno.test("folds small options into the question's own Other", () => {
  const answers = [
    ...answersFromPeople(1, "Student", 0, 10),
    ...answersFromPeople(1, "Faculty", 10, 3),
    ...answersFromPeople(1, "Other", 13, 3),
  ];

  const breakdown = calcAudienceQuestionBreakdown(ROLE_QUESTION, answers);

  assertEquals(breakdown.options, [
    { label: "Student", percent: 65, isOptOut: false },
    { label: "Other", percent: 40, isOptOut: false },
  ]);
  assertEquals(breakdown.hasHiddenAnswers, false);
});

Deno.test("drops Other and flags it when Other is still under 5", () => {
  const answers = [
    ...answersFromPeople(1, "Student", 0, 10),
    ...answersFromPeople(1, "Faculty", 10, 2),
  ];

  const breakdown = calcAudienceQuestionBreakdown(ROLE_QUESTION, answers);

  assertEquals(breakdown.options, [
    { label: "Student", percent: 85, isOptOut: false },
  ]);
  assertEquals(breakdown.hasHiddenAnswers, true);
});

Deno.test("shows Prefer not to say as an opt-out row, counting old blank answers", () => {
  const answers = [
    ...answersFromPeople(1, "Student", 0, 10),
    ...answersFromPeople(1, OPT_OUT_ANSWER, 10, 3),
    ...answersFromPeople(1, null, 13, 2),
  ];

  const breakdown = calcAudienceQuestionBreakdown(ROLE_QUESTION, answers);

  assertEquals(breakdown.options, [
    { label: "Student", percent: 65, isOptOut: false },
    { label: OPT_OUT_ANSWER, percent: 35, isOptOut: true },
  ]);
});

Deno.test("hides a small Prefer not to say and flags it", () => {
  const answers = [
    ...answersFromPeople(1, "Student", 0, 10),
    ...answersFromPeople(1, OPT_OUT_ANSWER, 10, 1),
  ];

  const breakdown = calcAudienceQuestionBreakdown(ROLE_QUESTION, answers);

  assertEquals(breakdown.options, [
    { label: "Student", percent: 90, isOptOut: false },
  ]);
  assertEquals(breakdown.hasHiddenAnswers, true);
});

Deno.test("counts each person once in Other on a multi-select question", () => {
  const answers = [
    ...answersFromPeople(2, "White", 0, 10),
    ...answersFromPeople(2, "Black", 10, 3),
    ...answersFromPeople(2, "Arab", 10, 3),
    ...answersFromPeople(2, "Jewish", 13, 2),
  ];

  const breakdown = calcAudienceQuestionBreakdown(
    IDENTITY_QUESTION,
    answers,
  );

  assertEquals(breakdown.options, [
    { label: "White", percent: 65, isOptOut: false },
    { label: "Other", percent: 35, isOptOut: false },
  ]);
});

Deno.test("counts only event attendees", () => {
  const attendeeAnswers = answersFromPeople(1, "Student", 0, 10);
  const flyerAnswers = answersFromPeople(1, "Faculty", 100, 10);
  const attendeeUserIds = attendeeAnswers.map(
    (attendeeAnswer) => attendeeAnswer.userId,
  );

  const [roleBreakdown, identityBreakdown] = calcAudienceBreakdown(
    [ROLE_QUESTION, IDENTITY_QUESTION],
    [...attendeeAnswers, ...flyerAnswers],
    attendeeUserIds,
  );

  assertEquals(roleBreakdown.options, [
    { label: "Student", percent: 100, isOptOut: false },
  ]);
  assertEquals(identityBreakdown.hasEnoughAnswers, false);
});
