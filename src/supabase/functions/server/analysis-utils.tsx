import { Statement } from "./types.tsx";

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
  topPosts: TopPost[];
}

export function calcConsensus(
  statements: Statement[],
) {
  let highConsensusPostCount = 0;
  
  statements.forEach((statement) => {
    const agreeCount = 
      statement.agrees + 
      statement.superAgrees;

    const totalVoteCount =
      agreeCount +
      statement.disagrees +
      statement.passes;
    
    if (totalVoteCount > 0) {
      const agreePercentage = agreeCount / totalVoteCount;
      if (agreePercentage > 0.7) {
        highConsensusPostCount++;
      }
    }
  });

  const consensusPercentage = statements.length > 0
    ? (highConsensusPostCount / statements.length)
    : 0;

  const normalizedConsensus = Math.min(consensusPercentage * 1/0.3, 1);

  return {
    highConsensusPostCount,
    consensus: normalizedConsensus,
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

  const topPosts = statements
    .map((statement) => {
      const totalVoteCount =
        statement.agrees +
        statement.superAgrees +
        statement.disagrees +
        statement.passes;
      const consensusScore =
        totalVoteCount > 0
          ? ((statement.agrees + statement.superAgrees) /
              totalVoteCount) *
            100
          : 0;

      return {
        id: statement.id,
        text: statement.text,
        agreeVotes:
          statement.agrees + statement.superAgrees,
        disagreeVotes: statement.disagrees,
        passVotes: statement.passes,
        consensusScore,
        totalVotes: totalVoteCount,
      };
    })
    .sort((a, b) => {
      if (b.consensusScore !== a.consensusScore) {
        return b.consensusScore - a.consensusScore;
      }
      return b.totalVotes - a.totalVotes;
    })
    .slice(0, 3);

  return {
    totalParticipants: uniqueParticipants.size,
    totalPosters: uniquePosters.size,
    totalVoters: uniqueVoters.size,
    totalVotes,
    participation,
    consensusData,
    topPosts,
  };
}