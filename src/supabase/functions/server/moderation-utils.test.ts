import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Statement } from "./types.tsx";
import { markStatementHidden, markStatementVisible } from "./moderation-utils.ts";
import { describe, it } from "@std/testing/bdd";

function makeStmt(id: string, overrides: Partial<Statement> = {}): Statement {
  return {
    id,
    text: `Statement ${id}`,
    author: "user1",
    roomId: "room1",
    round: 1,
    timestamp: 0,
    agrees: 0,
    disagrees: 0,
    passes: 0,
    superAgrees: 0,
    voters: {},
    ...overrides,
  };
}

describe("markStatementHidden", () => {
  it("sets isHidden, hiddenAt, hiddenBy", () => {
    const stmt = makeStmt("s1");
    const result = markStatementHidden(stmt, "host1", 123456);
    assertEquals(result.isHidden, true);
    assertEquals(result.hiddenAt, 123456);
    assertEquals(result.hiddenBy, "host1");
  });

  it("preserves all other fields", () => {
    const stmt = makeStmt("s1", { agrees: 5, voters: { u1: "agree" } });
    const result = markStatementHidden(stmt, "host1", 123456);
    assertEquals(result.id, "s1");
    assertEquals(result.agrees, 5);
    assertEquals(result.voters, { u1: "agree" });
  });

  it("overwrites a previous hide with new metadata", () => {
    const stmt = makeStmt("s1", {
      isHidden: true,
      hiddenAt: 100,
      hiddenBy: "host_old",
    });
    const result = markStatementHidden(stmt, "host_new", 200);
    assertEquals(result.isHidden, true);
    assertEquals(result.hiddenAt, 200);
    assertEquals(result.hiddenBy, "host_new");
  });

  it("does not mutate the input statement", () => {
    const stmt = makeStmt("s1");
    markStatementHidden(stmt, "host1", 123456);
    assertEquals(stmt.isHidden, undefined);
    assertEquals(stmt.hiddenAt, undefined);
    assertEquals(stmt.hiddenBy, undefined);
  });
});

describe("markStatementVisible", () => {
  it("removes isHidden, hiddenAt, and hiddenBy fields", () => {
    const stmt = makeStmt("s1", {
      isHidden: true,
      hiddenAt: 123456,
      hiddenBy: "host1",
    });
    const result = markStatementVisible(stmt);
    assertEquals(result.isHidden, undefined);
    assertEquals(result.hiddenAt, undefined);
    assertEquals(result.hiddenBy, undefined);
  });

  it("preserves all other fields", () => {
    const stmt = makeStmt("s1", {
      agrees: 5,
      voters: { u1: "agree" },
      isHidden: true,
      hiddenAt: 123456,
      hiddenBy: "host1",
    });
    const result = markStatementVisible(stmt);
    assertEquals(result.id, "s1");
    assertEquals(result.agrees, 5);
    assertEquals(result.voters, { u1: "agree" });
  });

  it("is a no-op on an already-visible statement", () => {
    const stmt = makeStmt("s1", { agrees: 3 });
    const result = markStatementVisible(stmt);
    assertEquals(result, stmt);
  });

  it("does not mutate the input statement", () => {
    const stmt = makeStmt("s1", {
      isHidden: true,
      hiddenAt: 123456,
      hiddenBy: "host1",
    });
    markStatementVisible(stmt);
    assertEquals(stmt.isHidden, true);
    assertEquals(stmt.hiddenAt, 123456);
    assertEquals(stmt.hiddenBy, "host1");
  });
});
