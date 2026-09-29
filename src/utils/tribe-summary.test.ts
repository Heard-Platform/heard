import { describe, expect, it } from "vitest";
import type { DeckOrder, VoteRates } from "../types";
import { summarizeTribe } from "./tribe-summary";

const MOSTLY_AGREES: VoteRates = [0.85, 0.1, 0.05];
const MOSTLY_DISAGREES: VoteRates = [0.1, 0.85, 0.05];
const LEANS_AGREE: VoteRates = [0.6, 0.35, 0.05];

const deckOrder: DeckOrder = {
  leadStatementIds: [],
  consensusStatementId: null,
  longStatementIds: [],
  clusters: [
    { stableId: "fast", size: 40, voteRates: { s1: MOSTLY_AGREES, s2: MOSTLY_AGREES, s3: MOSTLY_DISAGREES, s4: MOSTLY_AGREES } },
    { stableId: "brakes", size: 30, voteRates: { s1: MOSTLY_DISAGREES, s2: MOSTLY_DISAGREES, s3: MOSTLY_AGREES, s4: MOSTLY_DISAGREES } },
    { stableId: "data", size: 20, voteRates: { s1: MOSTLY_DISAGREES, s2: MOSTLY_AGREES, s3: LEANS_AGREE, s4: MOSTLY_AGREES } },
  ],
};

describe("summarizeTribe", () => {
  it("picks the most likely cluster as the user's tribe", () => {
    expect(summarizeTribe(deckOrder, { s1: "agree" }, [0.2, 0.7, 0.1]).clusterIndex).toBe(1);
  });

  it("counts the votes that match the tribe's majority, out of all votes", () => {
    const summary = summarizeTribe(
      deckOrder,
      { s1: "agree", s2: "super_agree", s3: "agree", s4: "pass" },
      [0.8, 0.1, 0.1],
    );
    expect(summary.sidedWithCount).toBe(2);
    expect(summary.votedCount).toBe(4);
  });

  it("finds where the user crossed over, picking the group that backed them most strongly", () => {
    const summary = summarizeTribe(deckOrder, { s1: "agree", s3: "agree" }, [0.8, 0.1, 0.1]);
    expect(summary.crossover).toEqual({ statementId: "s3", clusterIndex: 1 });
  });

  it("has no crossover when the user always voted with their tribe", () => {
    const summary = summarizeTribe(deckOrder, { s1: "agree", s3: "disagree" }, [0.8, 0.1, 0.1]);
    expect(summary.crossover).toBeNull();
  });
});
