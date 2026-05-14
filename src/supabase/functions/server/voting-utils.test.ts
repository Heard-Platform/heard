import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { orderStatementsForVoter } from "./voting-utils.ts";
import { Statement } from "./types.tsx";

const makeStatement = (
  id: string,
  agrees: number,
  disagrees: number,
  overrides: Partial<Statement> = {},
): Statement => ({
  id,
  text: "",
  author: "author",
  agrees,
  disagrees,
  passes: 0,
  superAgrees: 0,
  roomId: "room",
  timestamp: 0,
  round: 0,
  voters: {},
  ...overrides,
});

const sequenceRandom = (values: number[]): (() => number) => {
  let i = 0;
  return () => values[i++];
};

describe("orderStatementsForVoter", () => {
  it("returns empty array for empty input", () => {
    assertEquals(orderStatementsForVoter([], () => 0), []);
  });

  it("returns single statement unchanged", () => {
    const statement = makeStatement("only", 3, 2);
    assertEquals(orderStatementsForVoter([statement], () => 0), [statement]);
  });

  it("places the most opinionated statement first when randomness is zero", () => {
    const leader = makeStatement("leader", 10, 5);
    const middle = makeStatement("middle", 3, 4);
    const newcomer = makeStatement("newcomer", 0, 0);

    const result = orderStatementsForVoter(
      [newcomer, middle, leader],
      () => 0,
    );

    assertEquals(result.map((s) => s.id), ["leader", "middle", "newcomer"]);
  });

  it("scales the vote boost proportionally to the leader's vote count", () => {
    const leader = makeStatement("leader", 20, 0);
    const half = makeStatement("half", 10, 0);

    const result = orderStatementsForVoter(
      [half, leader],
      () => 0.125,
    );

    assertEquals(result.map((s) => s.id), ["leader", "half"]);
  });

  it("orders by random value when no statements have opinionated votes", () => {
    const a = makeStatement("a", 0, 0);
    const b = makeStatement("b", 0, 0);
    const c = makeStatement("c", 0, 0);

    const result = orderStatementsForVoter(
      [a, b, c],
      sequenceRandom([0.1, 0.9, 0.5]),
    );

    assertEquals(result.map((s) => s.id), ["b", "c", "a"]);
  });

  it("does not count passes toward opinionated votes", () => {
    const allPasses = makeStatement("passes", 0, 0, { passes: 100 });
    const oneAgree = makeStatement("agree", 1, 0);

    const result = orderStatementsForVoter(
      [allPasses, oneAgree],
      () => 0,
    );

    assertEquals(result.map((s) => s.id), ["agree", "passes"]);
  });

  it("counts disagrees toward opinionated votes", () => {
    const allDisagrees = makeStatement("disagrees", 0, 5);
    const allPasses = makeStatement("passes", 0, 0, { passes: 5 });

    const result = orderStatementsForVoter(
      [allPasses, allDisagrees],
      () => 0,
    );

    assertEquals(result.map((s) => s.id), ["disagrees", "passes"]);
  });
});
