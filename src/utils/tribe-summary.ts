import _ from "lodash";
import type { DeckOrder, VoteRates, VoteType } from "../types";

type Side = "agree" | "disagree";

export interface TribeSummary {
  clusterIndex: number;
  sidedWithCount: number;
  votedCount: number;
  crossover: { statementId: string; clusterIndex: number } | null;
}

function sideOfVote(vote: VoteType): Side | null {
  if (vote === "agree" || vote === "super_agree") return "agree";
  if (vote === "disagree") return "disagree";
  return null;
}

function majoritySide(rates: VoteRates): Side {
  return rates[0] >= rates[1] ? "agree" : "disagree";
}

function sideRate(rates: VoteRates, side: Side): number {
  return side === "agree" ? rates[0] : rates[1];
}

export function summarizeTribe(
  deckOrder: DeckOrder,
  userVotes: Record<string, VoteType>,
  clusterProbabilities: number[],
): TribeSummary {
  const clusterIndex = clusterProbabilities.indexOf(Math.max(...clusterProbabilities));
  const ownRates = deckOrder.clusters[clusterIndex].voteRates;

  const opinionatedVotes = Object.entries(userVotes)
    .map(([statementId, vote]) => ({ statementId, side: sideOfVote(vote) }))
    .filter((v): v is { statementId: string; side: Side } => v.side !== null && !!ownRates[v.statementId]);

  const sidedWithCount = opinionatedVotes.filter(
    ({ statementId, side }) => majoritySide(ownRates[statementId]) === side,
  ).length;

  const crossoverCandidates = opinionatedVotes
    .filter(({ statementId, side }) => majoritySide(ownRates[statementId]) !== side)
    .flatMap(({ statementId, side }) =>
      deckOrder.clusters
        .map((cluster, i) => ({ statementId, clusterIndex: i, rates: cluster.voteRates[statementId] }))
        .filter((c) => c.clusterIndex !== clusterIndex && c.rates && majoritySide(c.rates) === side)
        .map((c) => ({ statementId, clusterIndex: c.clusterIndex, strength: sideRate(c.rates, side) })),
    );
  const strongest = _.maxBy(crossoverCandidates, "strength");

  return {
    clusterIndex,
    sidedWithCount,
    votedCount: _.size(userVotes),
    crossover: strongest ? { statementId: strongest.statementId, clusterIndex: strongest.clusterIndex } : null,
  };
}
