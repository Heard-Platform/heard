import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Statement } from "./types.tsx";
import { calcConsensus, calcSpiciness } from "./analysis-utils.tsx";


// ***** EDGE CASES *****
Deno.test(
  "consensus - no statements",
  () => {
    const statements = [] as Statement[];

    const consensusData = calcConsensus(statements);
    assertEquals(consensusData.highConsensusPostCount, 0);
    assertEquals(consensusData.consensus, 0.0);
  },
);

Deno.test(
  "consensus - not enough opinionated votes to be considered",
  () => {
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
  },
);

Deno.test(
  "consensus - only pass votes are not considered",
  () => {
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
  },
);


// ***** MINIMUM VOTE THRESHOLD *****
Deno.test(
  "consensus - high agreement but too few votes to be considered",
  () => {
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
  },
);

Deno.test(
  "consensus - 3 agree votes is high consensus",
  () => {
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
  },
);


// ***** OPINIONATED RATE THRESHOLD *****
Deno.test(
  "consensus - 49% opinionated rate is not considered for consensus",
  () => {
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
  },
);

Deno.test(
  "consensus - exactly 50% opinionated rate is considered for consensus",
  () => {
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
  },
);

Deno.test(
  "consensus - 100% agreement, sufficient opinionated votes, but opinionatedRate below minimum so not considered",
  () => {
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
  },
);

Deno.test(
  "consensus - (the 'farmers market poll') statement with 16 agrees, 2 disagrees, 6 passes qualifies as high consensus",
  () => {
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
  },
);


// ***** CONSENSUS PERCENTAGE BOUNDARY *****
Deno.test(
  "consensus - 70% agreement (at threshold): not high consensus",
  () => {
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
  },
);

Deno.test(
  "consensus - 71% agreement (above threshold): high consensus",
  () => {
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
  },
);

Deno.test(
  "consensus - 70% disagreement (at threshold): not high consensus",
  () => {
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
  },
);

Deno.test(
  "consensus - 71% disagreement (above threshold): high consensus",
  () => {
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
  },
);

Deno.test(
  "consensus - all superAgrees, no agrees: high consensus",
  () => {
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
  },
);

Deno.test(
  "consensus - large vote count, 70.1% agrees (just above threshold): high consensus",
  () => {
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
  },
);


// ***** SPICINESS PERCENTAGE BOUNDARY *****
Deno.test(
  "spiciness - 40% agreement (at lower boundary): not spicy",
  () => {
    const statements = [
      {
        id: "stmt1",
        superAgrees: 0,
        agrees: 40,
        disagrees: 60,
        passes: 0,
      },
    ] as Statement[];

    const spicinessData = calcSpiciness(statements);
    assertEquals(spicinessData.lowConsensusPostCount, 0);
    assertEquals(spicinessData.spiciness, 0.0);
  },
);

Deno.test(
  "spiciness - 41% agreement (just above lower threshold): spicy",
  () => {
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
  },
);

Deno.test(
  "spiciness - 59% agreement (just below upper boundary): spicy",
  () => {
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
  },
);

Deno.test(
  "spiciness - 60% agreement (at upper boundary): not spicy",
  () => {
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
  },
);


// ***** MULTIPLE STATEMENT SCENARIOS *****
Deno.test(
  "consensus - all statements 100% consensus: 100% high consensus, 0% spiciness",
  () => {
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
  },
);

Deno.test(
  "consensus - 2/3 statements have high consensus, one is spicy",
  () => {
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
  }
);

Deno.test(
  "consensus - 33% statements have high consensus, 67% are spicy",
  () => {
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
        superAgrees: 2,
        agrees: 3,
        disagrees: 5,
        passes: 0,
        // 5/10 agrees = 50%, spicy
      }
    ] as Statement[];

    const consensusData = calcConsensus(statements);
    assertEquals(consensusData.highConsensusPostCount, 1);
    assertEquals(consensusData.consensus, 1.0);

    const spicinessData = calcSpiciness(statements);
    assertEquals(spicinessData.lowConsensusPostCount, 2);
    assertEquals(spicinessData.spiciness, 1.0);
  }
);

Deno.test(
  "spiciness - 10% spicy statements results in 0.4 normalized spiciness",
  () => {
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
  }
);

Deno.test(
  "consensus - 1/4 statements has enough opinionated votes, reaches 100% normalized consensus",
  () => {
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
  },
);

Deno.test(
  "consensus - 2 statements with not enough votes are not considered",
  () => {
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
  },
);

Deno.test(
  "consensus - 2/4 statements high consensus: reaches 100% normalized consensus",
  () => {
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
  },
);