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

// a "high consensus" statement has a majority of agrees or disagrees
function getHighConsensusStatements(statements: Statement[]) {
  return statements.filter((statement) => {
    const agreeCount = getTotalAgreeVoteCount(statement);

    // consensus is calculated using only "opinionated" votes, disregarding passes
    const opinionatedVoteCount = getTotalOpinionatedVoteCount(statement);
    const totalVoteCount = getTotalVoteCount(statement);

    if (totalVoteCount === 0) {
      return false;
    }
    // Require at least 50% of voters to have an opinion
    const opinionatedRate = opinionatedVoteCount / totalVoteCount;
    if (opinionatedRate < 0.5) {
      return false; // Too many passes, not engaging enough
    }

    const MIN_VOTES = 3;
    // if there are 3 or more opinionated votes, this statement will be considered for consensus
    if (opinionatedVoteCount >= MIN_VOTES) {
      const agreePercentage = agreeCount / opinionatedVoteCount;
      const disagreePercentage = statement.disagrees / opinionatedVoteCount;
      // console.log(`Agrees: ${agreeCount} - Disagrees: ${statement.disagrees} - Passes: ${statement.passes} - Agree Percentage: ${agreePercentage} - Disagree Percentage: ${disagreePercentage}`);
      // if we have greater than 70% agreement or disagreement, this is a high consensus statement
      return agreePercentage > 0.7 || disagreePercentage > 0.7;
    }
    return false;
  });
}

// a "low consensus" statement is one where agrees almost equal disagrees
function getLowConsensusStatements(statements: Statement[]) {
  return statements.filter((statement) => {
    const agreeCount = getTotalAgreeVoteCount(statement);

    // consensus is calculated disregarding pass votes
    const opinionatedVoteCount = getTotalOpinionatedVoteCount(statement);
    const totalVoteCount = getTotalVoteCount(statement);

    if (totalVoteCount === 0) {
      return false;
    }
    // Require at least 50% of voters to have an opinion
    const opinionatedRate = opinionatedVoteCount / totalVoteCount;
    if (opinionatedRate < 0.5) {
      return false; // Too many passes, not engaging enough
    }

    const MIN_VOTES = 3;
    // if this statement has 3 or more opinionated votes, it will be considered for spiciness
    if (opinionatedVoteCount >= MIN_VOTES) {
      const agreePercentage = agreeCount / opinionatedVoteCount;
      // if this statement has between 40% and 60% agree votes, we call it low consensus or "spicy"
      return agreePercentage > 0.4 && agreePercentage < 0.6;
    }
    return false;
  });
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