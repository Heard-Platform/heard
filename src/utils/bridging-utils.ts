import { ClusterVoteBreakdown, StatementVotes } from "../types";

export interface BridgingStatement {
  statement: StatementVotes;
  clusterAId: number;
  clusterBId: number;
  bridgeScore: number;
}

const MAX_OVERALL_CONSENSUS = 60;
const MIN_BRIDGE_SCORE = 60;
const MIN_OPINIONATED_VOTES_PER_CLUSTER = 2;

function statementClusterPairAgreement(
  clusterA: ClusterVoteBreakdown,
  clusterB: ClusterVoteBreakdown,
): number {
  const agreeCount = clusterA.agreeVotes + clusterB.agreeVotes;
  const disagreeCount = clusterA.disagreeVotes + clusterB.disagreeVotes;
  const opinionatedVotes = agreeCount + disagreeCount;
  if (opinionatedVotes === 0) return 0;
  return ((agreeCount - disagreeCount) / opinionatedVotes) * 100;
}

function hasOpinion(cv: ClusterVoteBreakdown): boolean {
  return cv.agreeVotes + cv.disagreeVotes >= MIN_OPINIONATED_VOTES_PER_CLUSTER;
}

function bestBridgeForStatement(statement: StatementVotes): BridgingStatement | null {
  const clusterVotes = statement.clusterVotes.filter(hasOpinion);
  let best: BridgingStatement | null = null;

  for (let i = 0; i < clusterVotes.length; i++) {
    for (let j = i + 1; j < clusterVotes.length; j++) {
      const bridgeScore = statementClusterPairAgreement(clusterVotes[i], clusterVotes[j]);
      if (!best || bridgeScore > best.bridgeScore) {
        best = {
          statement,
          clusterAId: clusterVotes[i].clusterId,
          clusterBId: clusterVotes[j].clusterId,
          bridgeScore,
        };
      }
    }
  }

  return best;
}

export function getTopBridgingStatements(
  statements: StatementVotes[],
  limit: number = 3,
): BridgingStatement[] {
  return statements
    .filter((s) => s.consensusScore <= MAX_OVERALL_CONSENSUS)
    .map(bestBridgeForStatement)
    .filter((b): b is BridgingStatement => b !== null && b.bridgeScore >= MIN_BRIDGE_SCORE)
    .sort((a, b) => b.bridgeScore - a.bridgeScore)
    .slice(0, limit);
}
