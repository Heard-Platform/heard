import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  applyVoteToStatement,
  calculateVoteStats,
} from "./vote-stats-utils.ts";
import type { Statement, VoteType } from "./types.tsx";

const STATEMENT: Statement = {
  id: "statement",
  text: "",
  author: "author",
  agrees: 3,
  disagrees: 2,
  passes: 1,
  superAgrees: 1,
  roomId: "room",
  timestamp: 0,
  round: 1,
  voters: { earlier: "agree" },
};

const countsOf = ({ agrees, disagrees, passes, superAgrees }: Statement) => ({
  agrees,
  disagrees,
  passes,
  superAgrees,
});

Deno.test("applyVoteToStatement - a first vote adds to its count", () => {
  const updated = applyVoteToStatement(STATEMENT, "voter", null, "disagree");
  assertEquals(countsOf(updated), {
    agrees: 3,
    disagrees: 3,
    passes: 1,
    superAgrees: 1,
  });
  assertEquals(updated.voters, { earlier: "agree", voter: "disagree" });
});

Deno.test("applyVoteToStatement - a changed vote moves between counts", () => {
  const updated = applyVoteToStatement(STATEMENT, "voter", "agree", "pass");
  assertEquals(countsOf(updated), {
    agrees: 2,
    disagrees: 2,
    passes: 2,
    superAgrees: 1,
  });
});

Deno.test("applyVoteToStatement - a super agree also counts as an agree", () => {
  const added = applyVoteToStatement(STATEMENT, "voter", null, "super_agree");
  assertEquals(countsOf(added), {
    agrees: 4,
    disagrees: 2,
    passes: 1,
    superAgrees: 2,
  });
  const removed = applyVoteToStatement(STATEMENT, "voter", "super_agree", "disagree");
  assertEquals(countsOf(removed), {
    agrees: 2,
    disagrees: 3,
    passes: 1,
    superAgrees: 0,
  });
});

Deno.test("applyVoteToStatement - matches a full recount", () => {
  const votes: { userId: string; voteType: VoteType }[] = [
    { userId: "first", voteType: "agree" },
    { userId: "second", voteType: "super_agree" },
  ];
  const before = { ...STATEMENT, ...calculateVoteStats(votes) };
  const updated = applyVoteToStatement(before, "first", "agree", "disagree");
  const recounted = calculateVoteStats([
    { userId: "first", voteType: "disagree" },
    { userId: "second", voteType: "super_agree" },
  ]);
  assertEquals(countsOf(updated), {
    agrees: recounted.agrees,
    disagrees: recounted.disagrees,
    passes: recounted.passes,
    superAgrees: recounted.superAgrees,
  });
  assertEquals(updated.voters, recounted.voters);
});

Deno.test("applyVoteToStatement - leaves the original statement alone", () => {
  applyVoteToStatement(STATEMENT, "voter", null, "agree");
  assertEquals(STATEMENT.agrees, 3);
  assertEquals(STATEMENT.voters, { earlier: "agree" });
});
