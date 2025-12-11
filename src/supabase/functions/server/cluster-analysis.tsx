import { Statement } from "./types.tsx";
import { ClusterAssignment } from "./clustering.tsx";

interface ClusterMetadata {
  totalClusters: number;
  clusterSizes: Record<number, number>;
}

interface ClusterConsensusStatement {
  id: string;
  text: string;
  agreeVotes: number;
  totalVotes: number;
  consensusScore: number;
}

export interface ClusterConsensus {
  totalClusters: number;
  clusterSizes: Record<number, number>;
  statementsByCluster: Record<number, ClusterConsensusStatement[]>;
}

export function calculateClusterConsensus(
  statements: Statement[],
  clusterMetadata: ClusterMetadata,
  assignments: (ClusterAssignment | null)[],
  participants: string[],
): ClusterConsensus {
  const userClusterMap = new Map<string, number>();
  participants.forEach((userId, idx) => {
    const assignment = assignments[idx];
    if (assignment) {
      userClusterMap.set(userId, assignment.clusterId);
    }
  });

  const usersByCluster: Record<number, string[]> = {};
  for (let i = 0; i < clusterMetadata.totalClusters; i++) {
    usersByCluster[i] = [];
  }
  userClusterMap.forEach((clusterId, userId) => {
    usersByCluster[clusterId].push(userId);
  });

  const statementsByCluster: Record<number, ClusterConsensusStatement[]> = {};

  for (let clusterId = 0; clusterId < clusterMetadata.totalClusters; clusterId++) {
    const usersInCluster = usersByCluster[clusterId];
    const clusterStatements: ClusterConsensusStatement[] = [];

    statements.forEach((statement) => {
      let agreeCount = 0;
      let totalVoteCount = 0;

      for (const userId of usersInCluster) {
        const voteType = statement.voters?.[userId];
        if (voteType) {
          totalVoteCount++;
          if (voteType === "agree" || voteType === "super_agree") {
            agreeCount++;
          }
        }
      }

      const consensusScore = totalVoteCount > 0 ? (agreeCount / totalVoteCount) * 100 : 0;
      clusterStatements.push({
        id: statement.id,
        text: statement.text,
        agreeVotes: agreeCount,
        totalVotes: totalVoteCount,
        consensusScore,
      });
    });

    clusterStatements.sort((a, b) => {
      if (b.consensusScore !== a.consensusScore) {
        return b.consensusScore - a.consensusScore;
      }
      return b.totalVotes - a.totalVotes;
    });
    statementsByCluster[clusterId] = clusterStatements.slice(0, 3);
  }

  return {
    totalClusters: clusterMetadata.totalClusters,
    clusterSizes: clusterMetadata.clusterSizes,
    statementsByCluster,
  };
}