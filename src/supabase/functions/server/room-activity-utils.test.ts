import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildRoomVoteDepth, countStatementsVotedOnPerVoter } from "./room-activity-utils.ts";

const vote = (userId: string, statementId: string) => ({ userId, statementId });

Deno.test("countStatementsVotedOnPerVoter - counts each statement once per voter", () => {
  const votes = [vote("ana", "s1"), vote("ana", "s1"), vote("ana", "s2"), vote("ben", "s1")];
  assertEquals(countStatementsVotedOnPerVoter(votes, new Set()).sort(), [1, 2]);
});

Deno.test("countStatementsVotedOnPerVoter - leaves out excluded voters", () => {
  const votes = [vote("ana", "s1"), vote("developer", "s1"), vote("developer", "s2")];
  assertEquals(countStatementsVotedOnPerVoter(votes, new Set(["developer"])), [1]);
});

Deno.test("buildRoomVoteDepth - has a bucket for every statement, including empty ones", () => {
  const result = buildRoomVoteDepth({
    statementCount: 4,
    votes: [vote("ana", "s1"), vote("ben", "s1"), vote("ben", "s2"), vote("ben", "s3")],
    excludedUserIds: new Set(),
  });
  assertEquals(result.buckets.map((bucket) => bucket.stoppedVoterCount), [1, 0, 1, 0]);
  assertEquals(result.buckets.map((bucket) => bucket.reachedVoterCount), [2, 1, 1, 0]);
});

Deno.test("buildRoomVoteDepth - reached percent counts voters who got at least that far", () => {
  const result = buildRoomVoteDepth({
    statementCount: 3,
    votes: [
      vote("ana", "s1"),
      vote("ben", "s1"),
      vote("ben", "s2"),
      vote("cal", "s1"),
      vote("cal", "s2"),
      vote("dee", "s1"),
      vote("dee", "s2"),
      vote("dee", "s3"),
    ],
    excludedUserIds: new Set(),
  });
  assertEquals(result.buckets.map((bucket) => bucket.reachedVoterCount), [4, 3, 1]);
  assertEquals(result.buckets.map((bucket) => bucket.reachedPercent), [100, 75, 25]);
  assertEquals(result.voterCount, 4);
  assertEquals(result.medianStatementsVotedOn, 2);
});

Deno.test("buildRoomVoteDepth - a room with no voters has empty buckets and a zero median", () => {
  const result = buildRoomVoteDepth({ statementCount: 2, votes: [], excludedUserIds: new Set() });
  assertEquals(result.voterCount, 0);
  assertEquals(result.medianStatementsVotedOn, 0);
  assertEquals(result.buckets, [
    { statementsVotedOn: 1, reachedVoterCount: 0, reachedPercent: 0, stoppedVoterCount: 0 },
    { statementsVotedOn: 2, reachedVoterCount: 0, reachedPercent: 0, stoppedVoterCount: 0 },
  ]);
});
