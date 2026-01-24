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
  assertEquals(stmt1?.disagreeVotes, 0);
  assertEquals(stmt1?.totalVotes, 3);
  assertEquals(stmt1?.consensusScore, (3 / 3) * Math.sqrt(3));

  const stmt2 = result.find((s) => s.id === "stmt2");
  assertEquals(stmt2?.agreeVotes, 2);
  assertEquals(stmt2?.disagreeVotes, 1);
  assertEquals(stmt2?.totalVotes, 3);
  assertEquals(stmt2?.consensusScore, (2 / 3) * Math.sqrt(3));
});

Deno.test("calcBestClusterStatements prioritizes total votes", () => {
  const voterIds = ["user1", "user2", "user3", "user4", "user5", "user6", "user7", "user8", "user9"];

  // stmt1: few voters, high consensus
  const fewHighConsensusVoters: Record<string, VoteType> = {
    user1: "agree",
    user2: "agree",
    user3: "agree",
  };

  // stmt1b: few voters, mixed consensus
  const fewLowConsensusVoters: Record<string, VoteType> = {
    user1: "agree",
    user2: "pass",
    user3: "disagree",
  };

  // stmt2: many voters, mixed consensus
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

  // stmt2b: many voters, mixed consensus with passes
  const manyMixedConsensusVotersWithPasses: Record<string, VoteType> = {
    user1: "agree",
    user2: "agree",
    user3: "agree",
    user4: "pass",
    user5: "agree",
    user6: "agree",
    user7: "agree",
    user8: "agree",
    user9: "pass",
  };

  const stmt1 = {...testStatements[0], voters: fewHighConsensusVoters };
  const stmt1b = {...testStatements[0], id: "stmt1b", voters: fewLowConsensusVoters };
  const stmt2 = {...testStatements[1], voters: manyMixedConsensusVoters};
  const stmt2b = {...testStatements[1], id: "stmt2b", voters: manyMixedConsensusVotersWithPasses};
  const statements: Statement[] = [stmt1, stmt1b, stmt2, stmt2b];

  const result = calcBestClusterStatements(
    statements,
    voterIds,
  );
  
  assertEquals(result[0].id, "stmt2b");
  assertEquals(result[1].id, "stmt2");
  assertEquals(result[2].id, "stmt1");
  assertEquals(result[3].id, "stmt1b");
});

Deno.test("calcConsensusScore basic case", () => {
  const agreeCount = 3;
  const disagreeCount = 1;
  const totalVoteCount = 4;

  const score = calcConsensusScore(agreeCount, disagreeCount, totalVoteCount);
  assertGreaterOrEqual(score, 0.5);
});