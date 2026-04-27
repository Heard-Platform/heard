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
  disagreeVotes: number;
  totalVotes: number;
  consensusScore: number;
}

export interface Cluster {
  id: number;
  size: number;
  statements: ClusterConsensusStatement[];
}

export interface ClusterVoteBreakdown {
  clusterId: number;
  clusterSize: number;
  agreeVotes: number;
  superAgreeVotes: number;
  disagreeVotes: number;
  passVotes: number;
}

export interface ClusterConsensus {
  totalClusters: number;
  clusters: Cluster[];
  statementBreakdowns: Record<string, ClusterVoteBreakdown[]>;
}

interface ClusterUserGroup {
  clusterId: number;
  size: number;
  users: string[];
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
      disagreeVotes: disagreeCount,
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

export function calcStatementBreakdownForCluster(
  statement: Statement,
  group: ClusterUserGroup,
): ClusterVoteBreakdown {
  let agreeCount = 0;
  let superAgreeCount = 0;
  let disagreeCount = 0;
  let passCount = 0;

  for (const userId of group.users) {
    const voteType = statement.voters?.[userId];
    if (!voteType) continue;
    if (voteType === "super_agree") {
      agreeCount++;
      superAgreeCount++;
    } else if (voteType === "agree") {
      agreeCount++;
    } else if (voteType === "disagree") {
      disagreeCount++;
    } else if (voteType === "pass") {
      passCount++;
    }
  }

  return {
    clusterId: group.clusterId,
    clusterSize: group.size,
    agreeVotes: agreeCount,
    superAgreeVotes: superAgreeCount,
    disagreeVotes: disagreeCount,
    passVotes: passCount,
  };
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

  const usersByOriginalCluster: Record<number, string[]> = {};
  for (let i = 0; i < clusterMetadata.totalClusters; i++) {
    usersByOriginalCluster[i] = [];
  }
  userClusterMap.forEach((clusterId, userId) => {
    usersByOriginalCluster[clusterId].push(userId);
  });

  const groups: ClusterUserGroup[] = [];
  for (let cid = 0; cid < clusterMetadata.totalClusters; cid++) {
    groups.push({
      clusterId: cid,
      size: usersByOriginalCluster[cid].length,
      users: usersByOriginalCluster[cid],
    });
  }
  groups.sort((a, b) => b.size - a.size);
  groups.forEach((g, idx) => {
    g.clusterId = idx;
  });

  const clusters: Cluster[] = groups.map((g) => ({
    id: g.clusterId,
    size: g.size,
    statements: calcBestClusterStatements(statements, g.users).slice(0, 3),
  }));

  const statementBreakdowns: Record<string, ClusterVoteBreakdown[]> = {};
  for (const statement of statements) {
    statementBreakdowns[statement.id] = groups.map((g) =>
      calcStatementBreakdownForCluster(statement, g),
    );
  }

  return {
    totalClusters: clusterMetadata.totalClusters,
    clusters,
    statementBreakdowns,
  };
}
