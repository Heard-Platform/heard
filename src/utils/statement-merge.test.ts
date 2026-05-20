import { describe, it, expect } from "vitest";
import { mergeStatements } from "./statement-merge";
import type { Statement } from "../types";

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
    const merged = mergeStatements(existing, incoming);
    expect(merged.map((s) => s.id)).toEqual(["a", "b", "c"]);
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
    const merged = mergeStatements(existing, incoming);
    expect(merged.map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("appends genuinely new statements at the end in incoming order", () => {
    const existing = [mk("a"), mk("b")];
    const incoming = [mk("d"), mk("a"), mk("c"), mk("b")];
    const merged = mergeStatements(existing, incoming);
    expect(merged.map((s) => s.id)).toEqual(["a", "b", "d", "c"]);
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
    const existing = [mk("a"), mk("b")];
    expect(mergeStatements(existing, [])).toEqual([]);
  });
});
