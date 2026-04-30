import { StatementVotes as StatementVotes } from "./analysis-utils.tsx";
import { Statement } from "./types.tsx";

export const normalizeCommunityName = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, "-");

export const generateId = () =>
  Math.random().toString(36).substring(2) +
  Date.now().toString(36);

export const getFrontendUrl = (): string => {
  return (
    Deno.env.get("FRONTEND_URL") || "https://heard.vote"
  );
};

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getTotalVoteCount(statement: Statement) {
  return statement.agrees +
    statement.superAgrees +
    statement.disagrees +
    statement.passes;
}

export function getConsensusScore(statement: Statement) {
  const agreeCount = statement.agrees + statement.superAgrees;
  const opinionatedVotes = agreeCount + statement.disagrees;
  if (opinionatedVotes === 0) return 0;
  return (Math.abs(agreeCount - statement.disagrees) / opinionatedVotes) * 100;
}

export function serializeStatement(statement: Statement): StatementVotes {
  const totalVoteCount = getTotalVoteCount(statement);
  const consensusScore = getConsensusScore(statement);

  return {
    id: statement.id,
    text: statement.text,
    agreeVotes: statement.agrees + statement.superAgrees,
    rawAgreeVotes: statement.agrees,
    superAgreeVotes: statement.superAgrees,
    disagreeVotes: statement.disagrees,
    passVotes: statement.passes,
    consensusScore,
    totalVotes: totalVoteCount,
    mergedFrom: statement.mergedFrom ?? [],
    clusterVotes: [],
  };
}