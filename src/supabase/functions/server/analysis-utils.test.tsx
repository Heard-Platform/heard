import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Statement } from "./types.tsx";
import { calculateAnalysisMetrics } from "./analysis-utils.tsx";
import { filterVisibleStatements } from "./kv-utils.tsx";
import { describe, it } from "@std/testing/bdd";

describe("analysis with hidden statements", () => {
  function makeStmt(id: string, overrides: Partial<Statement> = {}): Statement {
    return {
      id,
      text: `Statement ${id}`,
      author: `author_${id}`,
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

  it("excludes hidden statements, their authors, and voters that only appear in hidden statements", () => {
    const visible1 = makeStmt("v1", {
      author: "author_visible_1",
      voters: { sharedVoter: "agree", visibleOnlyVoter: "disagree" },
      agrees: 1,
      disagrees: 1,
    });
    const hidden = makeStmt("h1", {
      isHidden: true,
      author: "author_hidden_only",
      voters: { sharedVoter: "agree", hiddenOnlyVoter: "disagree" },
      agrees: 1,
      disagrees: 1,
    });
    const visible2 = makeStmt("v2", {
      author: "author_visible_2",
      voters: { sharedVoter: "agree" },
      agrees: 1,
    });

    const filtered = filterVisibleStatements([visible1, hidden, visible2]);
    const metrics = calculateAnalysisMetrics(filtered, [], []);

    assertEquals(filtered.length, 2);
    assertEquals(metrics.totalPosters, 2);
    assertEquals(metrics.totalVoters, 2);
    assertEquals(metrics.totalParticipants, 4);
    assertEquals(metrics.totalVotes, 3);
    assertEquals(metrics.allStatements.length, 2);

    const allAuthors = metrics.allStatements.map((s) => s.id);
    assertEquals(allAuthors.includes("h1"), false);
    assertEquals(metrics.topAgreedPosts.some((p) => p.id === "h1"), false);
    assertEquals(metrics.topDisagreedPosts.some((p) => p.id === "h1"), false);
    assertEquals(metrics.spiciestPosts.some((p) => p.id === "h1"), false);
  });

  it("includes everyone when no statements are hidden", () => {
    const stmts = [
      makeStmt("v1", { voters: { u1: "agree" }, agrees: 1 }),
      makeStmt("v2", { voters: { u2: "agree" }, agrees: 1 }),
    ];
    const metrics = calculateAnalysisMetrics(filterVisibleStatements(stmts), [], []);
    assertEquals(metrics.totalParticipants, 4);
    assertEquals(metrics.totalVotes, 2);
    assertEquals(metrics.allStatements.length, 2);
  });
});

describe("top posts splits", () => {
  function makeStmt(id: string, overrides: Partial<Statement> = {}): Statement {
    return {
      id,
      text: `Statement ${id}`,
      author: `author_${id}`,
      roomId: "room1",
      round: 1,
      timestamp: 0,
      agrees: 0,
      disagrees: 0,
      passes: 0,
      superAgrees: 0,
      voters: { stub: "agree" },
      ...overrides,
    };
  }

  it("topAgreedPosts contains only agree-leaning statements, sorted by agreement rate desc", () => {
    const stmts = [
      makeStmt("agreed-most", { agrees: 90, disagrees: 10 }),
      makeStmt("agreed-some", { agrees: 60, disagrees: 40 }),
      makeStmt("disagreed", { agrees: 10, disagrees: 90 }),
      makeStmt("tied", { agrees: 50, disagrees: 50 }),
    ];

    const metrics = calculateAnalysisMetrics(stmts, [], []);

    assertEquals(metrics.topAgreedPosts.map((p) => p.id), ["agreed-most", "agreed-some"]);
  });

  it("topDisagreedPosts contains only disagree-leaning statements, sorted by disagreement rate desc", () => {
    const stmts = [
      makeStmt("disagreed-most", { agrees: 5, disagrees: 95 }),
      makeStmt("disagreed-some", { agrees: 30, disagrees: 70 }),
      makeStmt("agreed", { agrees: 90, disagrees: 10 }),
    ];

    const metrics = calculateAnalysisMetrics(stmts, [], []);

    assertEquals(
      metrics.topDisagreedPosts.map((p) => p.id),
      ["disagreed-most", "disagreed-some"],
    );
  });

  it("a tied statement appears in neither top-agreed nor top-disagreed", () => {
    const stmts = [makeStmt("tied", { agrees: 25, disagrees: 25 })];

    const metrics = calculateAnalysisMetrics(stmts, [], []);

    assertEquals(metrics.topAgreedPosts.length, 0);
    assertEquals(metrics.topDisagreedPosts.length, 0);
  });

  it("limits each list to 3 entries", () => {
    const stmts = Array.from({ length: 5 }, (_, i) =>
      makeStmt(`a${i}`, { agrees: 90 - i, disagrees: 10 + i }),
    );

    const metrics = calculateAnalysisMetrics(stmts, [], []);

    assertEquals(metrics.topAgreedPosts.length, 3);
  });
});