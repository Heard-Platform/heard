import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { Statement } from "../../src/types/index.ts";
import {
  AGREE_SHARE,
  DISAGREE_SHARE,
  findCardsLeftToVote,
  pickCardThinkingMs,
  pickFromList,
  pickJoinDelayMs,
  pickVote,
  planAttendeePost,
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
