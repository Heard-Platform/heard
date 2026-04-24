import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Statement } from "./types.tsx";
import { filterVisibleStatements } from "./kv-utils.tsx";
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

describe("filterVisibleStatements", () => {
  it("returns statements unchanged when none are hidden", () => {
    const stmts = [makeStmt("s1"), makeStmt("s2")];
    assertEquals(filterVisibleStatements(stmts), stmts);
  });

  it("excludes statements with isHidden=true", () => {
    const stmts = [
      makeStmt("s1"),
      makeStmt("s2", { isHidden: true }),
      makeStmt("s3"),
    ];
    const result = filterVisibleStatements(stmts);
    assertEquals(result.length, 2);
    assertEquals(result.map((s) => s.id), ["s1", "s3"]);
  });

  it("treats missing isHidden as visible", () => {
    const stmts = [makeStmt("s1", { isHidden: undefined })];
    assertEquals(filterVisibleStatements(stmts).length, 1);
  });

  it("treats isHidden=false as visible", () => {
    const stmts = [makeStmt("s1", { isHidden: false })];
    assertEquals(filterVisibleStatements(stmts).length, 1);
  });

  it("returns empty array when all statements are hidden", () => {
    const stmts = [
      makeStmt("s1", { isHidden: true }),
      makeStmt("s2", { isHidden: true }),
    ];
    assertEquals(filterVisibleStatements(stmts), []);
  });
});
