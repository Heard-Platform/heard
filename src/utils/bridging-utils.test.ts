import { describe, it, expect } from "vitest";
import { getTopBridgingStatements } from "./bridging-utils";
import type { StatementVotes, ClusterVoteBreakdown } from "../types";

function makeCV(overrides: Partial<ClusterVoteBreakdown>): ClusterVoteBreakdown {
  return {
    clusterId: 0,
    clusterSize: 10,
    agreeVotes: 0,
    superAgreeVotes: 0,
    disagreeVotes: 0,
    passVotes: 0,
    ...overrides,
  };
}

function makeStatement(overrides: Partial<StatementVotes>): StatementVotes {
  return {
    id: "s1",
    text: "some statement",
    agreeVotes: 0,
    rawAgreeVotes: 0,
    superAgreeVotes: 0,
    disagreeVotes: 0,
    passVotes: 0,
    consensusScore: 0,
    totalVotes: 0,
    mergedFrom: [],
    clusterVotes: [],
    ...overrides,
  };
}

describe("getTopBridgingStatements", () => {
  it("surfaces a statement where two clusters agree but a third disagrees, overall split", () => {
    const statement = makeStatement({
      id: "bridge",
      consensusScore: 10,
      clusterVotes: [
        makeCV({ clusterId: 0, agreeVotes: 8, disagreeVotes: 0 }),
        makeCV({ clusterId: 1, agreeVotes: 8, disagreeVotes: 0 }),
        makeCV({ clusterId: 2, agreeVotes: 0, disagreeVotes: 16 }),
      ],
    });

    const result = getTopBridgingStatements([statement]);

    expect(result).toHaveLength(1);
    expect(result[0].statement.id).toBe("bridge");
    expect([result[0].clusterAId, result[0].clusterBId].sort()).toEqual([0, 1]);
    expect(result[0].bridgeScore).toBe(100);
  });

  it("excludes statements with high overall consensus even if a pair aligns", () => {
    const statement = makeStatement({
      id: "already-consensus",
      consensusScore: 90,
      clusterVotes: [
        makeCV({ clusterId: 0, agreeVotes: 9, disagreeVotes: 0 }),
        makeCV({ clusterId: 1, agreeVotes: 9, disagreeVotes: 0 }),
      ],
    });

    expect(getTopBridgingStatements([statement])).toEqual([]);
  });

  it("excludes a pair that jointly disagrees, even though it's unanimous", () => {
    // Cluster 0 and 1 unanimously disagree together, which is unanimous in
    // the unsigned sense but isn't "finding common ground" by agreeing.
    const statement = makeStatement({
      id: "joint-disagreement",
      consensusScore: 10,
      clusterVotes: [
        makeCV({ clusterId: 0, agreeVotes: 0, disagreeVotes: 8 }),
        makeCV({ clusterId: 1, agreeVotes: 0, disagreeVotes: 8 }),
      ],
    });

    expect(getTopBridgingStatements([statement])).toEqual([]);
  });

  it("excludes statements where no pair of clusters actually aligns", () => {
    const statement = makeStatement({
      id: "no-bridge",
      consensusScore: 5,
      clusterVotes: [
        makeCV({ clusterId: 0, agreeVotes: 5, disagreeVotes: 5 }),
        makeCV({ clusterId: 1, agreeVotes: 5, disagreeVotes: 5 }),
      ],
    });

    expect(getTopBridgingStatements([statement])).toEqual([]);
  });

  it("ignores clusters with too few opinionated votes when finding the best pair", () => {
    // Cluster 1 has just one vote, so it looks "unanimous" with anyone by
    // pure noise; it must be excluded so cluster 0 + 2 (higher volume, real
    // alignment) wins instead.
    const statement = makeStatement({
      id: "sparse-cluster",
      consensusScore: 10,
      clusterVotes: [
        makeCV({ clusterId: 0, agreeVotes: 8, disagreeVotes: 2 }),
        makeCV({ clusterId: 1, agreeVotes: 1, disagreeVotes: 0 }),
        makeCV({ clusterId: 2, agreeVotes: 8, disagreeVotes: 2 }),
      ],
    });

    const result = getTopBridgingStatements([statement]);

    expect(result).toHaveLength(1);
    expect([result[0].clusterAId, result[0].clusterBId].sort()).toEqual([0, 2]);
    expect(result[0].bridgeScore).toBe(60);
  });

  it("ranks multiple bridging statements by bridge score descending and respects the limit", () => {
    const strongBridge = makeStatement({
      id: "strong",
      consensusScore: 10,
      clusterVotes: [
        makeCV({ clusterId: 0, agreeVotes: 10, disagreeVotes: 0 }),
        makeCV({ clusterId: 1, agreeVotes: 10, disagreeVotes: 0 }),
      ],
    });
    const weakerBridge = makeStatement({
      id: "weaker",
      consensusScore: 10,
      clusterVotes: [
        makeCV({ clusterId: 0, agreeVotes: 7, disagreeVotes: 3 }),
        makeCV({ clusterId: 1, agreeVotes: 8, disagreeVotes: 2 }),
      ],
    });

    const result = getTopBridgingStatements([weakerBridge, strongBridge], 1);

    expect(result).toHaveLength(1);
    expect(result[0].statement.id).toBe("strong");
  });

  it("returns an empty array when given no statements", () => {
    expect(getTopBridgingStatements([])).toEqual([]);
  });
});
