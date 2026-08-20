import { calcDemographicBreakdown } from "./demographics-utils.ts";
import { DemographicAnswer, DemographicQuestion, Statement } from "./types.tsx";
import { serializeStatement } from "./statement-utils.tsx";
import { ClusterVoteBreakdown } from "./cluster-analysis.tsx";

export interface StatementVotes {
  id: string;
  text: string;
  agreeVotes: number;
  rawAgreeVotes: number;
  superAgreeVotes: number;
  disagreeVotes: number;
  passVotes: number;
  consensusScore: number;
  totalVotes: number;
  mergedFrom: Array<{ id: string; text: string }>;
  clusterVotes: ClusterVoteBreakdown[];
}

export type DemographicBreakdown = Record<
  string,
  { [option: string]: number }
>;

export interface AnalysisMetrics {
  totalParticipants: number;
  totalPosters: number;
  totalVoters: number;
  totalVotes: number;
  demographics: DemographicBreakdown;
  participation: number;
  topAgreedPosts: StatementVotes[];
  topDisagreedPosts: StatementVotes[];
  spiciestPosts: StatementVotes[];
  allStatements: StatementVotes[];
}

export function calcStatementMetrics(statement: Statement) {
  const totalAgreeVoteCount = statement.agrees + statement.superAgrees;
  const totalDisagreeVoteCount = statement.disagrees;
  const totalOpinionatedVoteCount = statement.agrees + statement.superAgrees + statement.disagrees;
  const totalVoteCount = statement.agrees + statement.superAgrees + statement.disagrees + statement.passes;
  const opinionatedRate = totalOpinionatedVoteCount / totalVoteCount;
  const agreePercentage = totalAgreeVoteCount / totalOpinionatedVoteCount;
  const disagreePercentage = totalDisagreeVoteCount / totalOpinionatedVoteCount;
  return {
    totalAgreeVoteCount,
    totalDisagreeVoteCount,
    totalOpinionatedVoteCount,
    totalVoteCount,
    opinionatedRate,
    agreePercentage,
    disagreePercentage
  }
}

function statementQualifiesForConsensus(
  statement: Statement
) {
  const MIN_OPINIONATED_VOTES = 3;
  const OPINIONATED_RATE_THRESHOLD = 0.5;

  const statementMetrics = calcStatementMetrics(statement);
  return statementMetrics.totalVoteCount > 0 && 
    statementMetrics.totalOpinionatedVoteCount >= MIN_OPINIONATED_VOTES && 
    statementMetrics.opinionatedRate >= OPINIONATED_RATE_THRESHOLD;
}

function statementIsLowConsensus(
  statement: Statement
) {
  const LOW_CONSENSUS_PERCENTAGE_LOWER_BOUND = 0.4;
  const LOW_CONSENSUS_PERCENTAGE_UPPER_BOUND = 0.6;

  const statementMetrics = calcStatementMetrics(statement);
  return statementMetrics.agreePercentage > LOW_CONSENSUS_PERCENTAGE_LOWER_BOUND && 
    statementMetrics.agreePercentage < LOW_CONSENSUS_PERCENTAGE_UPPER_BOUND;
}

function getLowConsensusStatements(
  statements: Statement[]
) {
  return statements.filter((statement) =>
    statementQualifiesForConsensus(statement) &&
      statementIsLowConsensus(statement)
  );
}

export function calculateAnalysisMetrics(
  statements: Statement[],
  questions: DemographicQuestion[],
  answers: DemographicAnswer[],
): AnalysisMetrics {
  const uniqueParticipants = new Set<string>();
  const uniquePosters = new Set<string>();
  const uniqueVoters = new Set<string>();
  let totalVotes = 0;

  statements.forEach((statement) => {
    uniqueParticipants.add(statement.author);
    uniquePosters.add(statement.author);
    if (statement.voters) {
      Object.keys(statement.voters).forEach((userId) => {
        uniqueParticipants.add(userId);
        uniqueVoters.add(userId);
      });
    }
    totalVotes +=
      statement.agrees +
      statement.disagrees +
      statement.passes;
  });

  const demographics = calcDemographicBreakdown(questions, answers);

  const participation = uniqueVoters.size > 0
    ? Math.min(uniquePosters.size / uniqueVoters.size, 1)
    : 0;

  const serialized = statements.map(serializeStatement);

  const opinionatedVotesOf = (s: StatementVotes) => s.agreeVotes + s.disagreeVotes;
  const agreementRateOf = (s: StatementVotes) => {
    const opinionated = opinionatedVotesOf(s);
    return opinionated > 0 ? s.agreeVotes / opinionated : 0;
  };
  const disagreementRateOf = (s: StatementVotes) => {
    const opinionated = opinionatedVotesOf(s);
    return opinionated > 0 ? s.disagreeVotes / opinionated : 0;
  };

  const topAgreedPosts = serialized
    .filter((s) => s.agreeVotes > s.disagreeVotes)
    .sort((a, b) => {
      const rateDiff = agreementRateOf(b) - agreementRateOf(a);
      return rateDiff !== 0 ? rateDiff : b.totalVotes - a.totalVotes;
    })
    .slice(0, 3);

  const topDisagreedPosts = serialized
    .filter((s) => s.disagreeVotes > s.agreeVotes)
    .sort((a, b) => {
      const rateDiff = disagreementRateOf(b) - disagreementRateOf(a);
      return rateDiff !== 0 ? rateDiff : b.totalVotes - a.totalVotes;
    })
    .slice(0, 3);

  const lowConsensusStatements = getLowConsensusStatements(statements);
  const spiciestPosts = lowConsensusStatements
    .map(serializeStatement)
    .sort((a, b) => {
      if (a.consensusScore !== b.consensusScore) {
        return a.consensusScore - b.consensusScore;
      }
      return b.totalVotes - a.totalVotes;
    })
    .slice(0, 3);

  const allStatements = serialized;

  return {
    totalParticipants: uniqueParticipants.size,
    totalPosters: uniquePosters.size,
    totalVoters: uniqueVoters.size,
    totalVotes,
    demographics,
    participation,
    topAgreedPosts,
    topDisagreedPosts,
    spiciestPosts,
    allStatements,
  };
}

export function getStatementVoterIds(statements: Statement[]): string[] {
  const votingUserIds = new Set<string>();
  for (const stmt of statements) {
    if (stmt.voters) {
      for (const userId of Object.keys(stmt.voters)) {
        votingUserIds.add(userId);
      }
    }
  }
  return Array.from(votingUserIds);
}