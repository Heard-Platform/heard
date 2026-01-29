import { TopPost } from "./analysis-utils.tsx";
import { Statement } from "./types.tsx";

export const generateId = () =>
  Math.random().toString(36).substring(2) +
  Date.now().toString(36);

export const getFrontendUrl = (): string => {
  return (
    Deno.env.get("FRONTEND_URL") || "https://heard-now.com"
  );
};

export function getStatementMetrics(statement: Statement) {
  const totalAgreeVoteCount = statement.agrees + statement.superAgrees;
  const totalDisagreeVoteCount = statement.disagrees;
  const totalOpinionatedVoteCount = statement.agrees + statement.superAgrees + statement.disagrees;
  const totalVoteCount = statement.agrees + statement.superAgrees + statement.disagrees + statement.passes;
  const opinionatedRate = totalOpinionatedVoteCount / totalVoteCount;
  const agreePercentage = totalAgreeVoteCount / totalOpinionatedVoteCount;
  const disagreePercentage = totalDisagreeVoteCount / totalOpinionatedVoteCount;
  return {
    totalAgreeVoteCount: totalAgreeVoteCount,
    totalDisagreeVoteCount: totalDisagreeVoteCount,
    totalOpinionatedVoteCount: totalOpinionatedVoteCount,
    totalVoteCount: totalVoteCount,
    opinionatedRate: opinionatedRate,
    agreePercentage: agreePercentage,
    disagreePercentage: disagreePercentage
  }
}

export function getTotalAgreeVoteCount(statement: Statement) {
  return statement.agrees + statement.superAgrees;
}

export function getTotalOpinionatedVoteCount(statement: Statement) {
  return statement.agrees + statement.superAgrees + statement.disagrees;
}

export function getTotalVoteCount(statement: Statement) {
  return statement.agrees +
    statement.superAgrees +
    statement.disagrees +
    statement.passes;
}

export function getConsensusScore(statement: Statement) {
  const totalVoteCount = getTotalVoteCount(statement);
  return totalVoteCount > 0
    ? ((statement.agrees + statement.superAgrees) / totalVoteCount) * 100
    : 0;
}

export function serializeStatement(statement: Statement): TopPost {
  const totalVoteCount = getTotalVoteCount(statement);
  const consensusScore = getConsensusScore(statement);

  return {
    id: statement.id,
    text: statement.text,
    agreeVotes: statement.agrees + statement.superAgrees,
    disagreeVotes: statement.disagrees,
    passVotes: statement.passes,
    consensusScore,
    totalVotes: totalVoteCount,
  };
}