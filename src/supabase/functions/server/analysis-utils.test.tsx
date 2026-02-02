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
    it("too few votes despite high agreement", () => {
      const statements = [{...ZERO_VOTES_STMT, agrees: 2}];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 0);
      assertEquals(result.consensus, 0.0);
    });

    it("minimum agree votes", () => {
      const statements = [{...ZERO_VOTES_STMT, agrees: 3}];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 1);
      assertEquals(result.consensus, 1.0);
    });
  });

  describe("Opinionated rate threshold", () => {
    it("insufficient opinionated rate", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 49,
          passes: 51,
        },
      ];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 0);
      assertEquals(result.consensus, 0.0);
    });

    it("sufficient opinionated rate", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 4,
          disagrees: 1,
          passes: 5,
        },
      ];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 1);
      assertEquals(result.consensus, 1.0);
    });

    it("opinionated rate below minimum despite high consensus", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 5,
          passes: 1000,
        },
      ];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 0);
      assertEquals(result.consensus, 0.0);
    });

    it("high consensus on 'farmers market poll'", () => {
      const statements = [
        {
          id: "stmt1",
          superAgrees: 0,
          agrees: 16, // 16/18 = 88.9%
          disagrees: 2,
          passes: 6,
        },
      ] as Statement[];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 1);
      assertEquals(result.consensus, 1.0);
    });
  });

  describe("High consensus threshold", () => {
    it("agreement meets threshold", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 70,
          disagrees: 30,
        },
      ];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 0);
      assertEquals(result.consensus, 0.0);
    });

    it("agreement exceeds threshold", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 71,
          disagrees: 29,
        },
      ];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 1);
      assertEquals(result.consensus, 1.0);
    });

    it("disagreement meets threshold", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 30,
          disagrees: 70,
        },
      ];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 0);
      assertEquals(result.consensus, 0.0);
    });

    it("disagreement exceeds threshold", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 29,
          disagrees: 71,
        },
      ];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 1);
      assertEquals(result.consensus, 1.0);
    });

    it("all superAgrees and above threshold", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          superAgrees: 10, // 10/12 = 83% via superAgrees only
          disagrees: 2,
        },
      ];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 1);
      assertEquals(result.consensus, 1.0);
    });

    it("just above threshold at high vote count", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 701, // 701/1000 = 70.1%
          disagrees: 299,
        },
      ];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 1);
      assertEquals(result.consensus, 1.0);
    });
  });

  describe("Spiciness threshold", () => {
    it("agreement percentage meets lower threshold", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 40,
          disagrees: 60,
        },
      ];
      const result = calcSpiciness(statements);
      assertEquals(result.lowConsensusPostCount, 0);
      assertEquals(result.spiciness, 0.0);
    });

    it("agreement percentage exceeds lower threshold", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 41,
          disagrees: 59,
        },
      ];
      const result = calcSpiciness(statements);
      assertEquals(result.lowConsensusPostCount, 1);
      assertEquals(result.spiciness, 1.0);
    });

    it("agreement percentage below upper threshold", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 59, // 59/100 = 59%
          disagrees: 41,
        },
      ];
      const result = calcSpiciness(statements);
      assertEquals(result.lowConsensusPostCount, 1);
      assertEquals(result.spiciness, 1.0);
    });

    it("agreement percentage meets upper threshold", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 60, // 60/100 = 60%
          disagrees: 40,
        },
      ];
      const result = calcSpiciness(statements);
      assertEquals(result.lowConsensusPostCount, 0);
      assertEquals(result.spiciness, 0.0);
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
      const cResult = calcConsensus(statements);
      assertEquals(cResult.highConsensusPostCount, 2);
      assertEquals(cResult.consensus, 1.0);

      const sResult = calcSpiciness(statements);
      assertEquals(sResult.lowConsensusPostCount, 0);
      assertEquals(sResult.spiciness, 0.0);
    });

    it("calcs 100% high consensus and 100% spiciness when 2/3 high consensus and 1/3 spicy", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          superAgrees: 8,
          agrees: 2, // 10/10 = 100%
        },
        {
          ...ZERO_VOTES_STMT,
          superAgrees: 3,
          agrees: 2, // 5/10 = 50%
          disagrees: 5,
        },
        {
          ...ZERO_VOTES_STMT,
          superAgrees: 7,
          agrees: 3, // 10/10 = 100%
        }
      ];
      const cResult = calcConsensus(statements);
      assertEquals(cResult.highConsensusPostCount, 2);
      assertEquals(cResult.consensus, 1.0);

      const sResult = calcSpiciness(statements);
      assertEquals(sResult.lowConsensusPostCount, 1);
      assertEquals(sResult.spiciness, 1.0);
    });

    it("calcs 100% high consensus and 100% spiciness when 1/3 high consensus and 2/3 spicy", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          superAgrees: 8,
          agrees: 2, // 10/10 = 100%
        },
        {
          ...ZERO_VOTES_STMT,
          superAgrees: 3,
          agrees: 2, // 5/10 = 50%
          disagrees: 5,
        },
        {
          ...ZERO_VOTES_STMT,
          superAgrees: 2,
          agrees: 3, // 5/10 = 50%
          disagrees: 5,
        }
      ];
      const cResult = calcConsensus(statements);
      assertEquals(cResult.highConsensusPostCount, 1);
      assertEquals(cResult.consensus, 1.0);

      const sResult = calcSpiciness(statements);
      assertEquals(sResult.lowConsensusPostCount, 2);
      assertEquals(sResult.spiciness, 1.0);
    });

    it("scales up consensus and spiciness properly", () => {
      const agreeStmt = {
        ...ZERO_VOTES_STMT,
        agrees: 10,
      }
      const statements = [
        ...Array(9).fill(agreeStmt),
        {
          ...ZERO_VOTES_STMT,
          agrees: 5,
          disagrees: 5,
        }
      ]
      const cResult = calcConsensus(statements);
      assertEquals(cResult.highConsensusPostCount, 9);
      assertEquals(cResult.consensus, 1.0);

      const sResult = calcSpiciness(statements);
      assertEquals(sResult.lowConsensusPostCount, 1);
      assertEquals(sResult.spiciness, 0.4);
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
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 1);
      assertEquals(result.consensus, 1.0);
    });

    it("ignores when not enough votes", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          agrees: 2,
        },
        {
          ...ZERO_VOTES_STMT,
          agrees: 1,
          disagrees: 1,
        },
      ];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 0);
      assertEquals(result.consensus, 0.0);
    });

    it("calcs 100% normalized consensus when half high consensus", () => {
      const statements = [
        {
          ...ZERO_VOTES_STMT,
          superAgrees: 2,
          agrees: 6, // 8/10 = 80%
          disagrees: 2,
        },
        {
          ...ZERO_VOTES_STMT,
          superAgrees: 1,
          agrees: 2,
          disagrees: 7, // 7/10 = 70%
        },
        {
          ...ZERO_VOTES_STMT,
          superAgrees: 3,
          agrees: 4, // 7/10 = 70%
          disagrees: 3,
        },
        {
          ...ZERO_VOTES_STMT,
          agrees: 1,
          disagrees: 9, // 9/10 = 90%
        }
      ];
      const result = calcConsensus(statements);
      assertEquals(result.highConsensusPostCount, 2)
      assertEquals(result.consensus, 1.0);
    });
  });
});