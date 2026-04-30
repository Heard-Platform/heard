import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { assertGreater } from "https://deno.land/std@0.224.0/assert/assert_greater.ts";
import { assertLess } from "https://deno.land/std@0.224.0/assert/assert_less.ts";
import {
  calcStatementBreakdownForCluster,
  calculateClusterConsensus,
} from "./cluster-analysis.tsx";
import { Statement, VoteType } from "./types.tsx";
import { ClusterAssignment } from "./clustering.tsx";

function makeStatement(id: string, voters: Statement["voters"]): Statement {
  const counts = { agree: 0, super_agree: 0, disagree: 0, pass: 0 };
  for (const v of Object.values(voters)) counts[v]++;
  return {
    id,
    text: `text-${id}`,
    author: "author",
    agrees: counts.agree,
    disagrees: counts.disagree,
    passes: counts.pass,
    superAgrees: counts.super_agree,
    roomId: "room1",
    timestamp: 0,
    round: 1,
    voters,
  };
}

function makeClusteredVoters(
  inClusterUserIds: string[],
  outClusterUserIds: string[],
  inVote: VoteType,
  outVote: VoteType,
): Record<string, VoteType> {
  const voters: Record<string, VoteType> = {};
  for (const id of inClusterUserIds) voters[id] = inVote;
  for (const id of outClusterUserIds) voters[id] = outVote;
  return voters;
}

Deno.test("calculateClusterConsensus - picks distinguishing statements where one cluster diverges", () => {
  const clusterA = Array.from({ length: 40 }, (_, i) => `a${i}`);
  const clusterB = Array.from({ length: 40 }, (_, i) => `b${i}`);

  const statements: Statement[] = [
    makeStatement("divisive", makeClusteredVoters(clusterA, clusterB, "agree", "disagree")),
    makeStatement("universal", makeClusteredVoters(clusterA, clusterB, "agree", "agree")),
  ];

  const assignments: (ClusterAssignment | null)[] = [
    ...clusterA.map((u) => ({ userId: u, clusterId: 0, distance: 0.1 })),
    ...clusterB.map((u) => ({ userId: u, clusterId: 1, distance: 0.1 })),
  ];

  const result = calculateClusterConsensus(
    statements,
    { totalClusters: 2, clusterSizes: { 0: 40, 1: 40 } },
    assignments,
    [...clusterA, ...clusterB],
  );

  assertEquals(result.clusters[0].statements.length, 1);
  assertEquals(result.clusters[0].statements[0].id, "divisive");
  assertEquals(result.clusters[1].statements.length, 1);
  assertEquals(result.clusters[1].statements[0].id, "divisive");
});

Deno.test("calculateClusterConsensus - clusters get opposite-signed scores for the same divisive statement", () => {
  const clusterA = Array.from({ length: 40 }, (_, i) => `a${i}`);
  const clusterB = Array.from({ length: 40 }, (_, i) => `b${i}`);

  const statements: Statement[] = [
    makeStatement("divisive", makeClusteredVoters(clusterA, clusterB, "agree", "disagree")),
  ];

  const assignments: (ClusterAssignment | null)[] = [
    ...clusterA.map((u) => ({ userId: u, clusterId: 0, distance: 0.1 })),
    ...clusterB.map((u) => ({ userId: u, clusterId: 1, distance: 0.1 })),
  ];

  const result = calculateClusterConsensus(
    statements,
    { totalClusters: 2, clusterSizes: { 0: 40, 1: 40 } },
    assignments,
    [...clusterA, ...clusterB],
  );

  assertGreater(result.clusters[0].statements[0].distinguishingScore, 0);
  assertLess(result.clusters[1].statements[0].distinguishingScore, 0);
});

Deno.test("calculateClusterConsensus - low-participation cluster yields no distinguishing statements", () => {
  const statements: Statement[] = [
    makeStatement("low", { user1: "agree" }),
  ];

  const result = calculateClusterConsensus(
    statements,
    { totalClusters: 1, clusterSizes: { 0: 2 } },
    [
      { userId: "user1", clusterId: 0, distance: 0.1 },
      { userId: "user2", clusterId: 0, distance: 0.2 },
    ],
    ["user1", "user2"],
  );

  assertEquals(result.clusters[0].statements.length, 0);
});

Deno.test("calculateClusterConsensus - limits to top 3 distinguishing statements", () => {
  const clusterA = Array.from({ length: 40 }, (_, i) => `a${i}`);
  const clusterB = Array.from({ length: 40 }, (_, i) => `b${i}`);

  const statements: Statement[] = Array.from({ length: 5 }, (_, i) =>
    makeStatement(`s${i}`, makeClusteredVoters(clusterA, clusterB, "agree", "disagree")),
  );

  const assignments: (ClusterAssignment | null)[] = [
    ...clusterA.map((u) => ({ userId: u, clusterId: 0, distance: 0.1 })),
    ...clusterB.map((u) => ({ userId: u, clusterId: 1, distance: 0.1 })),
  ];

  const result = calculateClusterConsensus(
    statements,
    { totalClusters: 2, clusterSizes: { 0: 40, 1: 40 } },
    assignments,
    [...clusterA, ...clusterB],
  );

  assertEquals(result.clusters[0].statements.length, 3);
});

Deno.test("calculateClusterConsensus - super_agree counts as agree in distinguishing statements", () => {
  const clusterA = Array.from({ length: 30 }, (_, i) => `a${i}`);
  const clusterB = Array.from({ length: 30 }, (_, i) => `b${i}`);

  const voters: Record<string, VoteType> = {};
  for (const u of clusterA) voters[u] = "super_agree";
  for (const u of clusterB) voters[u] = "disagree";

  const statements: Statement[] = [makeStatement("s", voters)];

  const assignments: (ClusterAssignment | null)[] = [
    ...clusterA.map((u) => ({ userId: u, clusterId: 0, distance: 0.1 })),
    ...clusterB.map((u) => ({ userId: u, clusterId: 1, distance: 0.1 })),
  ];

  const result = calculateClusterConsensus(
    statements,
    { totalClusters: 2, clusterSizes: { 0: 30, 1: 30 } },
    assignments,
    [...clusterA, ...clusterB],
  );

  assertEquals(result.clusters[0].statements.length, 1);
  assertEquals(result.clusters[0].statements[0].agreeVotes, 30);
  assertEquals(result.clusters[0].statements[0].disagreeVotes, 0);
});

Deno.test("calculateClusterConsensus - users with null cluster assignments are skipped", () => {
  const clusterA = Array.from({ length: 30 }, (_, i) => `a${i}`);
  const clusterB = Array.from({ length: 30 }, (_, i) => `b${i}`);
  const unassigned = ["ghost1", "ghost2"];

  const voters: Record<string, VoteType> = {};
  for (const u of clusterA) voters[u] = "agree";
  for (const u of clusterB) voters[u] = "disagree";
  for (const u of unassigned) voters[u] = "agree";

  const statements: Statement[] = [makeStatement("s", voters)];

  const assignments: (ClusterAssignment | null)[] = [
    ...clusterA.map((u) => ({ userId: u, clusterId: 0, distance: 0.1 })),
    ...clusterB.map((u) => ({ userId: u, clusterId: 1, distance: 0.1 })),
    ...unassigned.map(() => null),
  ];

  const result = calculateClusterConsensus(
    statements,
    { totalClusters: 2, clusterSizes: { 0: 30, 1: 30 } },
    assignments,
    [...clusterA, ...clusterB, ...unassigned],
  );

  assertEquals(result.clusters[0].size, 30);
  assertEquals(result.clusters[1].size, 30);
  assertEquals(result.clusters[0].statements[0].agreeVotes, 30);
  assertEquals(result.clusters[0].statements[0].totalVotes, 30);
});

Deno.test("calculateClusterConsensus - empty statements array", () => {
  const result = calculateClusterConsensus(
    [],
    { totalClusters: 2, clusterSizes: { 0: 2, 1: 2 } },
    [
      { userId: "user1", clusterId: 0, distance: 0.1 },
      { userId: "user2", clusterId: 0, distance: 0.2 },
      { userId: "user3", clusterId: 1, distance: 0.1 },
      { userId: "user4", clusterId: 1, distance: 0.2 },
    ],
    ["user1", "user2", "user3", "user4"],
  );

  assertEquals(result.totalClusters, 2);
  assertEquals(result.clusters[0].statements.length, 0);
  assertEquals(result.clusters[1].statements.length, 0);
});

Deno.test("calculateClusterConsensus - statementBreakdowns covers every statement and every cluster in size-desc order", () => {
  const statements: Statement[] = [
    makeStatement("stmt1", {
      userA1: "super_agree",
      userA2: "agree",
      userB1: "disagree",
      userB2: "pass",
    }),
    makeStatement("stmt2", {
      userA1: "agree",
    }),
  ];

  const result = calculateClusterConsensus(
    statements,
    { totalClusters: 2, clusterSizes: { 0: 3, 1: 2 } },
    [
      { userId: "userA1", clusterId: 0, distance: 0.1 },
      { userId: "userA2", clusterId: 0, distance: 0.1 },
      { userId: "userA3", clusterId: 0, distance: 0.1 },
      { userId: "userB1", clusterId: 1, distance: 0.1 },
      { userId: "userB2", clusterId: 1, distance: 0.1 },
    ],
    ["userA1", "userA2", "userA3", "userB1", "userB2"],
  );

  assertEquals(Object.keys(result.statementBreakdowns).length, 2);

  const stmt1Breakdowns = result.statementBreakdowns["stmt1"];
  assertEquals(stmt1Breakdowns.length, 2);

  assertEquals(stmt1Breakdowns[0].clusterId, 0);
  assertEquals(stmt1Breakdowns[0].clusterSize, 3);
  assertEquals(stmt1Breakdowns[0].agreeVotes, 2);
  assertEquals(stmt1Breakdowns[0].superAgreeVotes, 1);
  assertEquals(stmt1Breakdowns[0].disagreeVotes, 0);
  assertEquals(stmt1Breakdowns[0].passVotes, 0);

  assertEquals(stmt1Breakdowns[1].clusterId, 1);
  assertEquals(stmt1Breakdowns[1].clusterSize, 2);
  assertEquals(stmt1Breakdowns[1].agreeVotes, 0);
  assertEquals(stmt1Breakdowns[1].superAgreeVotes, 0);
  assertEquals(stmt1Breakdowns[1].disagreeVotes, 1);
  assertEquals(stmt1Breakdowns[1].passVotes, 1);

  const stmt2Breakdowns = result.statementBreakdowns["stmt2"];
  assertEquals(stmt2Breakdowns[0].agreeVotes, 1);
  assertEquals(stmt2Breakdowns[0].superAgreeVotes, 0);
  assertEquals(stmt2Breakdowns[1].agreeVotes, 0);
  assertEquals(stmt2Breakdowns[1].clusterSize, 2);

  result.clusters.forEach((cluster, idx) => {
    assertEquals(stmt1Breakdowns[idx].clusterId, cluster.id);
    assertEquals(stmt1Breakdowns[idx].clusterSize, cluster.size);
  });
});

Deno.test("calculateClusterConsensus - statementBreakdowns: cluster with no voters yields zeroed counts", () => {
  const statements: Statement[] = [
    makeStatement("stmt1", {
      userA1: "agree",
      userA2: "agree",
    }),
  ];

  const result = calculateClusterConsensus(
    statements,
    { totalClusters: 2, clusterSizes: { 0: 3, 1: 2 } },
    [
      { userId: "userA1", clusterId: 0, distance: 0.1 },
      { userId: "userA2", clusterId: 0, distance: 0.1 },
      { userId: "userA3", clusterId: 0, distance: 0.1 },
      { userId: "userB1", clusterId: 1, distance: 0.1 },
      { userId: "userB2", clusterId: 1, distance: 0.1 },
    ],
    ["userA1", "userA2", "userA3", "userB1", "userB2"],
  );

  const breakdown = result.statementBreakdowns["stmt1"];
  assertEquals(breakdown.length, 2);

  assertEquals(breakdown[0].clusterSize, 3);
  assertEquals(breakdown[0].agreeVotes, 2);

  assertEquals(breakdown[1].clusterSize, 2);
  assertEquals(breakdown[1].agreeVotes, 0);
  assertEquals(breakdown[1].superAgreeVotes, 0);
  assertEquals(breakdown[1].disagreeVotes, 0);
  assertEquals(breakdown[1].passVotes, 0);
});

Deno.test("calcStatementBreakdownForCluster - counts each vote type and double-counts super_agree as agree", () => {
  const statement = makeStatement("s", {
    u1: "agree",
    u2: "super_agree",
    u3: "super_agree",
    u4: "disagree",
    u5: "pass",
  });

  const result = calcStatementBreakdownForCluster(statement, {
    clusterId: 0,
    size: 5,
    users: ["u1", "u2", "u3", "u4", "u5"],
  });

  assertEquals(result, {
    clusterId: 0,
    clusterSize: 5,
    agreeVotes: 3,
    superAgreeVotes: 2,
    disagreeVotes: 1,
    passVotes: 1,
  });
});

Deno.test("calcStatementBreakdownForCluster - ignores votes from users outside the cluster group", () => {
  const statement = makeStatement("s", {
    insider1: "agree",
    insider2: "disagree",
    outsider1: "super_agree",
    outsider2: "pass",
  });

  const result = calcStatementBreakdownForCluster(statement, {
    clusterId: 1,
    size: 2,
    users: ["insider1", "insider2"],
  });

  assertEquals(result.agreeVotes, 1);
  assertEquals(result.superAgreeVotes, 0);
  assertEquals(result.disagreeVotes, 1);
  assertEquals(result.passVotes, 0);
});

Deno.test("calcStatementBreakdownForCluster - cluster members who didn't vote contribute zero (denominator stays clusterSize)", () => {
  const statement = makeStatement("s", {
    u1: "agree",
  });

  const result = calcStatementBreakdownForCluster(statement, {
    clusterId: 2,
    size: 3,
    users: ["u1", "u2", "u3"],
  });

  assertEquals(result.clusterSize, 3);
  assertEquals(result.agreeVotes, 1);
  assertEquals(result.superAgreeVotes, 0);
  assertEquals(result.disagreeVotes, 0);
  assertEquals(result.passVotes, 0);
});

Deno.test("calcStatementBreakdownForCluster - empty cluster returns all zeros", () => {
  const statement = makeStatement("s", { u1: "agree", u2: "disagree" });

  const result = calcStatementBreakdownForCluster(statement, {
    clusterId: 0,
    size: 0,
    users: [],
  });

  assertEquals(result, {
    clusterId: 0,
    clusterSize: 0,
    agreeVotes: 0,
    superAgreeVotes: 0,
    disagreeVotes: 0,
    passVotes: 0,
  });
});

Deno.test("calcStatementBreakdownForCluster - passes through clusterId and clusterSize from the group", () => {
  const statement = makeStatement("s", { u1: "agree" });

  const result = calcStatementBreakdownForCluster(statement, {
    clusterId: 7,
    size: 42,
    users: ["u1"],
  });

  assertEquals(result.clusterId, 7);
  assertEquals(result.clusterSize, 42);
});
