import { Statement, VoteType } from "./types.tsx";
import { ClusterAssignment } from "./clustering.tsx";

interface ClusterMetadata {
  totalClusters: number;
  clusterSizes: Record<number, number>;
}

interface DistinguishingStatement {
  id: string;
  text: string;
  agreeVotes: number;
  disagreeVotes: number;
  totalVotes: number;
  distinguishingScore: number;
}

export interface Cluster {
  id: number;
  size: number;
  statements: DistinguishingStatement[];
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

const DISTINGUISHING_Z_THRESHOLD = 1.96;

export interface VoteTally {
  agrees: number;
  disagrees: number;
  passes: number;
}

// Two-proportion z-test on agree rates. Sign indicates direction:
// positive = in-group agrees more, negative = in-group disagrees more.
export function calcDistinguishingScore(inGroup: VoteTally, outGroup: VoteTally): number {
  const inOpinionatedVotes = inGroup.agrees + inGroup.disagrees;
  const outOpinionatedVotes = outGroup.agrees + outGroup.disagrees;
  if (inOpinionatedVotes === 0 || outOpinionatedVotes === 0) return 0;

  const inAgreeRate = inGroup.agrees / inOpinionatedVotes;
  const outAgreeRate = outGroup.agrees / outOpinionatedVotes;
  const pooledAgreeRate =
    (inGroup.agrees + outGroup.agrees) / (inOpinionatedVotes + outOpinionatedVotes);
  if (pooledAgreeRate === 0 || pooledAgreeRate === 1) return 0;

  const standardError = Math.sqrt(
    pooledAgreeRate * (1 - pooledAgreeRate) * (1 / inOpinionatedVotes + 1 / outOpinionatedVotes),
  );
  if (standardError === 0) return 0;

  return (inAgreeRate - outAgreeRate) / standardError;
}

function incrementTally(tally: VoteTally, voteType: VoteType): void {
  if (voteType === "agree" || voteType === "super_agree") tally.agrees++;
  else if (voteType === "disagree") tally.disagrees++;
  else if (voteType === "pass") tally.passes++;
}

export function calcDistinguishingStatements(
  statements: Statement[],
  inClusterUsers: string[],
  outClusterUsers: string[],
): DistinguishingStatement[] {
  const inSet = new Set(inClusterUsers);
  const outSet = new Set(outClusterUsers);

  return statements
    .map((statement) => {
      const inGroup: VoteTally = { agrees: 0, disagrees: 0, passes: 0 };
      const outGroup: VoteTally = { agrees: 0, disagrees: 0, passes: 0 };

      for (const [userId, voteType] of Object.entries(statement.voters ?? {})) {
        if (inSet.has(userId)) incrementTally(inGroup, voteType);
        else if (outSet.has(userId)) incrementTally(outGroup, voteType);
      }

      return {
        id: statement.id,
        text: statement.text,
        agreeVotes: inGroup.agrees,
        disagreeVotes: inGroup.disagrees,
        totalVotes: inGroup.agrees + inGroup.disagrees + inGroup.passes,
        distinguishingScore: calcDistinguishingScore(inGroup, outGroup),
      };
    })
    .filter((s) => s.distinguishingScore >= DISTINGUISHING_Z_THRESHOLD)
    .sort((a, b) => {
      const diff = b.distinguishingScore - a.distinguishingScore;
      return diff !== 0 ? diff : b.totalVotes - a.totalVotes;
    });
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
  voterIds: string[],
): ClusterConsensus {
  const userClusterMap = new Map<string, number>();
  voterIds.forEach((userId, idx) => {
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

  const clusters: Cluster[] = groups.map((g) => {
    const otherUsers: string[] = [];
    for (const og of groups) {
      if (og === g) continue;
      for (const u of og.users) otherUsers.push(u);
    }
    return {
      id: g.clusterId,
      size: g.size,
      statements: calcDistinguishingStatements(statements, g.users, otherUsers).slice(0, 3),
    };
  });

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
