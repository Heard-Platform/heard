import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { clusterUsers } from "./clustering.tsx";
import { Vote } from "./types.tsx";

Deno.test(
  "clusterUsers - basic clustering with 4 users and polarized votes",
  () => {
    const roomId = "test-room-1";
    const userIds = ["user1", "user2", "user3", "user4"];

    const statements = [
      {
        id: "stmt1",
        votes: [
          { userId: "user1", voteType: "agree" },
          { userId: "user2", voteType: "agree" },
          { userId: "user3", voteType: "disagree" },
          { userId: "user4", voteType: "disagree" },
        ] as Vote[],
      },
      {
        id: "stmt2",
        votes: [
          { userId: "user1", voteType: "agree" },
          { userId: "user2", voteType: "agree" },
          { userId: "user3", voteType: "disagree" },
          { userId: "user4", voteType: "disagree" },
        ] as Vote[],
      },
    ];

    const result = clusterUsers(roomId, userIds, statements);

    assertEquals(result.metadata.roomId, roomId);
    assertEquals(result.metadata.totalClusters, 2);
    assertEquals(result.clusterAssignments.length, 4);

    assertEquals(
      Object.keys(result.metadata.clusterSizes).length,
      2,
    );
    assertEquals(
      result.metadata.clusterSizes[0] +
        result.metadata.clusterSizes[1],
      4,
    );

    const user1Cluster = result.clusterAssignments.find(
      (ca) => ca.userId === "user1",
    )?.clusterId;
    const user2Cluster = result.clusterAssignments.find(
      (ca) => ca.userId === "user2",
    )?.clusterId;
    const user3Cluster = result.clusterAssignments.find(
      (ca) => ca.userId === "user3",
    )?.clusterId;
    const user4Cluster = result.clusterAssignments.find(
      (ca) => ca.userId === "user4",
    )?.clusterId;

    assertEquals(user1Cluster, user2Cluster);
    assertEquals(user3Cluster, user4Cluster);
  },
);