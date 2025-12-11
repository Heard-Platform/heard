import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  clusterUsers,
  ClusterAssignment,
} from "./clustering.tsx";
import { Vote } from "./types.tsx";
import { assertExists } from "https://deno.land/std@0.208.0/assert/assert_exists.ts";

function assertClusterStructure(
  clusterAssignments: ClusterAssignment[],
  expectedUserGroupings: string[][],
) {
  const usersByCluster: Record<number, string[]> = {};
  for (const { clusterId, userId } of clusterAssignments) {
    usersByCluster[clusterId] = usersByCluster[clusterId] || [];
    usersByCluster[clusterId].push(userId);
  }

  const groups = Object.values(usersByCluster);

  expectedUserGroupings.forEach((expectedGroup) => {
    const group = groups.find((group) => {
      return (
        group.every((user) => expectedGroup.includes(user)) &&
        expectedGroup.every((user) => group.includes(user))
      );
    });
    assertExists(
      group,
      `Expected group ${expectedGroup} to exist`,
    );
  });
}

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

    assertEquals(result.metadata.totalClusters, 2);
    assertEquals(result.clusterAssignments.length, 4);

    assertClusterStructure(result.clusterAssignments, [
      ["user1", "user2"],
      ["user3", "user4"],
    ]);
  },
);

Deno.test(
  "clusterUsers - clustering with many users and mixed votes",
  () => {
    const roomId = "test-room-2";
    const userIds = Array.from(
      { length: 20 },
      (_, i) => `user${i + 1}`,
    );

    const statements = Array.from({ length: 5 }, (_, i) => ({
      id: `stmt${i + 1}`,
      votes: userIds.map((userId, index) => ({
        userId,
        voteType:
          index % 3 === 0
            ? "agree"
            : index % 3 === 1
              ? "disagree"
              : "pass",
      })) as Vote[],
    }));

    const result = clusterUsers(roomId, userIds, statements);

    assertEquals(result.metadata.totalClusters, 3);
    assertEquals(result.clusterAssignments.length, 20);

    assertClusterStructure(result.clusterAssignments, [
      [
        "user1",
        "user4",
        "user7",
        "user10",
        "user13",
        "user16",
        "user19",
      ],
      [
        "user2",
        "user5",
        "user8",
        "user11",
        "user14",
        "user17",
        "user20",
      ],
      ["user3", "user6", "user9", "user12", "user15", "user18"],
    ]);
  },
);