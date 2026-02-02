import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Statement } from "./types.tsx";
import { calcConsensus, calcSpiciness } from "./analysis-utils.tsx";
import { describe, it } from "@std/testing/bdd";


describe("consensus", () => {

  describe("edge cases", () => {

    it("should ignore zero statements", () => {
      const statements = [] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 0);
      assertEquals(consensusData.consensus, 0.0);
    });

    it("should ignore a statement with zero votes", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 0,
          disagrees: 0,
          passes: 0,
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 0);
      assertEquals(consensusData.consensus, 0.0);
    });

    it("should ignore a statement with only pass votes", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 0,
          disagrees: 0,
          passes: 100,
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 0);
      assertEquals(consensusData.consensus, 0.0);
    });
  });

  describe("minimum vote threshold", () => {
    it("should ignore too few votes even with high agreement", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 2,
          disagrees: 0,
          passes: 0,
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 0);
      assertEquals(consensusData.consensus, 0.0);
    });

    it("should calc high consensus with minimum agree votes", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 3,
          disagrees: 0,
          passes: 0,
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 1);
      assertEquals(consensusData.consensus, 1.0);
    });
  });

  describe("opinionated rate threshold", () => {
    it("should ignore when opinionated rate just under threshold", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 49,
          disagrees: 0,
          passes: 51,
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 0);
      assertEquals(consensusData.consensus, 0.0);
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

  describe("multiple statements", () => {
    it("should calc 100% high consensus and 0% spiciness when all high consensus", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 8,
          agrees: 2,
          disagrees: 0,
          passes: 0,
        },
        {
          id: "stmt2",
          superAgrees: 7,
          agrees: 3,
          disagrees: 0,
          passes: 0,
        },
      ] as Statement[];

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

    it("should calc 40% normalized spiciness when 1/10 spicy", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 10,
          disagrees: 0,
          passes: 0,
        },
        {
          id: "stmt2",
          superAgrees: 0,
          agrees: 10,
          disagrees: 0,
          passes: 0,
        },
        {
          id: "stmt3",
          superAgrees: 0,
          agrees: 10,
          disagrees: 0,
          passes: 0,
        },
        {
          id: "stmt4",
          superAgrees: 0,
          agrees: 10,
          disagrees: 0,
          passes: 0,
        },
        {
          id: "stmt5",
          superAgrees: 0,
          agrees: 10,
          disagrees: 0,
          passes: 0,
        },
        {
          id: "stmt6",
          superAgrees: 0,
          agrees: 10,
          disagrees: 0,
          passes: 0,
        },
        {
          id: "stmt7",
          superAgrees: 0,
          agrees: 10,
          disagrees: 0,
          passes: 0,
        },
        {
          id: "stmt8",
          superAgrees: 0,
          agrees: 10,
          disagrees: 0,
          passes: 0,
        },
        {
          id: "stmt9",
          superAgrees: 0,
          agrees: 10,
          disagrees: 0,
          passes: 0,
        },
        {
          id: "stmt10",
          superAgrees: 0,
          agrees: 5,
          disagrees: 5,
          passes: 0,
        }
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 9);
      assertEquals(consensusData.consensus, 1.0);

      const spicinessData = calcSpiciness(statements);
      assertEquals(spicinessData.lowConsensusPostCount, 1);
      assertEquals(spicinessData.spiciness, 0.4);
    });

    it("should calc 100% normalized consensus when 1/4 have enough opinionated votes and high consensus", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 10,
          disagrees: 0,
          passes: 0,
          // Qualifies: enough votes, high consensus
        },
        {
          id: "stmt2",
          superAgrees: 0,
          agrees: 2,
          disagrees: 0,
          passes: 0,
          // Doesn't qualify: not enough votes
        },
        {
          id: "stmt3",
          superAgrees: 0,
          agrees: 5,
          disagrees: 0,
          passes: 100,
          // Doesn't qualify: too many passes
        },
        {
          id: "stmt4",
          superAgrees: 0,
          agrees: 5,
          disagrees: 5,
          passes: 0,
          // Doesn't qualify: split vote (not consensus)
        },
      ] as Statement[];

      const consensusData = calcConsensus(statements);
      assertEquals(consensusData.highConsensusPostCount, 1);
      assertEquals(consensusData.consensus, 1.0); // 1/4 = 0.25, normalized by 0.25
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

    it("should calc 100% normalized high consensus when 2/4 high consensus", () => {
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