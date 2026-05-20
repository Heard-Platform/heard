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

const STATEMENT: Statement = {
  id: "a",
  text: "text",
  author: "u1",
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId: "room-1",
  timestamp: 0,
  round: 1,
  voters: {},
};

const STATEMENT_VOTES: StatementVotes = {
  id: "a",
  text: "text",
  agreeVotes: 0,
  rawAgreeVotes: 0,
  superAgreeVotes: 0,
  disagreeVotes: 0,
  passVotes: 0,
  consensusScore: 0,
  totalVotes: 0,
  mergedFrom: [],
  clusterVotes: [],
};

const simpleCompareFn = sortWithIdTieBreaker<{ id: string; n: number }>(
  (a, b) => b.n - a.n,
);

describe("sortWithIdTieBreaker", () => {
  it("uses the sort fn alone when no tie", () => {
    expect(
      simpleCompareFn({ id: "z", n: 2 }, { id: "a", n: 1 }),
    ).toBeLessThan(0);
  });

  it("breaks ties by id ascending", () => {
    expect(
      simpleCompareFn({ id: "b", n: 1 }, { id: "a", n: 1 }),
    ).toBeGreaterThan(0);
    expect(
      simpleCompareFn({ id: "a", n: 1 }, { id: "b", n: 1 }),
    ).toBeLessThan(0);
  });

  it("produces a deterministic order regardless of input order when ties exist", () => {
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
    expect([...items1].sort(simpleCompareFn).map((x) => x.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect([...items2].sort(simpleCompareFn).map((x) => x.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

describe("mergeStatements", () => {
  it("returns incoming as-is when existing is undefined", () => {
    const incoming = [
      { ...STATEMENT, id: "a" },
      { ...STATEMENT, id: "b" },
    ];
    expect(mergeStatements(undefined, incoming)).toEqual(incoming);
  });

  it("returns incoming as-is when existing is empty", () => {
    const incoming = [
      { ...STATEMENT, id: "a" },
      { ...STATEMENT, id: "b" },
    ];
    expect(mergeStatements([], incoming)).toEqual(incoming);
  });

  it("preserves existing order when incoming has the same set but reshuffled", () => {
    const existing = [
      { ...STATEMENT, id: "a" },
      { ...STATEMENT, id: "b" },
      { ...STATEMENT, id: "c" },
    ];
    const incoming = [
      { ...STATEMENT, id: "c" },
      { ...STATEMENT, id: "a" },
      { ...STATEMENT, id: "b" },
    ];
    expect(mergeStatements(existing, incoming).map((s) => s.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("updates contents of preserved statements with incoming values", () => {
    const existing = [
      { ...STATEMENT, id: "a", agrees: 1 },
      { ...STATEMENT, id: "b", agrees: 2 },
    ];
    const incoming = [
      { ...STATEMENT, id: "b", agrees: 5, voters: { u1: "agree" as const } },
      { ...STATEMENT, id: "a", agrees: 3 },
    ];
    const merged = mergeStatements(existing, incoming);
    expect(merged.map((s) => s.id)).toEqual(["a", "b"]);
    expect(merged[0].agrees).toBe(3);
    expect(merged[1].agrees).toBe(5);
    expect(merged[1].voters).toEqual({ u1: "agree" });
  });

  it("drops statements that disappear from incoming", () => {
    const existing = [
      { ...STATEMENT, id: "a" },
      { ...STATEMENT, id: "b" },
      { ...STATEMENT, id: "c" },
    ];
    const incoming = [
      { ...STATEMENT, id: "a" },
      { ...STATEMENT, id: "c" },
    ];
    expect(mergeStatements(existing, incoming).map((s) => s.id)).toEqual([
      "a",
      "c",
    ]);
  });

  it("appends genuinely new statements at the end in incoming order", () => {
    const existing = [
      { ...STATEMENT, id: "a" },
      { ...STATEMENT, id: "b" },
    ];
    const incoming = [
      { ...STATEMENT, id: "d" },
      { ...STATEMENT, id: "a" },
      { ...STATEMENT, id: "c" },
      { ...STATEMENT, id: "b" },
    ];
    expect(mergeStatements(existing, incoming).map((s) => s.id)).toEqual([
      "a",
      "b",
      "d",
      "c",
    ]);
  });

  it("handles a mix of preserved, dropped, and new statements", () => {
    const existing = [
      { ...STATEMENT, id: "a", agrees: 1 },
      { ...STATEMENT, id: "b", agrees: 2 },
      { ...STATEMENT, id: "c", agrees: 3 },
    ];
    const incoming = [
      { ...STATEMENT, id: "c", agrees: 30 },
      { ...STATEMENT, id: "a", agrees: 10 },
      { ...STATEMENT, id: "d", agrees: 0 },
    ];
    const merged = mergeStatements(existing, incoming);
    expect(merged.map((s) => s.id)).toEqual(["a", "c", "d"]);
    expect(merged.map((s) => s.agrees)).toEqual([10, 30, 0]);
  });

  it("returns empty when incoming is empty (everything disappeared)", () => {
    expect(
      mergeStatements(
        [
          { ...STATEMENT, id: "a" },
          { ...STATEMENT, id: "b" },
        ],
        [],
      ),
    ).toEqual([]);
  });
});

describe("sortStatementsByDecisive", () => {
  it("orders by (agrees + superAgrees + disagrees) descending", () => {
    const result = sortStatementsByDecisive([
      { ...STATEMENT, id: "a", agrees: 1, superAgrees: 0, disagrees: 0 },
      { ...STATEMENT, id: "b", agrees: 1, superAgrees: 2, disagrees: 3 },
      { ...STATEMENT, id: "c", agrees: 0, superAgrees: 0, disagrees: 2 },
    ]);
    expect(result.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("breaks ties by id", () => {
    const result = sortStatementsByDecisive([
      { ...STATEMENT, id: "z", agrees: 1, disagrees: 1 },
      { ...STATEMENT, id: "a", agrees: 1, disagrees: 1 },
    ]);
    expect(result.map((s) => s.id)).toEqual(["a", "z"]);
  });
});

describe("sortStatementsByNetAgreement", () => {
  it("orders by (agrees - disagrees) descending", () => {
    const result = sortStatementsByNetAgreement([
      { ...STATEMENT, id: "a", agrees: 5, disagrees: 2 },
      { ...STATEMENT, id: "b", agrees: 10, disagrees: 9 },
      { ...STATEMENT, id: "c", agrees: 4, disagrees: 0 },
    ]);
    expect(result.map((s) => s.id)).toEqual(["c", "a", "b"]);
  });

  it("breaks ties on margin by id", () => {
    const result = sortStatementsByNetAgreement([
      { ...STATEMENT, id: "z", agrees: 3, disagrees: 1 },
      { ...STATEMENT, id: "a", agrees: 5, disagrees: 3 },
    ]);
    expect(result.map((s) => s.id)).toEqual(["a", "z"]);
  });
});

describe("sortStatementsByVoteType", () => {
  it("counts votes from the voters map (not cached aggregate fields)", () => {
    const result = sortStatementsByVoteType(
      [
        {
          ...STATEMENT,
          id: "a",
          agrees: 99,
          voters: { u1: "agree", u2: "disagree" },
        },
        {
          ...STATEMENT,
          id: "b",
          agrees: 0,
          voters: { u1: "agree", u2: "agree", u3: "agree" },
        },
      ],
      "agree",
    );
    expect(result.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("breaks ties on count by id", () => {
    const result = sortStatementsByVoteType(
      [
        { ...STATEMENT, id: "z", voters: { u1: "disagree" } },
        { ...STATEMENT, id: "a", voters: { u1: "disagree" } },
      ],
      "disagree",
    );
    expect(result.map((s) => s.id)).toEqual(["a", "z"]);
  });

  it("treats missing voters as zero votes", () => {
    const result = sortStatementsByVoteType(
      [
        { ...STATEMENT, id: "a", voters: { u1: "agree" } },
        { ...STATEMENT, id: "b", voters: {} },
      ],
      "agree",
    );
    expect(result.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it('returns the input unchanged when voteType is "none"', () => {
    const input = [
      { ...STATEMENT, id: "b", voters: { u1: "agree" as const } },
      { ...STATEMENT, id: "a", voters: { u1: "agree" as const } },
    ];
    const result = sortStatementsByVoteType(input, "none");
    expect(result).toBe(input);
  });
});

describe("sortByNumericField", () => {
  it("sorts descending by the chosen numeric field", () => {
    const result = sortByNumericField(
      [
        { ...STATEMENT_VOTES, id: "a", totalVotes: 3 },
        { ...STATEMENT_VOTES, id: "b", totalVotes: 7 },
        { ...STATEMENT_VOTES, id: "c", totalVotes: 1 },
      ],
      "totalVotes",
      "desc",
    );
    expect(result.map((s) => s.id)).toEqual(["b", "a", "c"]);
  });

  it("sorts ascending when requested", () => {
    const result = sortByNumericField(
      [
        { ...STATEMENT_VOTES, id: "a", rawAgreeVotes: 5 },
        { ...STATEMENT_VOTES, id: "b", rawAgreeVotes: 2 },
      ],
      "rawAgreeVotes",
      "asc",
    );
    expect(result.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("breaks ties by id ascending in both directions", () => {
    const tied = [
      { ...STATEMENT_VOTES, id: "z", passVotes: 1 },
      { ...STATEMENT_VOTES, id: "a", passVotes: 1 },
    ];
    expect(
      sortByNumericField(tied, "passVotes", "desc").map((s) => s.id),
    ).toEqual(["a", "z"]);
    expect(
      sortByNumericField(tied, "passVotes", "asc").map((s) => s.id),
    ).toEqual(["a", "z"]);
  });

  it("returns the input unchanged when field is null", () => {
    const input = [
      { ...STATEMENT_VOTES, id: "b", totalVotes: 3 },
      { ...STATEMENT_VOTES, id: "a", totalVotes: 7 },
    ];
    const result = sortByNumericField(input, null, "desc");
    expect(result).toBe(input);
  });
});
