import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { calculateClusterConsensus } from "./cluster-analysis.tsx";
import { Statement } from "./types.tsx";
import { ClusterAssignment } from "./clustering.tsx";

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
  assertEquals(result.clusterSizes, { 0: 3, 1: 1 });
  assertEquals(result.statementsByCluster[0].length, 1);
  assertEquals(result.statementsByCluster[0][0].id, "stmt1");
  assertEquals(result.statementsByCluster[0][0].agreeVotes, 3);
  assertEquals(result.statementsByCluster[0][0].totalVotes, 3);
  assertEquals(result.statementsByCluster[0][0].consensusScore, 100);
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

  assertEquals(result.statementsByCluster[0].length, 1);
  assertEquals(result.statementsByCluster[0][0].totalVotes, 1);
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

  assertEquals(result.statementsByCluster[0].length, 3);
  assertEquals(result.statementsByCluster[0][0].id, "stmt1");
  assertEquals(result.statementsByCluster[0][1].id, "stmt2");
  assertEquals(result.statementsByCluster[0][2].id, "stmt3");
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

  assertEquals(result.statementsByCluster[0][0].agreeVotes, 3);
  assertEquals(result.statementsByCluster[0][0].consensusScore, 100);
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

  assertEquals(result.statementsByCluster[0].length, 1);
  assertEquals(result.statementsByCluster[0][0].totalVotes, 1);
  assertEquals(result.statementsByCluster[0][0].agreeVotes, 1);
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
  assertEquals(result.statementsByCluster[0].length, 0);
  assertEquals(result.statementsByCluster[1].length, 0);
});