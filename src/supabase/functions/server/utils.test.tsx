import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { getConsensusScore } from "./utils.tsx";
import { Statement } from "./types.tsx";

function makeStatement(counts: {
  agrees?: number;
  superAgrees?: number;
  disagrees?: number;
  passes?: number;
}): Statement {
  return {
    id: "s",
    text: "text",
    author: "author",
    agrees: counts.agrees ?? 0,
    superAgrees: counts.superAgrees ?? 0,
    disagrees: counts.disagrees ?? 0,
    passes: counts.passes ?? 0,
    roomId: "room1",
    timestamp: 0,
    round: 1,
    voters: {},
  };
}

describe("getConsensusScore", () => {
  it("returns 0 when there are no opinionated votes", () => {
    assertEquals(getConsensusScore(makeStatement({})), 0);
    assertEquals(getConsensusScore(makeStatement({ passes: 10 })), 0);
  });

  it("returns 100 for unanimous agreement", () => {
    assertEquals(getConsensusScore(makeStatement({ agrees: 10 })), 100);
  });

  it("returns 100 for unanimous disagreement", () => {
    assertEquals(getConsensusScore(makeStatement({ disagrees: 10 })), 100);
  });

  it("returns 0 for a perfect 50/50 split", () => {
    assertEquals(getConsensusScore(makeStatement({ agrees: 5, disagrees: 5 })), 0);
  });

  it("counts super_agrees as agrees", () => {
    assertEquals(getConsensusScore(makeStatement({ superAgrees: 10 })), 100);
    assertEquals(
      getConsensusScore(makeStatement({ agrees: 4, superAgrees: 6 })),
      100,
    );
  });

  it("ignores pass votes in the denominator", () => {
    const withoutPasses = getConsensusScore(makeStatement({ agrees: 10, disagrees: 2 }));
    const withPasses = getConsensusScore(
      makeStatement({ agrees: 10, disagrees: 2, passes: 50 }),
    );
    assertEquals(withoutPasses, withPasses);
  });

  it("scales linearly with the agree/disagree gap", () => {
    const slightLean = getConsensusScore(makeStatement({ agrees: 6, disagrees: 4 }));
    const strongLean = getConsensusScore(makeStatement({ agrees: 9, disagrees: 1 }));
    assertEquals(slightLean, 20);
    assertEquals(strongLean, 80);
  });
});
