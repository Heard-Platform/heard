import { Statement } from "./types.tsx";
import { serializeStatement } from "./utils.tsx";

export interface TopPost {
  id: string;
  text: string;
  agreeVotes: number;
  disagreeVotes: number;
  passVotes: number;
  consensusScore: number;
  totalVotes: number;
}

export interface AnalysisMetrics {
  totalParticipants: number;
  totalPosters: number;
  totalVoters: number;
  totalVotes: number;
  participation: number;
  consensusData: {
    highConsensusPostCount: number;
    consensus: number;
  };
  spicinessData: {
    lowConsensusPostCount: number;
    spiciness: number;
  };
  reachData: {
    postersWithHighConsensusPost: number;
    reach: number;
  };
  topPosts: TopPost[];
  spiciestPosts: TopPost[];
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

function statementIsHighConsensus(
  statement: Statement
) {
  const HIGH_CONSENSUS_PERCENTAGE_THRESHOLD = 0.7;

  const statementMetrics = calcStatementMetrics(statement);
  return statementMetrics.agreePercentage > HIGH_CONSENSUS_PERCENTAGE_THRESHOLD || 
    statementMetrics.disagreePercentage > HIGH_CONSENSUS_PERCENTAGE_THRESHOLD;
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

function getHighConsensusStatements(
  statements: Statement[]
) {
  return statements.filter((statement) => 
    statementQualifiesForConsensus(statement) && 
      statementIsHighConsensus(statement)
  );
}

function getLowConsensusStatements(
  statements: Statement[]
) {
  return statements.filter((statement) =>
    statementQualifiesForConsensus(statement) && 
      statementIsLowConsensus(statement)
  );
}

export function calcConsensus(
  statements: Statement[],
) {
  const highConsensusStatements = getHighConsensusStatements(statements);
  const highConsensusPostCount = highConsensusStatements.length;

  const consensusPercentage = statements.length > 0
    ? (highConsensusPostCount / statements.length)
    : 0;

  const CONSENSUS_THRESHOLD = 0.25;
  const normalizedConsensus = Math.min(consensusPercentage * 1 / CONSENSUS_THRESHOLD, 1);

  return {
    highConsensusPostCount,
    consensus: normalizedConsensus,
  }
}

export function calcSpiciness(
  statements: Statement[],
) {
  
  const lowConsensusStatements = getLowConsensusStatements(statements);
  const lowConsensusPostCount = lowConsensusStatements.length;

  const spicinessPercentage = statements.length > 0
    ? (lowConsensusPostCount / statements.length)
    : 0;

  const SPICY_THRESHOLD = 0.25;
  const normalizedSpiciness = Math.min(spicinessPercentage * 1 / SPICY_THRESHOLD, 1);

  return {
    lowConsensusPostCount,
    spiciness: normalizedSpiciness,
  }
}

export function calculateAnalysisMetrics(
  statements: Statement[]
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

  const participation = uniqueVoters.size > 0
    ? Math.min(uniquePosters.size / uniqueVoters.size, 1)
    : 0;

  const consensusData = calcConsensus(statements);
  const spicinessData = calcSpiciness(statements);

  const topPosts = statements
    .map(serializeStatement)
    .sort((a, b) => {
      if (b.consensusScore !== a.consensusScore) {
        return b.consensusScore - a.consensusScore;
      }
      return b.totalVotes - a.totalVotes;
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

  const highConsensusStatements = getHighConsensusStatements(statements);
  const postersWithHighConsensusPost = new Set(
    highConsensusStatements.map((statement) => statement.author)
  );

  const reach = uniquePosters.size > 0
    ? Math.min(postersWithHighConsensusPost.size / uniquePosters.size, 1)
    : 0;

  return {
    totalParticipants: uniqueParticipants.size,
    totalPosters: uniquePosters.size,
    totalVoters: uniqueVoters.size,
    totalVotes,
    participation,
    consensusData,
    spicinessData,
    reachData: {
      postersWithHighConsensusPost: postersWithHighConsensusPost.size,
      reach,
    },
    topPosts,
    spiciestPosts,
  };
}