import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Statement } from "./types.tsx";
import { calcConsensus } from "./analysis-utils.tsx";

Deno.test(
  "consensus - all statements agree",
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
    assertEquals(consensusData.consensus, 1);
  },
);

Deno.test(
  "consensus - 33% statements high consensus",
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
        superAgrees: 3,
        agrees: 2,
        disagrees: 5,
        passes: 0,
      },
      {
        id: "stmt3",
        superAgrees: 7,
        agrees: 3,
        disagrees: 0,
        passes: 0,
      }
    ] as Statement[];

    const consensusData = calcConsensus(statements);
    assertEquals(consensusData.consensus, 1);
  }
);

Deno.test(
  "consensus - near 100% consensus",
  () => {
    const statements = [
      {
        id: "stmt1",
        superAgrees: 2,
        agrees: 6,
        disagrees: 2,
        passes: 0,
      },
      {
        id: "stmt2",
        superAgrees: 1,
        agrees: 2,
        disagrees: 7,
        passes: 0,
      },
      {
        id: "stmt3",
        superAgrees: 3,
        agrees: 4,
        disagrees: 3,
        passes: 0,
      },
      {
        id: "stmt4",
        superAgrees: 0,
        agrees: 1,
        disagrees: 9,
        passes: 0,
      }
    ] as Statement[];

    const consensusData = calcConsensus(statements);
    assertEquals(consensusData.consensus, 0.8333333333333334);
  },
);

Deno.test(
  "consensus - no statements",
  () => {
    const statements = [] as Statement[];
    const consensusData = calcConsensus(statements);
    assertEquals(consensusData.consensus, 0);
  },
);