/**
 * Clustering utility for grouping users based on voting patterns
 * Uses k-means clustering on user-statement voting matrix
 */

import { getByPrefixParsed } from "./kv-utils.tsx";
import { getDebate } from "./kv-utils.tsx";
import * as kv from "./kv_store.tsx";
import type { Vote, Statement, VoteType } from "./types.tsx";

export type StatementWithVotes = {
  id: string;
  votes: Vote[];
};

export interface VotingMatrix {
  userIds: string[];
  statementIds: string[];
  matrix: number[][]; // rows=users, cols=statements, values: 1=agree, -1=disagree, 0=pass/no vote
}

export interface ClusterAssignment {
  userId: string;
  clusterId: number;
  distance: number; // distance to cluster centroid
}

export interface ClusterMetadata {
  roomId: string;
  totalClusters: number;
  timestamp: number;
  clusterSizes: Record<number, number>; // clusterId -> number of users
  centroids: number[][]; // cluster centroids in feature space
}

/**
 * Build voting matrix from statements
 */
export function buildVotingMatrix(
  userIds: string[],
  statements: StatementWithVotes[],
): VotingMatrix {
  const statementIds = statements.map((s) => s.id);
  const matrix: number[][] = [];

  // Build matrix: rows = users, cols = statements
  for (const userId of userIds) {
    const row: number[] = [];
    for (const statement of statements) {
      const vote = statement.votes.find(
        (v) => v.userId === userId,
      );
      if (!vote || vote.voteType === "pass") {
        row.push(0);
      } else if (vote.voteType === "agree") {
        row.push(1);
      } else {
        row.push(-1);
      }
    }
    matrix.push(row);
  }

  return { userIds, statementIds, matrix };
}

/**
 * Calculate Euclidean distance between two vectors
 */
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

/**
 * Calculate mean of vectors
 */
function calculateMean(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const mean = new Array(dim).fill(0);

  for (const vector of vectors) {
    for (let i = 0; i < dim; i++) {
      mean[i] += vector[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    mean[i] /= vectors.length;
  }

  return mean;
}

/**
 * K-means clustering algorithm
 * @param matrix - Voting matrix (rows = users, cols = statements)
 * @param k - Number of clusters (will auto-determine if too many)
 * @param maxIterations - Maximum iterations for convergence
 */
export function kMeansClustering(
  matrix: number[][],
  k: number = 3,
  maxIterations: number = 10,
): { assignments: number[]; centroids: number[][] } {
  const n = matrix.length; // number of users

  if (n === 0) {
    return { assignments: [], centroids: [] };
  }

  // Adjust k if we have fewer users than clusters
  k = Math.min(k, n);

  // Handle edge case: only 1 user or 1 cluster
  if (k === 1 || n === 1) {
    return {
      assignments: new Array(n).fill(0),
      centroids: [calculateMean(matrix)],
    };
  }

  // Initialize centroids randomly by selecting k random users
  const centroids: number[][] = [];
  const selectedIndices = new Set<number>();
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * n);
    if (!selectedIndices.has(idx)) {
      selectedIndices.add(idx);
      centroids.push([...matrix[idx]]);
    }
  }

  let assignments = new Array(n).fill(0);
  let converged = false;
  let iterations = 0;

  while (!converged && iterations < maxIterations) {
    // Assign each user to nearest centroid
    const newAssignments = matrix.map((userVector) => {
      let minDistance = Infinity;
      let closestCluster = 0;

      for (let i = 0; i < k; i++) {
        const distance = euclideanDistance(
          userVector,
          centroids[i],
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = i;
        }
      }

      return closestCluster;
    });

    // Check for convergence
    converged = newAssignments.every(
      (a, i) => a === assignments[i],
    );
    assignments = newAssignments;

    // Recalculate centroids
    for (let i = 0; i < k; i++) {
      const clusterMembers = matrix.filter(
        (_, idx) => assignments[idx] === i,
      );
      if (clusterMembers.length > 0) {
        centroids[i] = calculateMean(clusterMembers);
      }
    }

    iterations++;
  }

  return { assignments, centroids };
}

/**
 * Perform clustering on user voting data (pure function - no database operations)
 */
export function clusterUsers(
  roomId: string,
  userIds: string[],
  statements: StatementWithVotes[],
): {
  metadata: ClusterMetadata;
  clusterAssignments: ClusterAssignment[];
} {
  const votingMatrix = buildVotingMatrix(userIds, statements);

  const optimalK = Math.min(
    Math.max(2, Math.floor(Math.sqrt(userIds.length))),
    3,
  );

  const { assignments, centroids } = kMeansClustering(
    votingMatrix.matrix,
    optimalK,
  );

  const clusterSizes: Record<number, number> = {};
  for (let i = 0; i < optimalK; i++) {
    clusterSizes[i] = 0;
  }
  for (const clusterId of assignments) {
    clusterSizes[clusterId] =
      (clusterSizes[clusterId] || 0) + 1;
  }

  const clusterAssignments: ClusterAssignment[] = userIds.map(
    (userId, idx) => ({
      userId,
      clusterId: assignments[idx],
      distance: euclideanDistance(
        votingMatrix.matrix[idx],
        centroids[assignments[idx]],
      ),
    }),
  );

  const metadata: ClusterMetadata = {
    roomId,
    totalClusters: optimalK,
    timestamp: Date.now(),
    clusterSizes,
    centroids,
  };

  return { metadata, clusterAssignments };
}

/**
 * Perform clustering and save to database
 */
export async function clusterUsersAndSave(
  roomId: string,
  userIds: string[],
  statements: StatementWithVotes[],
): Promise<ClusterMetadata> {
  console.log(
    `[Clustering] Starting clustering for room ${roomId} with ${userIds.length} users and ${statements.length} statements`,
  );

  const { metadata, clusterAssignments } = clusterUsers(
    roomId,
    userIds,
    statements,
  );

  // Save to database
  // Store each user's cluster assignment
  const assignmentKeys = clusterAssignments.map(
    (ca) => `cluster:${roomId}:${ca.userId}`,
  );
  const assignmentValues = clusterAssignments.map((ca) =>
    JSON.stringify({
      clusterId: ca.clusterId,
      distance: ca.distance,
      timestamp: metadata.timestamp,
    }),
  );

  // Store metadata
  const metadataKey = `cluster:${roomId}:metadata`;
  const metadataValue = JSON.stringify(metadata);

  // Batch save to database - mset takes two arrays: keys and values
  const allKeys = [...assignmentKeys, metadataKey];
  const allValues = [...assignmentValues, metadataValue];

  await kv.mset(allKeys, allValues);

  console.log(
    `[Clustering] Saved ${clusterAssignments.length} cluster assignments and metadata for room ${roomId}`,
  );
  console.log(
    `[Clustering] Cluster distribution:`,
    metadata.clusterSizes,
  );

  return metadata;
}

/**
 * Get cluster assignment for a user
 */
export async function getUserCluster(
  roomId: string,
  userId: string,
): Promise<{
  clusterId: number;
  distance: number;
  timestamp: number;
} | null> {
  const key = `cluster:${roomId}:${userId}`;
  const value = await kv.get(key);

  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Get cluster metadata for a room
 */
export async function getClusterMetadata(
  roomId: string,
): Promise<ClusterMetadata | null> {
  const key = `cluster:${roomId}:metadata`;
  const value = await kv.get(key);

  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Get all cluster assignments for a room
 */
export async function getRoomClusters(
  roomId: string,
  userIds: string[],
): Promise<
  Map<
    string,
    { clusterId: number; distance: number; timestamp: number }
  >
> {
  const keys = userIds.map(
    (userId) => `cluster:${roomId}:${userId}`,
  );
  const values = await kv.mget(keys);

  const clusters = new Map<
    string,
    { clusterId: number; distance: number; timestamp: number }
  >();

  for (let i = 0; i < userIds.length; i++) {
    if (values[i]) {
      try {
        clusters.set(userIds[i], JSON.parse(values[i]));
      } catch {
        // Skip invalid entries
      }
    }
  }

  return clusters;
}

/**
 * Helper: Get votes for a statement
 */
async function getVotesForStatement(
  statementId: string,
): Promise<Vote[]> {
  try {
    return getByPrefixParsed(`vote:${statementId}:`);
  } catch (error) {
    console.error(
      `[Clustering] Error fetching votes for statement ${statementId}:`,
      error,
    );
    return [];
  }
}

/**
 * Recalculate clusters for a room (main entry point - call this on every vote)
 * Fetches all necessary data and performs clustering
 */
export async function recalculateClustersForRoom(
  roomId: string,
): Promise<ClusterMetadata | null> {
  try {
    console.log(
      `[Clustering] Starting recalculation for room ${roomId}`,
    );

    // Get room data
    const room = await getDebate(roomId);
    if (!room || room.participants.length === 0) {
      console.log(
        `[Clustering] Room ${roomId} not found or has no participants`,
      );
      return null;
    }

    // Get all statements for this room
    const allStatements = await kv.getByPrefix("statement:");
    const roomStatements: Statement[] = allStatements
      .map((s) => {
        try {
          return JSON.parse(s);
        } catch {
          return null;
        }
      })
      .filter((s) => s && s.roomId === roomId);

    if (roomStatements.length === 0) {
      console.log(
        `[Clustering] No statements found for room ${roomId}`,
      );
      return null;
    }

    const statementsWithVotes = await Promise.all(
      roomStatements.map(async (stmt) => {
        const votes = await getVotesForStatement(stmt.id);
        return { id: stmt.id, votes };
      }),
    );

    // Run clustering
    const metadata = await clusterUsersAndSave(
      roomId,
      room.participants,
      statementsWithVotes,
    );

    console.log(
      `[Clustering] Successfully recalculated clusters for room ${roomId}`,
    );
    return metadata;
  } catch (error) {
    console.error(
      `[Clustering] Error recalculating clusters for room ${roomId}:`,
      error,
    );
    return null;
  }
}