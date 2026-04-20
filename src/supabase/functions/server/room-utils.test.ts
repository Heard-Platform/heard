import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Statement, StatementMerge } from "./types.tsx";
import { applyStatementMerges } from "./room-utils.ts";
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

function makeMerge(sourceStatementId: string, targetStatementId: string): StatementMerge {
  return { id: crypto.randomUUID(), roomId: "room1", sourceStatementId, targetStatementId, creatorId: "host1", createdAt: "" };
}

describe("applyMerges", () => {
  it("returns statements unchanged when no merges", () => {
    const stmts = [makeStmt("s1", { agrees: 5 }), makeStmt("s2", { disagrees: 3 })];
    const result = applyStatementMerges(stmts, []);
    assertEquals(result, stmts);
  });

  it("removes source statement from results", () => {
    const stmts = [makeStmt("s1"), makeStmt("s2")];
    const merges = [makeMerge("s1", "s2")];
    const result = applyStatementMerges(stmts, merges);
    assertEquals(result.length, 1);
    assertEquals(result[0].id, "s2");
  });

  it("adds source votes to target", () => {
    const stmts = [
      makeStmt("s1", { agrees: 3, disagrees: 1, voters: { u1: "agree", u2: "agree", u3: "agree", u4: "disagree" } }),
      makeStmt("s2", { agrees: 2, voters: { u5: "agree", u6: "agree" } }),
    ];
    const merges = [makeMerge("s1", "s2")];
    const result = applyStatementMerges(stmts, merges);
    assertEquals(result.length, 1);
    assertEquals(result[0].agrees, 5);
    assertEquals(result[0].disagrees, 1);
  });

  it("target voter wins on conflict and votes aren't double-counted", () => {
    const stmts = [
      makeStmt("s1", { agrees: 1, voters: { u1: "agree" } }),
      makeStmt("s2", { disagrees: 1, voters: { u1: "disagree" } }),
    ];
    const merges = [makeMerge("s1", "s2")];
    const result = applyStatementMerges(stmts, merges);
    assertEquals(result[0].agrees, 0);
    assertEquals(result[0].disagrees, 1);
    assertEquals(result[0].voters.u1, "disagree");
  });

  it("handles super_agree: increments both superAgrees and agrees", () => {
    const stmts = [
      makeStmt("s1", { superAgrees: 2, agrees: 2, voters: { u1: "super_agree", u2: "super_agree" } }),
      makeStmt("s2", { agrees: 1, voters: { u3: "agree" } }),
    ];
    const merges = [makeMerge("s1", "s2")];
    const result = applyStatementMerges(stmts, merges);
    assertEquals(result[0].superAgrees, 2);
    assertEquals(result[0].agrees, 3);
  });

  it("skips merge if source statement not found", () => {
    const stmts = [makeStmt("s2", { agrees: 1, voters: { u1: "agree" } })];
    const merges = [makeMerge("ghost", "s2")];
    const result = applyStatementMerges(stmts, merges);
    assertEquals(result.length, 1);
    assertEquals(result[0].agrees, 1);
  });

  it("handles multiple sources merged into one target", () => {
    const stmts = [
      makeStmt("s1", { agrees: 1, voters: { u1: "agree" } }),
      makeStmt("s2", { agrees: 1, voters: { u2: "agree" } }),
      makeStmt("t1", { agrees: 1, voters: { u3: "agree" } }),
    ];
    const merges = [makeMerge("s1", "t1"), makeMerge("s2", "t1")];
    const result = applyStatementMerges(stmts, merges);
    assertEquals(result.length, 1);
    assertEquals(result[0].id, "t1");
    assertEquals(result[0].agrees, 3);
  });
});