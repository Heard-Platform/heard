import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isAppFeedbackStatementKey, isVoteType, reassignAnonymousVotes } from "./feedback-utils.ts";
import type { AppFeedbackVote } from "./types.tsx";

const NOW = 1_761_000_000_000;

const vote = (userId: string, statementKey: string, v: AppFeedbackVote["vote"], votedAt = NOW): AppFeedbackVote => ({
  userId,
  statementKey,
  vote: v,
  roomId: "room-1",
  votedAt,
});

Deno.test("isAppFeedbackStatementKey - known keys only", () => {
  assertEquals(isAppFeedbackStatementKey("enjoying"), true);
  assertEquals(isAppFeedbackStatementKey("made_up"), false);
  assertEquals(isAppFeedbackStatementKey(3), false);
});

Deno.test("isVoteType - the four vote types only", () => {
  assertEquals(["agree", "disagree", "pass", "super_agree"].every(isVoteType), true);
  assertEquals(isVoteType("maybe"), false);
});

Deno.test("reassignAnonymousVotes - moves anon votes to the account", () => {
  assertEquals(
    reassignAnonymousVotes([vote("anon", "enjoying", "agree")], [], "real"),
    [vote("real", "enjoying", "agree")],
  );
});

Deno.test("reassignAnonymousVotes - keeps the account's vote when both voted on a statement", () => {
  assertEquals(
    reassignAnonymousVotes(
      [vote("anon", "enjoying", "disagree"), vote("anon", "founder_chat", "agree")],
      [vote("real", "enjoying", "agree")],
      "real",
    ),
    [vote("real", "founder_chat", "agree")],
  );
});
