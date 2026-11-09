import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { it } from "@std/testing/bdd";
import {
  buildUnansweredQuestionsByRoomId,
  calcDemographicBreakdown,
  isValidRoomAnswerList,
  OPT_OUT_ANSWER,
  toStoredAnswers,
} from "./demographics-utils.ts";
import type {
  DebateRoom,
  DemographicQuestion,
  RoomDemographicQuestion,
} from "./types.tsx";

it("calcs demographics for single question type", () => {
  const questions = [{ id: "q1", type: "gender" }] as any;
  const answers = [
    { questionId: "q1", answer: "Male", },
    { questionId: "q1", answer: "Female", },
  ] as any;

  const breakdown = calcDemographicBreakdown(questions, answers);

  assertEquals(breakdown, { gender: { Male: 1, Female: 1 } });
});

it("calcs demographics for multiple question types", () => {
  const questions = [
    { id: "q1", type: "gender" },
    { id: "q2", type: "age" },
  ] as any;
  const answers = [
    { questionId: "q1", answer: "Male", },
    { questionId: "q1", answer: "Female", },
    { questionId: "q1", answer: "Female", },
    { questionId: "q2", answer: "18-24", },
    { questionId: "q2", answer: "25-34", },
    { questionId: "q2", answer: "35-44", },
  ] as any;

  const breakdown = calcDemographicBreakdown(questions, answers);

  assertEquals(
    breakdown,
    {
      gender: { Male: 1, Female: 2 },
      age: { "18-24": 1, "25-34": 1, "35-44": 1 },
    }
  );
});

it("handles empty answers", () => {
  const questions = [{ id: "q1", type: "gender" }] as any;
  const answers = [] as any;

  const breakdown = calcDemographicBreakdown(questions, answers);

  assertEquals(breakdown, { });
});

it("counts an old skip as Prefer not to say", () => {
  const questions = [{ id: "q1", type: "gender" }] as any;
  const answers = [
    { questionId: "q1", answer: null, },
    { questionId: "q1", answer: "Female", },
  ] as any;

  const breakdown = calcDemographicBreakdown(questions, answers);

  assertEquals(breakdown, {
    gender: { Female: 1, [OPT_OUT_ANSWER]: 1 },
  });
});

it("handles custom questions", () => {
  const questions = [
    { id: "q1", type: "gender" },
    { id: "q2", type: "custom", text: "Favorite color?" },
  ] as any;
  const answers = [
    { questionId: "q1", answer: "Male", },
    { questionId: "q1", answer: "Male", },
    { questionId: "q2", answer: "Blue", },
    { questionId: "q2", answer: "Red", },
    { questionId: "q2", answer: "Blue", },
  ] as any;

  const breakdown = calcDemographicBreakdown(questions, answers);

  assertEquals(
    breakdown,
    {
      "gender": { Male: 2, },
      "Favorite color?": { Blue: 2, Red: 1 },
    }
  );
});

const roomQuestion = (
  overrides: Partial<DemographicQuestion>,
): DemographicQuestion => ({
  id: 7,
  roomId: "room-1",
  eventId: null,
  type: "custom",
  text: "Which describe you?",
  options: ["Asian", "Black", "White"],
  multiSelect: false,
  position: null,
  ...overrides,
});

it("toStoredAnswers keeps the picked options", () => {
  assertEquals(toStoredAnswers(["Black", "Jewish"]), [
    "Black",
    "Jewish",
  ]);
});

it("toStoredAnswers stores a skip as Prefer not to say", () => {
  assertEquals(toStoredAnswers([]), [OPT_OUT_ANSWER]);
});

it("isValidRoomAnswerList takes one pick on a single choice", () => {
  assertEquals(
    isValidRoomAnswerList(roomQuestion({}), ["Black"]),
    true,
  );
});

it("isValidRoomAnswerList takes a skip", () => {
  assertEquals(isValidRoomAnswerList(roomQuestion({}), []), true);
});

it("isValidRoomAnswerList refuses several on a single choice", () => {
  assertEquals(
    isValidRoomAnswerList(roomQuestion({}), ["Black", "White"]),
    false,
  );
});

it("isValidRoomAnswerList takes several on a multi-select", () => {
  const question = roomQuestion({ multiSelect: true });
  assertEquals(
    isValidRoomAnswerList(question, ["Black", "White"]),
    true,
  );
});

it("isValidRoomAnswerList refuses the same option twice", () => {
  const question = roomQuestion({ multiSelect: true });
  assertEquals(
    isValidRoomAnswerList(question, ["Black", "Black"]),
    false,
  );
});

it("isValidRoomAnswerList refuses an unlisted option", () => {
  assertEquals(
    isValidRoomAnswerList(roomQuestion({}), ["Martian"]),
    false,
  );
});

it("isValidRoomAnswerList takes any standard answer", () => {
  const question = roomQuestion({
    type: "gender",
    text: undefined,
    options: undefined,
  });
  assertEquals(isValidRoomAnswerList(question, ["Female"]), true);
});

it("isValidRoomAnswerList takes Prefer not to say on a single choice", () => {
  assertEquals(
    isValidRoomAnswerList(roomQuestion({}), [OPT_OUT_ANSWER]),
    true,
  );
});

it("isValidRoomAnswerList takes Prefer not to say on a multi-select", () => {
  const question = roomQuestion({ multiSelect: true });
  assertEquals(
    isValidRoomAnswerList(question, [OPT_OUT_ANSWER]),
    true,
  );
});

it("isValidRoomAnswerList refuses Prefer not to say alongside options", () => {
  const question = roomQuestion({ multiSelect: true });
  assertEquals(
    isValidRoomAnswerList(question, ["Black", OPT_OUT_ANSWER]),
    false,
  );
});

it("isValidRoomAnswerList takes a pick on an event question", () => {
  const question = roomQuestion({
    roomId: null,
    eventId: 14,
    multiSelect: true,
    position: 0,
  });
  assertEquals(
    isValidRoomAnswerList(question, ["Asian", "White"]),
    true,
  );
});

const feedRoom = (overrides: Partial<DebateRoom>): DebateRoom =>
  ({ id: "room-1", ...overrides }) as DebateRoom;

const postQuestion = roomQuestion({ id: 1 }) as RoomDemographicQuestion;

const eventQuestion = (id: number): DemographicQuestion =>
  roomQuestion({ id, roomId: null, eventId: 14, position: id });

it("buildUnansweredQuestionsByRoomId gives a post its own questions", () => {
  const questionsByRoomId = buildUnansweredQuestionsByRoomId(
    [feedRoom({})],
    [postQuestion],
    [],
    [],
  );
  assertEquals(questionsByRoomId, { "room-1": [postQuestion] });
});

it("buildUnansweredQuestionsByRoomId swaps in the event's questions", () => {
  const questionsByRoomId = buildUnansweredQuestionsByRoomId(
    [feedRoom({ eventId: 14 })],
    [postQuestion],
    [eventQuestion(2), eventQuestion(3)],
    [],
  );
  assertEquals(questionsByRoomId, {
    "room-1": [eventQuestion(2), eventQuestion(3)],
  });
});

it("buildUnansweredQuestionsByRoomId drops answered event questions", () => {
  const questionsByRoomId = buildUnansweredQuestionsByRoomId(
    [feedRoom({ eventId: 14 })],
    [],
    [eventQuestion(2), eventQuestion(3)],
    [2],
  );
  assertEquals(questionsByRoomId, { "room-1": [eventQuestion(3)] });
});

it("buildUnansweredQuestionsByRoomId never falls back once all event questions are answered", () => {
  const questionsByRoomId = buildUnansweredQuestionsByRoomId(
    [feedRoom({ eventId: 14 })],
    [postQuestion],
    [eventQuestion(2)],
    [2],
  );
  assertEquals(questionsByRoomId, { "room-1": [] });
});

it("buildUnansweredQuestionsByRoomId keeps a post's questions when its event has none", () => {
  const questionsByRoomId = buildUnansweredQuestionsByRoomId(
    [feedRoom({ eventId: 9 })],
    [postQuestion],
    [eventQuestion(2)],
    [],
  );
  assertEquals(questionsByRoomId, { "room-1": [postQuestion] });
});

it("buildUnansweredQuestionsByRoomId gives a post with no questions an empty list", () => {
  const questionsByRoomId = buildUnansweredQuestionsByRoomId(
    [feedRoom({ id: "room-2" })],
    [postQuestion],
    [],
    [],
  );
  assertEquals(questionsByRoomId, { "room-2": [] });
});
