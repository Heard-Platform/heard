import type { StatementVotes } from "./analysis-utils.tsx";
import type { Statement } from "./types.tsx";

export function getTotalVoteCount(statement: Statement): number {
  return (
    statement.agrees +
    statement.superAgrees +
    statement.disagrees +
    statement.passes
  );
}

// Unsigned agreement strength in [0, 100]: 100 = unanimous (either way),
// 0 = perfect split. Pass votes are ignored. Used by serializeStatement
// for analysis output.
export function getConsensusScore(statement: Statement): number {
  const agreeCount = statement.agrees + statement.superAgrees;
  const opinionatedVotes = agreeCount + statement.disagrees;
  if (opinionatedVotes === 0) return 0;
  return (Math.abs(agreeCount - statement.disagrees) / opinionatedVotes) * 100;
}

export function serializeStatement(statement: Statement): StatementVotes {
  return {
    id: statement.id,
    text: statement.text,
    agreeVotes: statement.agrees + statement.superAgrees,
    rawAgreeVotes: statement.agrees,
    superAgreeVotes: statement.superAgrees,
    disagreeVotes: statement.disagrees,
    passVotes: statement.passes,
    consensusScore: getConsensusScore(statement),
    totalVotes: getTotalVoteCount(statement),
    mergedFrom: statement.mergedFrom ?? [],
    clusterVotes: [],
  };
}

// Signed, vote-weighted consensus: positive = mostly agreed, negative = mostly
// disagreed. log(1 + total) dampens raw vote count so a 30-0 statement beats a
// 3-0 one without letting volume completely drown out the lean.
export function getWeightedConsensusScore(statement: Statement): number {
  const total = getTotalVoteCount(statement);
  if (total === 0) return 0;
  const agreeShare = (statement.agrees + statement.superAgrees) / total;
  const disagreeShare = statement.disagrees / total;
  return Math.log(1 + total) * (agreeShare - disagreeShare);
}

// How "split" a statement is, weighted by engagement. High when agree share
// and disagree share are close *and* a lot of people voted.
export function getSplitScore(statement: Statement): number {
  const total = getTotalVoteCount(statement);
  if (total === 0) return 0;
  const agreeShare = (statement.agrees + statement.superAgrees) / total;
  const disagreeShare = statement.disagrees / total;
  return (
    Math.log(1 + total) * (1 - Math.abs(agreeShare - disagreeShare))
  );
}

export interface RankedStatements {
  topStatements: Statement[];
  mostDisagreed: Statement | null;
  mostSplit: Statement | null;
}

const MIN_VOTES_FOR_HIGHLIGHT = 2;

export function rankStatements(
  statements: Statement[],
  topN: number,
): RankedStatements {
  const eligible = statements.filter(
    (s) => getTotalVoteCount(s) >= MIN_VOTES_FOR_HIGHLIGHT,
  );

  const topStatements = [...eligible]
    .sort((a, b) => getWeightedConsensusScore(b) - getWeightedConsensusScore(a))
    .slice(0, topN);

  const topIds = new Set(topStatements.map((s) => s.id));

  const mostDisagreedCandidate = [...eligible].sort(
    (a, b) => getWeightedConsensusScore(a) - getWeightedConsensusScore(b),
  )[0];
  const mostDisagreed =
    mostDisagreedCandidate && getWeightedConsensusScore(mostDisagreedCandidate) < 0
      ? mostDisagreedCandidate
      : null;

  const excludeFromSplit = new Set(topIds);
  if (mostDisagreed) excludeFromSplit.add(mostDisagreed.id);
  const mostSplit =
    [...eligible.filter((s) => !excludeFromSplit.has(s.id))].sort(
      (a, b) => getSplitScore(b) - getSplitScore(a),
    )[0] ?? null;

  return { topStatements, mostDisagreed, mostSplit };
}
