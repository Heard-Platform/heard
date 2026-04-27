import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  calcStatementBreakdownForCluster,
  calculateClusterConsensus,
} from "./cluster-analysis.tsx";
import { Statement } from "./types.tsx";
import { ClusterAssignment } from "./clustering.tsx";

function makeStatement(voters: Statement["voters"]): Statement {
  const counts = { agree: 0, super_agree: 0, disagree: 0, pass: 0 };
  for (const v of Object.values(voters)) counts[v]++;
  return {
    id: "stmt",
    text: "test",
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

Deno.test("calculateClusterConsensus - basic clustering with consensus", () => {
  const statements: Statement[] = [
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

  const clusterMetadata = {
    totalClusters: 2,
    clusterSizes: {
      0: 3,
      1: 1,
    },
  };

  const assignments: (ClusterAssignment | null)[] = [
    { userId: "user1", clusterId: 0, distance: 0.1 },
    { userId: "user2", clusterId: 0, distance: 0.2 },
    { userId: "user3", clusterId: 0, distance: 0.15 },
    { userId: "user4", clusterId: 1, distance: 0.3 },
  ];

  const participants = ["user1", "user2", "user3", "user4"];

  const result = calculateClusterConsensus(
    statements,
    clusterMetadata,
    assignments,
    participants,
  );

  assertEquals(result.totalClusters, 2);
  assertEquals(result.clusters[0].size, 3);
  assertEquals(result.clusters[1].size, 1);
  assertEquals(result.clusters[0].statements[0].id, "stmt1");
  assertEquals(result.clusters[0].statements[0].agreeVotes, 3);
  assertEquals(result.clusters[0].statements[0].totalVotes, 3);
  assertEquals(result.clusters[0].statements[0].consensusScore, Math.log(3));
});

Deno.test("calculateClusterConsensus - includes statements with less than 3 votes per cluster", () => {
  const statements: Statement[] = [
    {
      id: "stmt1",
      text: "Low participation statement",
      author: "user1",
      agrees: 1,
      disagrees: 0,
      passes: 0,
      superAgrees: 0,
      roomId: "room1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        user1: "agree",
      },
    },
  ];

  const clusterMetadata = {
    totalClusters: 1,
    clusterSizes: {
      0: 2,
    },
  };

  const assignments: (ClusterAssignment | null)[] = [
    { userId: "user1", clusterId: 0, distance: 0.1 },
    { userId: "user2", clusterId: 0, distance: 0.2 },
  ];

  const participants = ["user1", "user2"];

  const result = calculateClusterConsensus(
    statements,
    clusterMetadata,
    assignments,
    participants,
  );

  assertEquals(result.clusters[0].statements.length, 1);
  assertEquals(result.clusters[0].statements[0].totalVotes, 1);
});

Deno.test("calculateClusterConsensus - sorts by consensus score and limits to top 3", () => {
  const statements: Statement[] = [
    {
      id: "stmt1",
      text: "Statement 1",
      author: "user1",
      agrees: 4,
      disagrees: 0,
      passes: 0,
      superAgrees: 0,
      roomId: "room1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        user1: "agree",
        user2: "agree",
        user3: "agree",
        user4: "agree",
      },
    },
    {
      id: "stmt2",
      text: "Statement 2",
      author: "user2",
      agrees: 3,
      disagrees: 1,
      passes: 0,
      superAgrees: 0,
      roomId: "room1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        user1: "agree",
        user2: "agree",
        user3: "agree",
        user4: "disagree",
      },
    },
    {
      id: "stmt3",
      text: "Statement 3",
      author: "user3",
      agrees: 2,
      disagrees: 2,
      passes: 0,
      superAgrees: 0,
      roomId: "room1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        user1: "agree",
        user2: "agree",
        user3: "disagree",
        user4: "disagree",
      },
    },
    {
      id: "stmt4",
      text: "Statement 4",
      author: "user4",
      agrees: 1,
      disagrees: 3,
      passes: 0,
      superAgrees: 0,
      roomId: "room1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        user1: "agree",
        user2: "disagree",
        user3: "disagree",
        user4: "disagree",
      },
    },
  ];

  const clusterMetadata = {
    totalClusters: 1,
    clusterSizes: {
      0: 4,
    },
  };

  const assignments: (ClusterAssignment | null)[] = [
    { userId: "user1", clusterId: 0, distance: 0.1 },
    { userId: "user2", clusterId: 0, distance: 0.1 },
    { userId: "user3", clusterId: 0, distance: 0.1 },
    { userId: "user4", clusterId: 0, distance: 0.1 },
  ];

  const participants = ["user1", "user2", "user3", "user4"];

  const result = calculateClusterConsensus(
    statements,
    clusterMetadata,
    assignments,
    participants,
  );

  assertEquals(result.clusters[0].statements.length, 3);
  assertEquals(result.clusters[0].statements[0].id, "stmt1");
  assertEquals(result.clusters[0].statements[1].id, "stmt2");
  assertEquals(result.clusters[0].statements[2].id, "stmt4");
});

Deno.test("calculateClusterConsensus - handles super agrees correctly", () => {
  const statements: Statement[] = [
    {
      id: "stmt1",
      text: "Super agree statement",
      author: "user1",
      agrees: 1,
      disagrees: 0,
      passes: 0,
      superAgrees: 2,
      roomId: "room1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        user1: "agree",
        user2: "super_agree",
        user3: "super_agree",
      },
    },
  ];

  const clusterMetadata = {
    totalClusters: 1,
    clusterSizes: {
      0: 3,
    },
  };

  const assignments: (ClusterAssignment | null)[] = [
    { userId: "user1", clusterId: 0, distance: 0.1 },
    { userId: "user2", clusterId: 0, distance: 0.2 },
    { userId: "user3", clusterId: 0, distance: 0.3 },
  ];

  const participants = ["user1", "user2", "user3"];

  const result = calculateClusterConsensus(
    statements,
    clusterMetadata,
    assignments,
    participants,
  );

  assertEquals(result.clusters[0].statements[0].agreeVotes, 3);
  assertEquals(result.clusters[0].statements[0].consensusScore, Math.log(3));
});

Deno.test("calculateClusterConsensus - handles null assignments", () => {
  const statements: Statement[] = [
    {
      id: "stmt1",
      text: "Test statement",
      author: "user1",
      agrees: 2,
      disagrees: 0,
      passes: 0,
      superAgrees: 0,
      roomId: "room1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        user1: "agree",
        user2: "agree",
      },
    },
  ];

  const clusterMetadata = {
    totalClusters: 1,
    clusterSizes: {
      0: 2,
    },
  };

  const assignments: (ClusterAssignment | null)[] = [
    { userId: "user1", clusterId: 0, distance: 0.1 },
    null,
    { userId: "user3", clusterId: 0, distance: 0.2 },
  ];

  const participants = ["user1", "user2", "user3"];

  const result = calculateClusterConsensus(
    statements,
    clusterMetadata,
    assignments,
    participants,
  );

  assertEquals(result.clusters[0].statements.length, 1);
  assertEquals(result.clusters[0].statements[0].totalVotes, 1);
  assertEquals(result.clusters[0].statements[0].agreeVotes, 1);
});

Deno.test("calculateClusterConsensus - empty statements array", () => {
  const statements: Statement[] = [];

  const clusterMetadata = {
    totalClusters: 2,
    clusterSizes: {
      0: 2,
      1: 2,
    },
  };

  const assignments: (ClusterAssignment | null)[] = [
    { userId: "user1", clusterId: 0, distance: 0.1 },
    { userId: "user2", clusterId: 0, distance: 0.2 },
    { userId: "user3", clusterId: 1, distance: 0.1 },
    { userId: "user4", clusterId: 1, distance: 0.2 },
  ];

  const participants = ["user1", "user2", "user3", "user4"];

  const result = calculateClusterConsensus(
    statements,
    clusterMetadata,
    assignments,
    participants,
  );

  assertEquals(result.totalClusters, 2);
  assertEquals(result.clusters[0].statements.length, 0);
  assertEquals(result.clusters[1].statements.length, 0);
});

Deno.test("calculateClusterConsensus - statementBreakdowns covers every statement and every cluster in size-desc order", () => {
  const statements: Statement[] = [
    {
      id: "stmt1",
      text: "Statement 1",
      author: "user1",
      agrees: 2,
      disagrees: 1,
      passes: 1,
      superAgrees: 1,
      roomId: "room1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        userA1: "super_agree",
        userA2: "agree",
        userB1: "disagree",
        userB2: "pass",
      },
    },
    {
      id: "stmt2",
      text: "Statement 2",
      author: "user2",
      agrees: 1,
      disagrees: 0,
      passes: 0,
      superAgrees: 0,
      roomId: "room1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        userA1: "agree",
      },
    },
  ];

  const clusterMetadata = {
    totalClusters: 2,
    clusterSizes: { 0: 3, 1: 2 },
  };

  const assignments: (ClusterAssignment | null)[] = [
    { userId: "userA1", clusterId: 0, distance: 0.1 },
    { userId: "userA2", clusterId: 0, distance: 0.1 },
    { userId: "userA3", clusterId: 0, distance: 0.1 },
    { userId: "userB1", clusterId: 1, distance: 0.1 },
    { userId: "userB2", clusterId: 1, distance: 0.1 },
  ];

  const participants = ["userA1", "userA2", "userA3", "userB1", "userB2"];

  const result = calculateClusterConsensus(
    statements,
    clusterMetadata,
    assignments,
    participants,
  );

  assertEquals(Object.keys(result.statementBreakdowns).length, 2);

  const stmt1Breakdowns = result.statementBreakdowns["stmt1"];
  assertEquals(stmt1Breakdowns.length, 2);

  // Cluster 0 (largest, size 3): A1 super_agree, A2 agree, A3 didn't vote.
  assertEquals(stmt1Breakdowns[0].clusterId, 0);
  assertEquals(stmt1Breakdowns[0].clusterSize, 3);
  assertEquals(stmt1Breakdowns[0].agreeVotes, 2);
  assertEquals(stmt1Breakdowns[0].superAgreeVotes, 1);
  assertEquals(stmt1Breakdowns[0].disagreeVotes, 0);
  assertEquals(stmt1Breakdowns[0].passVotes, 0);

  // Cluster 1 (size 2): B1 disagree, B2 pass.
  assertEquals(stmt1Breakdowns[1].clusterId, 1);
  assertEquals(stmt1Breakdowns[1].clusterSize, 2);
  assertEquals(stmt1Breakdowns[1].agreeVotes, 0);
  assertEquals(stmt1Breakdowns[1].superAgreeVotes, 0);
  assertEquals(stmt1Breakdowns[1].disagreeVotes, 1);
  assertEquals(stmt1Breakdowns[1].passVotes, 1);

  // stmt2 only has one voter (userA1, in cluster 0).
  const stmt2Breakdowns = result.statementBreakdowns["stmt2"];
  assertEquals(stmt2Breakdowns[0].agreeVotes, 1);
  assertEquals(stmt2Breakdowns[0].superAgreeVotes, 0);
  assertEquals(stmt2Breakdowns[1].agreeVotes, 0);
  assertEquals(stmt2Breakdowns[1].clusterSize, 2);

  // Cluster ordering in statementBreakdowns matches clusters[] ordering.
  result.clusters.forEach((cluster, idx) => {
    assertEquals(stmt1Breakdowns[idx].clusterId, cluster.id);
    assertEquals(stmt1Breakdowns[idx].clusterSize, cluster.size);
  });
});

Deno.test("calculateClusterConsensus - statementBreakdowns: cluster with no voters yields zeroed counts", () => {
  const statements: Statement[] = [
    {
      id: "stmt1",
      text: "Only cluster A voted",
      author: "userA1",
      agrees: 2,
      disagrees: 0,
      passes: 0,
      superAgrees: 0,
      roomId: "room1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        userA1: "agree",
        userA2: "agree",
      },
    },
  ];

  const clusterMetadata = {
    totalClusters: 2,
    clusterSizes: { 0: 3, 1: 2 },
  };

  const assignments: (ClusterAssignment | null)[] = [
    { userId: "userA1", clusterId: 0, distance: 0.1 },
    { userId: "userA2", clusterId: 0, distance: 0.1 },
    { userId: "userA3", clusterId: 0, distance: 0.1 },
    { userId: "userB1", clusterId: 1, distance: 0.1 },
    { userId: "userB2", clusterId: 1, distance: 0.1 },
  ];

  const result = calculateClusterConsensus(
    statements,
    clusterMetadata,
    assignments,
    ["userA1", "userA2", "userA3", "userB1", "userB2"],
  );

  const breakdown = result.statementBreakdowns["stmt1"];
  assertEquals(breakdown.length, 2);

  // Cluster 0 (largest): 2 agree out of 3.
  assertEquals(breakdown[0].clusterSize, 3);
  assertEquals(breakdown[0].agreeVotes, 2);

  // Cluster 1: nobody voted, all counts are zero.
  assertEquals(breakdown[1].clusterSize, 2);
  assertEquals(breakdown[1].agreeVotes, 0);
  assertEquals(breakdown[1].superAgreeVotes, 0);
  assertEquals(breakdown[1].disagreeVotes, 0);
  assertEquals(breakdown[1].passVotes, 0);
});

Deno.test("calcStatementBreakdownForCluster - counts each vote type and double-counts super_agree as agree", () => {
  const statement = makeStatement({
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
    agreeVotes: 3,        // u1 (agree) + u2/u3 (super_agree)
    superAgreeVotes: 2,   // u2 + u3
    disagreeVotes: 1,
    passVotes: 1,
  });
});

Deno.test("calcStatementBreakdownForCluster - ignores votes from users outside the cluster group", () => {
  const statement = makeStatement({
    insider1: "agree",
    insider2: "disagree",
    outsider1: "super_agree",  // not in users[]
    outsider2: "pass",          // not in users[]
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
  const statement = makeStatement({
    u1: "agree",
    // u2 and u3 are in the cluster but didn't vote on this statement
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
  // didn'tVote = clusterSize - (agree + disagree + pass) = 3 - 1 = 2
});

Deno.test("calcStatementBreakdownForCluster - empty cluster returns all zeros", () => {
  const statement = makeStatement({ u1: "agree", u2: "disagree" });

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
  const statement = makeStatement({ u1: "agree" });

  const result = calcStatementBreakdownForCluster(statement, {
    clusterId: 7,
    size: 42,
    users: ["u1"],
  });

  assertEquals(result.clusterId, 7);
  assertEquals(result.clusterSize, 42);
});