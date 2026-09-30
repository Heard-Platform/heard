import _ from "lodash";
import { DeckOrder, VoteRates, VoteType } from "../types";

export const VOTE_INFLUENCE = 0.5;
export const CONFIDENT_CLUSTER_PROBABILITY = 0.85;
export const MAX_ADAPTIVE_VOTES = 8;

const VOTE_TYPE_INDEXES: number[] = [0, 1, 2];

function voteTypeIndex(vote: VoteType): number {
  if (vote === "agree" || vote === "super_agree") return 0;
  if (vote === "disagree") return 1;
  return 2;
}

function normalize(logWeights: number[]): number[] {
  const max = Math.max(...logWeights);
  const weights = logWeights.map((w) => Math.exp(w - max));
  const total = _.sum(weights);
  return weights.map((w) => w / total);
}

function uncertainty(probabilities: number[]): number {
  return -_.sumBy(probabilities, (p) => (p > 0 ? p * Math.log(p) : 0));
}

export function estimateClusterProbabilities(
  deckOrder: DeckOrder,
  userVotes: Record<string, VoteType>,
): number[] {
  const totalSize = _.sumBy(deckOrder.clusters, "size");
  const logWeights = deckOrder.clusters.map((cluster) => {
    const voteEvidence = _.sumBy(Object.entries(userVotes), ([statementId, vote]) => {
      const rates = cluster.voteRates[statementId];
      return rates ? VOTE_INFLUENCE * Math.log(rates[voteTypeIndex(vote)]) : 0;
    });
    return Math.log(cluster.size / totalSize) + voteEvidence;
  });
  return normalize(logWeights);
}

export function calcVoteInfoValue(
  deckOrder: DeckOrder,
  currentClusterProbs: number[],
  statementId: string,
): number {
  const clusterVoteRates: (VoteRates | undefined)[] = deckOrder.clusters.map((c) => c.voteRates[statementId]);
  if (clusterVoteRates.includes(undefined)) return 0;

  const currentUncertainty = uncertainty(currentClusterProbs);
  const expectedUncertaintyAfterVote = _.sumBy(VOTE_TYPE_INDEXES, (vote) => {
    const voteProbability = _.sum(currentClusterProbs.map((p, i) => p * clusterVoteRates[i]![vote]));
    const clusterProbsAfterVote = normalize(
      currentClusterProbs.map((p, i) => Math.log(p) + VOTE_INFLUENCE * Math.log(clusterVoteRates[i]![vote])),
    );
    return voteProbability * uncertainty(clusterProbsAfterVote);
  });

  return currentUncertainty - expectedUncertaintyAfterVote;
}

export function isStillPlacing(clusterProbabilities: number[], votesCast: number): boolean {
  return votesCast < MAX_ADAPTIVE_VOTES && Math.max(...clusterProbabilities) < CONFIDENT_CLUSTER_PROBABILITY;
}
