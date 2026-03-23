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

export interface Cluster {
  id: number;
  size: number;
  statements: ClusterConsensusStatement[];
}

export interface ClusterConsensus {
  totalClusters: number;
  clusters: Cluster[];
}

export function calcConsensusScore(agreeCount: number, disagreeCount: number): number {
  const opinionatedVoteCount = agreeCount + disagreeCount;
  const diff = Math.abs(agreeCount - disagreeCount);
  const consensusScore = opinionatedVoteCount
    ? (diff * Math.log(opinionatedVoteCount)) / opinionatedVoteCount
    : 0;
  console.log(`agreeCount=${agreeCount}, disagreeCount=${disagreeCount}, totalVoteCount=${opinionatedVoteCount}, consensusScore=${consensusScore.toFixed(2)}`);
  return consensusScore;
}

export function calcBestClusterStatements(statements: Statement[], usersInCluster: string[]) {
  const clusterStatements: ClusterConsensusStatement[] = [];

  statements.forEach((statement) => {
    let agreeCount = 0;
    let disagreeCount = 0;
    let totalVoteCount = 0;

    for (const userId of usersInCluster) {
      const voteType = statement.voters?.[userId];
      if (voteType) {
        totalVoteCount++;
        if (
          voteType === "agree" ||
          voteType === "super_agree"
        ) {
          agreeCount++;
        } else if (voteType === "disagree") {
          disagreeCount++;
        }
      }
    }

    const consensusScore = calcConsensusScore(agreeCount, disagreeCount);

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

  return clusterStatements;
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

  const clusters: Cluster[] = [];

  for (
    let clusterId = 0;
    clusterId < clusterMetadata.totalClusters;
    clusterId++
  ) {
    const usersInCluster = usersByCluster[clusterId];

    const clusterStatements = calcBestClusterStatements(statements, usersInCluster);

    clusters.push({
      id: clusterId,
      size: usersInCluster.length,
      statements: clusterStatements.slice(0, 3),
    });
  }

  clusters.sort((a, b) => b.size - a.size);

  clusters.forEach((cluster, idx) => {
    cluster.id = idx;
  });

  return {
    totalClusters: clusterMetadata.totalClusters,
    clusters,
  };
}