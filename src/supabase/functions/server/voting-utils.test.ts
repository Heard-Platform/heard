import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { scoreStatements } from "./voting-utils.ts";
import { Statement } from "./types.tsx";

const STATEMENT: Statement = {
  id: "stmt",
  text: "",
  author: "author",
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId: "room",
  timestamp: 0,
  round: 0,
  voters: {},
};

const scoresById = (
  entries: { statement: Statement; score: number }[],
): Record<string, number> =>
  Object.fromEntries(entries.map(({ statement, score }) => [statement.id, score]));

describe("scoreStatements", () => {
  it("returns empty array for empty input", () => {
    assertEquals(scoreStatements([]), []);
  });

  it("gives a single opinionated statement the full boost (it is its own leader)", () => {
    const statement = { ...STATEMENT, id: "only", agrees: 3, disagrees: 2 };
    assertEquals(scoreStatements([statement]), [
      { statement, score: 25 },
    ]);
  });

  it("gives the leader the full boost and others a proportional share", () => {
    const leader = { ...STATEMENT, id: "leader", agrees: 20 };
    const half = { ...STATEMENT, id: "half", agrees: 10 };
    const quarter = { ...STATEMENT, id: "quarter", agrees: 5 };

    assertEquals(scoresById(scoreStatements([leader, half, quarter])), {
      leader: 25,
      half: 12.5,
      quarter: 6.25,
    });
  });

  it("scores everything as zero when no statements have opinionated votes", () => {
    const a = { ...STATEMENT, id: "a" };
    const b = { ...STATEMENT, id: "b", passes: 100 };

    assertEquals(scoresById(scoreStatements([a, b])), { a: 0, b: 0 });
  });

  it("does not count passes toward opinionated votes", () => {
    const allPasses = { ...STATEMENT, id: "passes", passes: 100 };
    const oneAgree = { ...STATEMENT, id: "agree", agrees: 1 };

    assertEquals(scoresById(scoreStatements([allPasses, oneAgree])), {
      passes: 0,
      agree: 25,
    });
  });

  it("counts disagrees toward opinionated votes", () => {
    const allDisagrees = { ...STATEMENT, id: "disagrees", disagrees: 5 };
    const allPasses = { ...STATEMENT, id: "passes", passes: 5 };

    assertEquals(
      scoresById(scoreStatements([allDisagrees, allPasses])),
      { disagrees: 25, passes: 0 },
    );
  });

  it("preserves input order in the returned entries", () => {
    const a = { ...STATEMENT, id: "a", agrees: 1 };
    const b = { ...STATEMENT, id: "b", agrees: 2 };
    const c = { ...STATEMENT, id: "c", agrees: 3 };

    const result = scoreStatements([c, a, b]);
    assertEquals(result.map(({ statement }) => statement.id), ["c", "a", "b"]);
  });
});
