import { describe, expect, it } from "vitest";
import type { DeckOrder, VoteRates } from "../types";
import {
  estimateClusterProbabilities,
  calcVoteInfoValue,
  isStillPlacing,
} from "./cluster-estimation";

const MOSTLY_AGREES: VoteRates = [0.9, 0.05, 0.05];
const MOSTLY_DISAGREES: VoteRates = [0.05, 0.9, 0.05];

function makeDeckOrder(overrides: Partial<DeckOrder> = {}): DeckOrder {
  return {
    leadStatementIds: [],
    consensusStatementId: null,
    clusters: [
      { stableId: "A", slot: 0, name: null, size: 50, voteRates: { divisive: MOSTLY_AGREES, shared: MOSTLY_AGREES, other: MOSTLY_AGREES } },
      { stableId: "B", slot: 1, name: null, size: 50, voteRates: { divisive: MOSTLY_DISAGREES, shared: MOSTLY_AGREES, other: MOSTLY_DISAGREES } },
    ],
    ...overrides,
  };
}

describe("estimateClusterProbabilities", () => {
  it("returns the size-weighted prior with no votes", () => {
    const deckOrder = makeDeckOrder();
    deckOrder.clusters[0].size = 75;
    deckOrder.clusters[1].size = 25;
    const clusterProbabilities = estimateClusterProbabilities(deckOrder, {});
    expect(clusterProbabilities[0]).toBeCloseTo(0.75);
    expect(clusterProbabilities[1]).toBeCloseTo(0.25);
  });

  it("leans towards the cluster that votes like the user", () => {
    const clusterProbabilities = estimateClusterProbabilities(makeDeckOrder(), { divisive: "agree" });
    expect(clusterProbabilities[0]).toBeGreaterThan(0.7);
  });

  it("is damped so one vote does not produce certainty", () => {
    const clusterProbabilities = estimateClusterProbabilities(makeDeckOrder(), { divisive: "super_agree" });
    expect(clusterProbabilities[0]).toBeLessThan(0.85);
  });

  it("ignores statements missing from the deck order", () => {
    expect(estimateClusterProbabilities(makeDeckOrder(), { unknown: "agree" })).toEqual([0.5, 0.5]);
  });
});

describe("calcVoteInfoValue", () => {
  it("is higher for divisive statements than shared ones", () => {
    const deckOrder = makeDeckOrder();
    const prior = [0.5, 0.5];
    expect(calcVoteInfoValue(deckOrder, prior, "divisive")).toBeGreaterThan(
      calcVoteInfoValue(deckOrder, prior, "shared"),
    );
  });

  it("is zero for statements a cluster has no rates for", () => {
    expect(calcVoteInfoValue(makeDeckOrder(), [0.5, 0.5], "unknown")).toBe(0);
  });
});

describe("isStillPlacing", () => {
  it("stops once confident or after enough votes", () => {
    expect(isStillPlacing([0.6, 0.4], 2)).toBe(true);
    expect(isStillPlacing([0.9, 0.1], 2)).toBe(false);
    expect(isStillPlacing([0.6, 0.4], 8)).toBe(false);
  });
});
