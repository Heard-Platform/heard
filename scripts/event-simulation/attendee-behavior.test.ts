import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type {
  DemographicQuestion,
  Statement,
} from "../../src/types/index.ts";
import { OPT_OUT_ANSWER } from "../../src/utils/demographic-questions.ts";
import {
  AGREE_SHARE,
  DISAGREE_SHARE,
  findCardsLeftToVote,
  OPT_OUT_SHARE,
  pickCardThinkingMs,
  pickFromList,
  pickJoinDelayMs,
  pickOnboardingAnswers,
  pickQuestionAnsweringMs,
  pickVote,
  planAttendeePost,
  SKIP_SHARE,
} from "./attendee-behavior.ts";

const alwaysReturn = (value: number) => () => value;

const returnInOrder = (values: number[]) => {
  let index = 0;
  return () => values[index++];
};

const statement = (overrides: Partial<Statement>): Statement => ({
  id: "statement",
  text: "A statement.",
  author: "host",
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId: "room",
  timestamp: 0,
  round: 1,
  voters: {},
  ...overrides,
});

Deno.test("pickVote splits votes into agree, disagree and pass by share", () => {
  assertEquals(pickVote(alwaysReturn(0)), "agree");
  assertEquals(pickVote(alwaysReturn(AGREE_SHARE)), "disagree");
  assertEquals(pickVote(alwaysReturn(AGREE_SHARE + DISAGREE_SHARE)), "pass");
  assertEquals(pickVote(alwaysReturn(0.999)), "pass");
});

Deno.test("pickJoinDelayMs spreads joins across the window", () => {
  assertEquals(pickJoinDelayMs(alwaysReturn(0), 60_000), 0);
  assertEquals(pickJoinDelayMs(alwaysReturn(0.5), 60_000), 30_000);
});

Deno.test("pickCardThinkingMs leans toward quick swipes", () => {
  assertEquals(pickCardThinkingMs(alwaysReturn(0)), 1500);
  assertEquals(pickCardThinkingMs(alwaysReturn(0.5)), 3375);
  assertEquals(pickCardThinkingMs(alwaysReturn(1)), 9000);
});

Deno.test("planAttendeePost decides writing and phone locking per post", () => {
  assertEquals(planAttendeePost(returnInOrder([0.99, 0.99])), { willWriteStatement: false, phoneLock: null });
  assertEquals(planAttendeePost(returnInOrder([0, 0, 0, 1])), {
    willWriteStatement: true,
    phoneLock: { startsAfterMs: 5000, lastsMs: 90_000 },
  });
});

Deno.test("pickFromList never reads past the end", () => {
  assertEquals(pickFromList(alwaysReturn(0.999999), ["a", "b"]), "b");
  assertEquals(pickFromList(alwaysReturn(0), ["a", "b"]), "a");
});

Deno.test("findCardsLeftToVote skips voted, own and hidden statements", () => {
  const statements = [
    statement({ id: "open" }),
    statement({ id: "voted-here", voters: {} }),
    statement({ id: "voted-on-server", voters: { me: "agree" } }),
    statement({ id: "mine", author: "me" }),
    statement({ id: "hidden", isHidden: true }),
  ];
  assertEquals(
    findCardsLeftToVote(statements, "me", new Set(["voted-here"])).map((card) => card.id),
    ["open"],
  );
});

const onboardingQuestion = (
  overrides: Partial<DemographicQuestion>,
): DemographicQuestion => ({
  id: "question",
  roomId: null,
  eventId: 1,
  type: "custom",
  text: "Are you a...",
  options: ["Student", "Faculty", "Staff"],
  multiSelect: false,
  position: 0,
  ...overrides,
});

const singleChoiceQuestion = onboardingQuestion({});
const pickAnyQuestion = onboardingQuestion({ multiSelect: true });

Deno.test("pickOnboardingAnswers - single choice picks one option", () => {
  const answers = pickOnboardingAnswers(
    returnInOrder([OPT_OUT_SHARE, 0.5]),
    singleChoiceQuestion,
  );
  assertEquals(answers, ["Faculty"]);
});

Deno.test("pickOnboardingAnswers - some people prefer not to say", () => {
  const answers = pickOnboardingAnswers(
    alwaysReturn(0),
    singleChoiceQuestion,
  );
  assertEquals(answers, [OPT_OUT_ANSWER]);
});

Deno.test("pickOnboardingAnswers - some people skip a pick-any question", () => {
  const answers = pickOnboardingAnswers(
    alwaysReturn(0),
    pickAnyQuestion,
  );
  assertEquals(answers, []);
});

Deno.test("pickOnboardingAnswers - pick any can opt out on its own", () => {
  const answers = pickOnboardingAnswers(
    alwaysReturn(SKIP_SHARE),
    pickAnyQuestion,
  );
  assertEquals(answers, [OPT_OUT_ANSWER]);
});

Deno.test("pickOnboardingAnswers - pick any picks up to two different options", () => {
  const answers = pickOnboardingAnswers(
    returnInOrder([0.9, 0.9, 0, 0]),
    pickAnyQuestion,
  );
  assertEquals(answers, ["Student", "Faculty"]);
});

Deno.test("pickQuestionAnsweringMs - takes two to eight seconds", () => {
  assertEquals(pickQuestionAnsweringMs(alwaysReturn(0)), 2000);
  assertEquals(pickQuestionAnsweringMs(alwaysReturn(1)), 8000);
});
