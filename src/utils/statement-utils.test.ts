import { describe, it, expect } from "vitest";
import {
  mergeStatements,
  sortWithIdTieBreaker,
  sortStatementsByDecisive,
  sortStatementsByNetAgreement,
  sortStatementsByVoteType,
  sortByNumericField,
} from "./statement-utils";
import type { Statement, StatementVotes } from "../types";

const mk = (id: string, overrides: Partial<Statement> = {}): Statement => ({
  id,
  text: `text ${id}`,
  author: "u1",
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId: "room-1",
  timestamp: 0,
  round: 1,
  voters: {},
  ...overrides,
});

describe("withIdTiebreaker", () => {
  it("uses the primary comparator when it returns a non-zero value", () => {
    const cmp = sortWithIdTieBreaker<{ id: string; n: number }>(
      (a, b) => b.n - a.n,
    );
    expect(cmp({ id: "z", n: 2 }, { id: "a", n: 1 })).toBeLessThan(0);
    expect(cmp({ id: "a", n: 1 }, { id: "z", n: 2 })).toBeGreaterThan(0);
  });

  it("breaks ties by id ascending", () => {
    const cmp = sortWithIdTieBreaker<{ id: string; n: number }>(
      (a, b) => b.n - a.n,
    );
    expect(cmp({ id: "b", n: 1 }, { id: "a", n: 1 })).toBeGreaterThan(0);
    expect(cmp({ id: "a", n: 1 }, { id: "b", n: 1 })).toBeLessThan(0);
  });

  it("produces a deterministic order regardless of input order when ties exist", () => {
    const cmp = sortWithIdTieBreaker<{ id: string; n: number }>(
      (a, b) => b.n - a.n,
    );
    const items1 = [
      { id: "c", n: 1 },
      { id: "a", n: 1 },
      { id: "b", n: 1 },
    ];
    const items2 = [
      { id: "a", n: 1 },
      { id: "b", n: 1 },
      { id: "c", n: 1 },
    ];
    expect([...items1].sort(cmp).map((x) => x.id)).toEqual(["a", "b", "c"]);
    expect([...items2].sort(cmp).map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});

describe("mergeStatements", () => {
  it("returns incoming as-is when existing is undefined", () => {
    const incoming = [mk("a"), mk("b")];
    expect(mergeStatements(undefined, incoming)).toEqual(incoming);
  });

  it("returns incoming as-is when existing is empty", () => {
    const incoming = [mk("a"), mk("b")];
    expect(mergeStatements([], incoming)).toEqual(incoming);
  });

  it("preserves existing order when incoming has the same set but reshuffled", () => {
    const existing = [mk("a"), mk("b"), mk("c")];
    const incoming = [mk("c"), mk("a"), mk("b")];
    expect(mergeStatements(existing, incoming).map((s) => s.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("updates contents of preserved statements with incoming values", () => {
    const existing = [mk("a", { agrees: 1 }), mk("b", { agrees: 2 })];
    const incoming = [
      mk("b", { agrees: 5, voters: { u1: "agree" } }),
      mk("a", { agrees: 3 }),
    ];
    const merged = mergeStatements(existing, incoming);
    expect(merged.map((s) => s.id)).toEqual(["a", "b"]);
    expect(merged[0].agrees).toBe(3);
    expect(merged[1].agrees).toBe(5);
    expect(merged[1].voters).toEqual({ u1: "agree" });
  });

  it("drops statements that disappear from incoming", () => {
    const existing = [mk("a"), mk("b"), mk("c")];
    const incoming = [mk("a"), mk("c")];
    expect(mergeStatements(existing, incoming).map((s) => s.id)).toEqual([
      "a",
      "c",
    ]);
  });

  it("appends genuinely new statements at the end in incoming order", () => {
    const existing = [mk("a"), mk("b")];
    const incoming = [mk("d"), mk("a"), mk("c"), mk("b")];
    expect(mergeStatements(existing, incoming).map((s) => s.id)).toEqual([
      "a",
      "b",
      "d",
      "c",
    ]);
  });

  it("handles a mix of preserved, dropped, and new statements", () => {
    const existing = [
      mk("a", { agrees: 1 }),
      mk("b", { agrees: 2 }),
      mk("c", { agrees: 3 }),
    ];
    const incoming = [
      mk("c", { agrees: 30 }),
      mk("a", { agrees: 10 }),
      mk("d", { agrees: 0 }),
    ];
    const merged = mergeStatements(existing, incoming);
    expect(merged.map((s) => s.id)).toEqual(["a", "c", "d"]);
    expect(merged.map((s) => s.agrees)).toEqual([10, 30, 0]);
  });

  it("returns empty when incoming is empty (everything disappeared)", () => {
    expect(mergeStatements([mk("a"), mk("b")], [])).toEqual([]);
  });
});

describe("sortStatementsByDecisive", () => {
  it("orders by (agrees + superAgrees + disagrees) descending", () => {
    const result = sortStatementsByDecisive([
      mk("a", { agrees: 1, superAgrees: 0, disagrees: 0 }),
      mk("b", { agrees: 1, superAgrees: 2, disagrees: 3 }),
      mk("c", { agrees: 0, superAgrees: 0, disagrees: 2 }),
    ]);
    expect(result.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("breaks ties by id", () => {
    const result = sortStatementsByDecisive([
      mk("z", { agrees: 1, disagrees: 1 }),
      mk("a", { agrees: 1, disagrees: 1 }),
    ]);
    expect(result.map((s) => s.id)).toEqual(["a", "z"]);
  });
});

describe("sortStatementsByNetAgreement", () => {
  it("orders by (agrees - disagrees) descending", () => {
    const result = sortStatementsByNetAgreement([
      mk("a", { agrees: 5, disagrees: 2 }),
      mk("b", { agrees: 10, disagrees: 9 }),
      mk("c", { agrees: 4, disagrees: 0 }),
    ]);
    expect(result.map((s) => s.id)).toEqual(["c", "a", "b"]);
  });

  it("breaks ties on margin by id", () => {
    const result = sortStatementsByNetAgreement([
      mk("z", { agrees: 3, disagrees: 1 }),
      mk("a", { agrees: 5, disagrees: 3 }),
    ]);
    expect(result.map((s) => s.id)).toEqual(["a", "z"]);
  });
});

describe("sortStatementsByVoteType", () => {
  it("counts votes from the voters map (not cached aggregate fields)", () => {
    const result = sortStatementsByVoteType(
      [
        mk("a", {
          agrees: 99,
          voters: { u1: "agree", u2: "disagree" },
        }),
        mk("b", {
          agrees: 0,
          voters: { u1: "agree", u2: "agree", u3: "agree" },
        }),
      ],
      "agree",
    );
    expect(result.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("breaks ties on count by id", () => {
    const result = sortStatementsByVoteType(
      [
        mk("z", { voters: { u1: "disagree" } }),
        mk("a", { voters: { u1: "disagree" } }),
      ],
      "disagree",
    );
    expect(result.map((s) => s.id)).toEqual(["a", "z"]);
  });

  it("treats missing voters as zero votes", () => {
    const result = sortStatementsByVoteType(
      [
        mk("a", { voters: { u1: "agree" } }),
        mk("b", { voters: {} }),
      ],
      "agree",
    );
    expect(result.map((s) => s.id)).toEqual(["a", "b"]);
  });
});

describe("sortByNumericField", () => {
  const mkVotes = (
    id: string,
    overrides: Partial<StatementVotes> = {},
  ): StatementVotes => ({
    id,
    text: `text ${id}`,
    agreeVotes: 0,
    rawAgreeVotes: 0,
    superAgreeVotes: 0,
    disagreeVotes: 0,
    passVotes: 0,
    consensusScore: 0,
    totalVotes: 0,
    mergedFrom: [],
    clusterVotes: [],
    ...overrides,
  });

  it("sorts descending by the chosen numeric field", () => {
    const result = sortByNumericField(
      [
        mkVotes("a", { totalVotes: 3 }),
        mkVotes("b", { totalVotes: 7 }),
        mkVotes("c", { totalVotes: 1 }),
      ],
      "totalVotes",
      "desc",
    );
    expect(result.map((s) => s.id)).toEqual(["b", "a", "c"]);
  });

  it("sorts ascending when requested", () => {
    const result = sortByNumericField(
      [
        mkVotes("a", { rawAgreeVotes: 5 }),
        mkVotes("b", { rawAgreeVotes: 2 }),
      ],
      "rawAgreeVotes",
      "asc",
    );
    expect(result.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("breaks ties by id ascending in both directions", () => {
    const tied = [
      mkVotes("z", { passVotes: 1 }),
      mkVotes("a", { passVotes: 1 }),
    ];
    expect(
      sortByNumericField(tied, "passVotes", "desc").map((s) => s.id),
    ).toEqual(["a", "z"]);
    expect(
      sortByNumericField(tied, "passVotes", "asc").map((s) => s.id),
    ).toEqual(["a", "z"]);
  });
});
