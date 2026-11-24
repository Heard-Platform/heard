import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  findMergeLeftoverVotes,
  planVoteCopy,
  voteToRow,
} from "./utils.ts";
import type { Vote } from "../../src/supabase/functions/server/types.tsx";

const makeVote = (overrides: Partial<Vote> = {}): Vote => ({
  id: "vote-1",
  statementId: "statement-1",
  userId: "user-1",
  voteType: "agree",
  timestamp: 1000,
  ...overrides,
});

const currentFormatRecord = (vote: Vote) => ({
  key: `vote:${vote.statementId}:${vote.userId}`,
  value: JSON.stringify(vote),
});

Deno.test("planVoteCopy copies current format votes", () => {
  const vote = makeVote();
  const plan = planVoteCopy([currentFormatRecord(vote)]);
  assertEquals(plan.votesToCopy, [vote]);
  assertEquals(plan.oldFormatSkippedCount, 0);
});

Deno.test("planVoteCopy skips votes keyed by vote id", () => {
  const vote = makeVote();
  const plan = planVoteCopy([
    { key: `vote:${vote.id}`, value: JSON.stringify(vote) },
  ]);
  assertEquals(plan.votesToCopy, []);
  assertEquals(plan.oldFormatSkippedCount, 1);
});

Deno.test("planVoteCopy skips unreadable records", () => {
  const plan = planVoteCopy([
    { key: "vote:statement-1:user-1", value: "{not json" },
  ]);
  assertEquals(plan.votesToCopy, []);
  assertEquals(plan.unreadableSkippedCount, 1);
});

Deno.test(
  "planVoteCopy drops the anonymous original of a merged vote",
  () => {
    const anonymousOriginal = makeVote({ userId: "anonymous-1" });
    const accountCopy = makeVote({
      userId: "account-1",
      anonymousUserId: "anonymous-1",
    });
    const plan = planVoteCopy([
      currentFormatRecord(anonymousOriginal),
      currentFormatRecord(accountCopy),
    ]);
    assertEquals(plan.votesToCopy, [accountCopy]);
    assertEquals(plan.mergeLeftoverSkippedCount, 1);
  },
);

Deno.test(
  "findMergeLeftoverVotes ignores votes that only share an id",
  () => {
    const firstVote = makeVote({ userId: "user-1" });
    const secondVote = makeVote({ userId: "user-2" });
    assertEquals(findMergeLeftoverVotes([firstVote, secondVote]).size, 0);
  },
);

Deno.test("voteToRow fills missing optional fields with null", () => {
  assertEquals(voteToRow(makeVote()), {
    id: "vote-1",
    statementId: "statement-1",
    userId: "user-1",
    voteType: "agree",
    source: null,
    flyerId: null,
    flyerGroup: null,
    anonymousUserId: null,
    timestamp: 1000,
  });
});

Deno.test("voteToRow rounds fractional timestamps down", () => {
  const vote = makeVote({ timestamp: 1000.75 });
  assertEquals(voteToRow(vote).timestamp, 1000);
});
