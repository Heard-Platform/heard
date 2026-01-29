import { Statement } from "./types.tsx";
import { getTotalAgreeVoteCount, getTotalOpinionatedVoteCount, getTotalVoteCount, serializeStatement } from "./utils.tsx";

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

function statementQualifiesForConsensus(statement: Statement) {
  const opinionatedVoteCount = getTotalOpinionatedVoteCount(statement);
  const totalVoteCount = getTotalVoteCount(statement);
  const opinionatedRate = opinionatedVoteCount / totalVoteCount;
  const MIN_VOTES = 3;

  return totalVoteCount > 0 && 
    opinionatedVoteCount >= MIN_VOTES && 
    opinionatedRate >= 0.5;
}

function statementIsHighConsensus(statement: Statement) {
  const agreeCount = getTotalAgreeVoteCount(statement);
  const disagreeCount = statement.disagrees;
  const opinionatedVoteCount = getTotalOpinionatedVoteCount(statement);
  const agreePercentage = agreeCount / opinionatedVoteCount;
  const disagreePercentage = disagreeCount / opinionatedVoteCount;
  
  return agreePercentage > 0.7 || disagreePercentage > 0.7;
}

function statementIsLowConsensus(statement: Statement) {
  const agreeCount = getTotalAgreeVoteCount(statement);
  const opinionatedVoteCount = getTotalOpinionatedVoteCount(statement);
  const agreePercentage = agreeCount / opinionatedVoteCount;
  
  return agreePercentage > 0.4 && agreePercentage < 0.6;
}

// a "high consensus" statement has a majority of agrees or disagrees
function getHighConsensusStatements(statements: Statement[]) {
  return statements.filter((statement) => 
    statementQualifiesForConsensus(statement) && statementIsHighConsensus(statement)
  );
}

// a "low consensus" statement is one where agrees almost equal disagrees
function getLowConsensusStatements(statements: Statement[]) {
  return statements.filter((statement) =>
    statementQualifiesForConsensus(statement) && statementIsLowConsensus(statement)
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

  // normalize consensus - any consensusPercentage at or above 25% will normalize to a 100% normalizedConsensus
  const normalizedConsensus = Math.min(consensusPercentage * 1 / 0.25, 1);

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

  // normalize the spiciness - any raw spicinessPercentage above 25% will normalize to a 100% normalizedSpiciness
  const normalizedSpiciness = Math.min(spicinessPercentage * 1 / 0.25, 1);

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