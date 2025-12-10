import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  assemblePolisData,
  PolisStatement,
  PolisVoteRow,
} from "./polis-utils.tsx";

Deno.test(
  "assemblePolisData - creates correct number of users",
  () => {
    const polisStatements: PolisStatement[] = [
      { authorId: 0, commentBody: "Statement 1" },
      { authorId: 1, commentBody: "Statement 2" },
      { authorId: 2, commentBody: "Statement 3" },
    ];

    const polisVotes: PolisVoteRow[] = [
      {
        participantId: 0,
        votesByPostId: { 0: 1, 1: -1, 2: 0 },
      },
      {
        participantId: 1,
        votesByPostId: { 0: -1, 1: 1, 2: 1 },
      },
      {
        participantId: 2,
        votesByPostId: { 0: 0, 1: 0, 2: -1 },
      },
    ];

    const result = assemblePolisData(
      "Test Debate",
      "test-subheard",
      "importer-123",
      polisStatements,
      polisVotes,
    );

    assertEquals(result.users.length, 3);
    assertEquals(result.userIdMap.size, 3);

    assertEquals(result.users[0].nickname, "Polis User 1");
    assertEquals(result.users[1].nickname, "Polis User 2");
    assertEquals(result.users[2].nickname, "Polis User 3");

    result.users.forEach((user) => {
      assertEquals(user.isTestUser, true);
      assertEquals(user.isDeveloper, false);
      assertEquals(user.score, 0);
      assertEquals(user.streak, 0);
    });
  },
);

Deno.test(
  "assemblePolisData - creates statements with correct mappings",
  () => {
    const polisStatements = [
      { authorId: 0, commentBody: "First statement" },
      { authorId: 1, commentBody: "Second statement" },
    ];

    const polisVotes: PolisVoteRow[] = [
      { participantId: 0, votesByPostId: { 0: 1 } },
      { participantId: 1, votesByPostId: { 1: 1 } },
    ];

    const result = assemblePolisData(
      "Test Debate",
      "test-subheard",
      "importer-123",
      polisStatements,
      polisVotes,
    );

    assertEquals(result.statements.length, 2);
    assertEquals(result.statements[0].text, "First statement");
    assertEquals(result.statements[1].text, "Second statement");

    const user0Id = result.userIdMap.get(0);
    const user1Id = result.userIdMap.get(1);

    assertExists(user0Id);
    assertExists(user1Id);

    assertEquals(result.statements[0].author, user0Id);
    assertEquals(result.statements[1].author, user1Id);

    result.statements.forEach((stmt) => {
      assertEquals(stmt.roomId, result.room.id);
      assertEquals(stmt.round, 1);
      assertEquals(stmt.agrees, 1);
      assertEquals(stmt.disagrees, 0);
      assertEquals(stmt.passes, 0);
    });
  },
);

Deno.test(
  "assemblePolisData - creates votes and updates statement counts",
  () => {
    const polisStatements = [
      { authorId: 0, commentBody: "Statement 1" },
      { authorId: 1, commentBody: "Statement 2" },
    ];

    const polisVotes: PolisVoteRow[] = [
      { participantId: 0, votesByPostId: { 0: 1, 1: -1 } },
      { participantId: 1, votesByPostId: { 0: 1, 1: 0 } },
      { participantId: 2, votesByPostId: { 0: -1, 1: 1 } },
    ];

    const result = assemblePolisData(
      "Test Debate",
      "test-subheard",
      "importer-123",
      polisStatements,
      polisVotes,
    );

    assertEquals(result.votes.length, 6);

    assertEquals(result.statements[0].agrees, 2);
    assertEquals(result.statements[0].disagrees, 1);
    assertEquals(result.statements[0].passes, 0);

    assertEquals(result.statements[1].agrees, 1);
    assertEquals(result.statements[1].disagrees, 1);
    assertEquals(result.statements[1].passes, 1);

    const user0Id = result.userIdMap.get(0);
    const user1Id = result.userIdMap.get(1);

    assertEquals(
      result.statements[0].voters[user0Id!],
      "agree",
    );
    assertEquals(
      result.statements[0].voters[user1Id!],
      "agree",
    );

    assertEquals(
      result.statements[1].voters[user0Id!],
      "disagree",
    );
    assertEquals(result.statements[1].voters[user1Id!], "pass");
  },
);