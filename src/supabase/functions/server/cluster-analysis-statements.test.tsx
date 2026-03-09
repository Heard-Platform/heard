import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { calcBestClusterStatements, calcConsensusScore } from "./cluster-analysis.tsx";
import { Statement, VoteType } from "./types.tsx";
import { assertGreaterOrEqual } from "https://deno.land/std@0.224.0/assert/assert_greater_or_equal.ts";

const testStatements: Statement[] = [
  {
    id: "stmt1",
    text: "Climate change is real",
    author: "user1",
    agrees: 3,
    disagrees: 0,
    passes: 0,
    superAgrees: 1,
    roomId: "room1",
    timestamp: Date.now(),
    round: 1,
    voters: {
      user1: "agree",
      user2: "agree",
      user3: "super_agree",
      user4: "agree",
    },
  },
  {
    id: "stmt2",
    text: "We need renewable energy",
    author: "user2",
    agrees: 2,
    disagrees: 1,
    passes: 0,
    superAgrees: 0,
    roomId: "room1",
    timestamp: Date.now(),
    round: 1,
    voters: {
      user1: "agree",
      user2: "agree",
      user3: "disagree",
    },
  },
];

Deno.test("calcBestClusterStatements", () => {
  const usersInCluster = ["user1", "user2", "user3"];
  const result = calcBestClusterStatements(
    testStatements,
    usersInCluster,
  );

  assertEquals(result.length, 2);

  const stmt1 = result.find((s) => s.id === "stmt1");
  assertEquals(stmt1?.agreeVotes, 3);
  assertEquals(stmt1?.totalVotes, 3);

  const stmt2 = result.find((s) => s.id === "stmt2");
  assertEquals(stmt2?.agreeVotes, 2);
  assertEquals(stmt2?.totalVotes, 3);
});

Deno.test("calcBestClusterStatements prioritizes total votes", () => {
  const voterIds = ["user1", "user2", "user3", "user4", "user5", "user6", "user7", "user8", "user9"];

  const fewHighConsensusVoters: Record<string, VoteType> = {
    user1: "agree",
    user2: "agree",
    user3: "agree",
  };

  const manyMixedConsensusVoters: Record<string, VoteType> = {
    user1: "agree",
    user2: "agree",
    user3: "agree",
    user4: "disagree",
    user5: "agree",
    user6: "agree",
    user7: "agree",
    user8: "agree",
    user9: "disagree",
  };

  const stmt1 = {...testStatements[0], voters: fewHighConsensusVoters };
  const stmt2 = {...testStatements[1], voters: manyMixedConsensusVoters};
  const statements: Statement[] = [stmt1, stmt2];

  const result = calcBestClusterStatements(
    statements,
    voterIds,
  );
  
  assertEquals(result[0].id, "stmt2");
  assertEquals(result[1].id, "stmt1");
});

Deno.test("calcConsensusScore zero votes", () => {
  const agreeCount = 0;
  const disagreeCount = 0;

  const score = calcConsensusScore(agreeCount, disagreeCount);
  assertGreaterOrEqual(score, 0);
});

Deno.test("calcConsensusScore basic case", () => {
  const agreeCount = 3;
  const disagreeCount = 1;

  const score = calcConsensusScore(agreeCount, disagreeCount);
  assertGreaterOrEqual(score, 0.5);
});

Deno.test("calcConsensusScore large total, mixed consensus", () => {
  const agreeCount = 25;
  const disagreeCount = 12;

  const score = calcConsensusScore(agreeCount, disagreeCount);
  assertGreaterOrEqual(score, 0);
});

Deno.test("calcConsensusScore very large total, mixed consensus", () => {
  const agreeCount = 300;
  const disagreeCount = 300;

  const score = calcConsensusScore(agreeCount, disagreeCount);
  assertGreaterOrEqual(score, 0);
});

Deno.test("calcConsensusScore extremely large total, mixed consensus", () => {
  const agreeCount = 1500;
  const disagreeCount = 1000;

  const score = calcConsensusScore(agreeCount, disagreeCount);
  assertGreaterOrEqual(score, 0);
});

Deno.test("calcConsensusScore extremely large total, mixed consensus", () => {
  const agreeCount = 500;
  const disagreeCount = 2000;

  const score = calcConsensusScore(agreeCount, disagreeCount);
  assertGreaterOrEqual(score, 0);
});

type UnindexedCase = {
  agreeCount: number;
  disagreeCount: number;
};

type Case = UnindexedCase & {
  index: number;
};

function scoreAndAssertOrder(cases: UnindexedCase[]) {
  const indexedCases: Case[] = cases.map((c, index) => ({
    ...c,
    index,
  }));
  
  const scoredCases = indexedCases.map((c) => ({
    ...c,
    score: calcConsensusScore(c.agreeCount, c.disagreeCount),
  }));

  const sortedCases = scoredCases.slice().sort((a, b) => b.score - a.score);
  const expectedOrder = sortedCases.map((c) => c.index);
  assertEquals(expectedOrder, indexedCases.map((c) => c.index))
};

Deno.test("calcConsensusScore ranking multiple cases", () => {
  const cases = [
    { agreeCount: 5, disagreeCount: 1000 },
    { agreeCount: 501, disagreeCount: 1 },
    { agreeCount: 500, disagreeCount: 1000 },
    { agreeCount: 5, disagreeCount: 20 },
    { agreeCount: 1500, disagreeCount: 1000 },
    { agreeCount: 10500, disagreeCount: 10000 },
    { agreeCount: 1000, disagreeCount: 1000 },
  ]

  scoreAndAssertOrder(cases);
});

Deno.test("calcConsensusScore ranking same diff at different scales", () => {
  const cases = [
    { agreeCount: 1_000_000, disagreeCount: 4_000_000 },
    { agreeCount: 1_000, disagreeCount: 4_000 },
    { agreeCount: 100, disagreeCount: 400 },
    { agreeCount: 10, disagreeCount: 40 },
    { agreeCount: 1, disagreeCount: 4 },
  ]

  scoreAndAssertOrder(cases);
});