import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Statement } from "./types.tsx";
import { calcConsensus, calcSpiciness } from "./analysis-utils.tsx";
import { describe, it } from "@std/testing/bdd";

const ZERO_VOTES_STMT = {
  id: "stmt0",
  superAgrees: 0,
  agrees: 0,
  disagrees: 0,
  passes: 0,
} as Statement;

describe("Consensus", () => {
  describe("Edge cases", () => {
    it("ignores empty statements array", () => {
      const statements = [] as Statement[];

      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 0);
      assertEquals(result.consensus, 0.0);
    });

    it("ignores statement with zero votes", () => {
      const statements = [ZERO_VOTES_STMT];

      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 0);
      assertEquals(result.consensus, 0.0);
    });

    it("ignores statement with only passes", () => {
      const statements = [{...ZERO_VOTES_STMT, passes: 100}];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 0);
      assertEquals(result.consensus, 0.0);
    });
  });

  describe("Minimum vote threshold", () => {
    it("ignores too few votes even with high agreement", () => {
      const statements = [{...ZERO_VOTES_STMT, agrees: 2}];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 0);
      assertEquals(result.consensus, 0.0);
    });

    it("calcs high consensus with minimum agree votes", () => {
      const statements = [{...ZERO_VOTES_STMT, agrees: 3}];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 1);
      assertEquals(result.consensus, 1.0);
    });
  });

  describe("Opinionated rate threshold", () => {
    it("ignores when not enough opinionated votes", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 49,
          passes: 51,
        },
      ]

      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 0);
      assertEquals(result.consensus, 0.0);
    });

    it("should calc high consensus when sufficient opinionated rate", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 4,
          disagrees: 1,
          passes: 5,
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 1);
      assertEquals(consensusData.consensus, 1.0);
    });

    it("should ignore when opinionated rate below minimum despite high consensus", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 5,
          disagrees: 0,
          passes: 1000,
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 0);
      assertEquals(consensusData.consensus, 0.0);
    });

    it("should calc high consensus on 'farmers market poll'", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 16,
          disagrees: 2,
          passes: 6,
          // 16/18 = 88.9%
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 1);
      assertEquals(consensusData.consensus, 1.0);
    });
  });

  describe("high consensus threshold", () => {
    it("should not calc high consensus when agreement meets threshold", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 70,
          disagrees: 30,
          passes: 0,
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 0);
      assertEquals(consensusData.consensus, 0.0);
    });

    it("should calc high consensus when agreement exceeds threshold", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 71,
          disagrees: 29,
          passes: 0,
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 1);
      assertEquals(consensusData.consensus, 1.0);
    });

    it("should not calc high consensus when disagreement meets threshold", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 30,
          disagrees: 70,
          passes: 0,
          // 70/100 disagrees = 70%, exactly at threshold, not consensus
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 0);
      assertEquals(consensusData.consensus, 0.0);
    });

    it("should calc high consensus when disagreement exceeds threshold", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 29,
          disagrees: 71,
          passes: 0,
          // 71/100 disagrees = 71%, consensus
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 1);
      assertEquals(consensusData.consensus, 1.0);
    });

    it("should calc high consensus when all superAgrees and above thresholds", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 10,
          agrees: 0,
          disagrees: 2,
          passes: 0,
          // 10/12 = 83% via superAgrees only
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 1);
      assertEquals(consensusData.consensus, 1.0);
    });

    it("should calc high consensus when just above threshold at high vote count", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 701,
          disagrees: 299,
          passes: 0,
          // 701/1000 = 70.1%
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 1);
      assertEquals(consensusData.consensus, 1.0);
    });
  });

  describe("spiciness threshold", () => {
    it("should not calc spicy when agreement percentage meets lower boundary", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 40,
          disagrees: 60,
          passes: 0,
          // 40% - not in spicy range
        },
      ] as Statement[];

      const spicinessData = calcSpiciness(statements);
      assertEquals(spicinessData.lowConsensusPostCount, 0);
      assertEquals(spicinessData.spiciness, 0.0);
    });

    it("should calc spicy when agreement percentage above lower boundary", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 41,
          disagrees: 59,
          passes: 0,
          // Exactly 41% - should be spicy
        },
      ] as Statement[];

      const spicinessData = calcSpiciness(statements);
      assertEquals(spicinessData.lowConsensusPostCount, 1);
      assertEquals(spicinessData.spiciness, 1.0);
    });

    it("should calc spicy when agreement percentage below upper boundary", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 59,
          disagrees: 41,
          passes: 0,
          // 59/100 agrees = 59%, spicy
        },
      ] as Statement[];

      const spicinessData = calcSpiciness(statements);
      assertEquals(spicinessData.lowConsensusPostCount, 1);
      assertEquals(spicinessData.spiciness, 1.0);
    });

    it("should not calc spicy when agreement percentage meets upper boundary", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 60,
          disagrees: 40,
          passes: 0,
          // 60/100 agrees = 60%, exactly at threshold, not spicy
        },
      ] as Statement[];

      const spicinessData = calcSpiciness(statements);
      assertEquals(spicinessData.lowConsensusPostCount, 0);
      assertEquals(spicinessData.spiciness, 0.0);
    });
  });

  describe("Multiple statements", () => {
    it("calcs 100% high consensus and 0% spiciness", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          superAgrees: 8,
          agrees: 2,
        },
        {
          ...ZERO_VOTES_STMT,
          superAgrees: 7,
          agrees: 3,
        },
      ];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 2);
      assertEquals(consensusData.consensus, 1.0);

      const spicinessData = calcSpiciness(statements);
      assertEquals(spicinessData.lowConsensusPostCount, 0);
      assertEquals(spicinessData.spiciness, 0.0);
    });

    it("should calc 100% high consensus and 100% spiciness when 2/3 high consensus and 1/3 spicy", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 8,
          agrees: 2,
          disagrees: 0,
          passes: 0,
          // 10/10 agrees = 100%, consensus
        },
        {
          id: "stmt2",
          superAgrees: 3,
          agrees: 2,
          disagrees: 5,
          passes: 0,
          // 5/10 agrees = 50%, spicy
        },
        {
          id: "stmt3",
          superAgrees: 7,
          agrees: 3,
          disagrees: 0,
          passes: 0,
          // 10/10 agrees = 100%, consensus
        }
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 2);
      assertEquals(consensusData.consensus, 1.0);

      const spicinessData = calcSpiciness(statements);
      assertEquals(spicinessData.lowConsensusPostCount, 1);
      assertEquals(spicinessData.spiciness, 1.0);
    });

    it("should calc 100% high consensus and 100% spiciness when 1/3 high consensus and 2/3 spicy", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 8,
          agrees: 2,
          disagrees: 0,
          passes: 0,
          // 10/10 agrees = 100%
        },
        {
          id: "stmt2",
          superAgrees: 3,
          agrees: 2,
          disagrees: 5,
          passes: 0,
          // 5/10 agrees = 50%
        },
        {
          id: "stmt3",
          superAgrees: 2,
          agrees: 3,
          disagrees: 5,
          passes: 0,
          // 5/10 agrees = 50%
        }
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 1);
      assertEquals(consensusData.consensus, 1.0);

      const spicinessData = calcSpiciness(statements);
      assertEquals(spicinessData.lowConsensusPostCount, 2);
      assertEquals(spicinessData.spiciness, 1.0);
    });

    it("scales up consensus and spiciness properly", () => {
      const agreeStmt = {
        ...ZERO_VOTES_STMT,
        agrees: 10,
      }

      const statements = [
        ...Array(8).fill(agreeStmt),
        {
          ...ZERO_VOTES_STMT,
          agrees: 5,
          disagrees: 5,
        }
      ]

      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 9);
      assertEquals(result.consensus, 1.0);

      const spicinessData = calcSpiciness(statements);
      assertEquals(spicinessData.lowConsensusPostCount, 1);
      assertEquals(spicinessData.spiciness, 0.4);
    });

    it("calcs 100% normalized consensus when only minority of stmts qualify", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 10, // Qualifies: enough votes, high consensus
        },
        {
          ...ZERO_VOTES_STMT,
          agrees: 2, // Doesn't qualify: not enough votes
        },
        {
          ...ZERO_VOTES_STMT,
          agrees: 5,
          passes: 100, // Doesn't qualify: too many passes
        },
        {
          ...ZERO_VOTES_STMT,
          agrees: 5,
          disagrees: 5, // Doesn't qualify: not consensus
        },
      ]

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 1);
      assertEquals(consensusData.consensus, 1.0);
    });

    it("should not calc consensus when not enough votes", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 2,
          disagrees: 0,
          passes: 0,
        },
        {
          id: "stmt2",
          superAgrees: 0,
          agrees: 1,
          disagrees: 1,
          passes: 0,
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 0);
      assertEquals(consensusData.consensus, 0.0);
    });

    it("calcs 100% normalized consensus when half high consensus", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 2,
          agrees: 6,
          disagrees: 2,
          passes: 0,
          // 8/10 agrees = 80%, consensus
        },
        {
          id: "stmt2",
          superAgrees: 1,
          agrees: 2,
          disagrees: 7,
          passes: 0,
          // 7/10 disagrees = 70%, not consensus
        },
        {
          id: "stmt3",
          superAgrees: 3,
          agrees: 4,
          disagrees: 3,
          passes: 0,
          // 7/10 agrees = 70%, not consensus
        },
        {
          id: "stmt4",
          superAgrees: 0,
          agrees: 1,
          disagrees: 9,
          passes: 0,
          // 9/10 disagrees = 90%, consensus
        }
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 2)
      assertEquals(consensusData.consensus, 1.0);
    });
  });
});