/**
 * Clustering utility for grouping users based on voting patterns
 * Uses k-means clustering on user-statement voting matrix
 */

import { getStatementVoterIds } from "./analysis-utils.tsx";
import { getStatementsForRoom, getDebate, saveClusterData, getClusterAssignment, getClusterMetadataRecord, getClusterAssignmentsBatch, getVotesForStatement } from "./kv-utils.tsx";
import type { Vote } from "./types.tsx";

export type StatementWithVotes = {
  id: string;
  votes: Vote[];
};

export interface VotingMatrix {
  userIds: string[];
  statementIds: string[];
  // rows=users, cols=statements, values: 1=agree, -1=disagree, 0=pass/no vote
  // Float32Array is packed contiguous memory — much smaller footprint than number[][]
  // and faster in the distance-computation hot loop.
  matrix: Float32Array[];
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
  totalVotes: number;
  clusterSizes: Record<number, number>; // clusterId -> number of users
  centroids: number[][]; // cluster centroids in feature space
}

/**
 * Build voting matrix from statements.
 *
 * We build a per-statement userId→encodedVote Map once, then populate each user row
 * via O(1) Map lookups. Previously this did an O(votes) .find() inside the user×statement
 * inner loop, which was O(users × statements × votes_per_statement).
 */
export function buildVotingMatrix(
  userIds: string[],
  statements: StatementWithVotes[],
): VotingMatrix {
  const statementIds = statements.map((s) => s.id);
  const statementCount = statements.length;
  const userCount = userIds.length;
  type UserId = string;
  type EncodedVote = 1 | -1 | 0;

  const voteLookups: Map<UserId, EncodedVote>[] = statements.map((statement) => {
    const lookup = new Map<UserId, EncodedVote>();
    for (const vote of statement.votes) {
      const encoded =
        vote.voteType === "pass"
          ? 0
          : vote.voteType === "agree" || vote.voteType === "super_agree"
            ? 1
            : -1;
      lookup.set(vote.userId, encoded);
    }
    return lookup;
  });

  const matrix: Float32Array[] = new Array(userCount);
  for (let userIdx = 0; userIdx < userCount; userIdx++) {
    const row = new Float32Array(statementCount);
    const userId = userIds[userIdx];
    for (let stmtIdx = 0; stmtIdx < statementCount; stmtIdx++) {
      const v = voteLookups[stmtIdx].get(userId);
      if (v !== undefined) row[stmtIdx] = v;
    }
    matrix[userIdx] = row;
  }

  return { userIds, statementIds, matrix };
}

/**
 * Squared Euclidean distance — used in the k-means hot loop for comparison.
 * sqrt is monotonic, so skipping it gives identical cluster assignments at 2-3x the speed.
 * (a-b)*(a-b) is also faster than Math.pow(a-b, 2) in V8.
 */
function squaredDistance(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return sum;
}

/**
 * Full Euclidean distance — used once per user to produce the stored `distance` field.
 */
function euclideanDistance(a: Float32Array, b: Float32Array): number {
  return Math.sqrt(squaredDistance(a, b));
}

function calculateMean(vectors: Float32Array[]): Float32Array {
  if (vectors.length === 0) return new Float32Array(0);
  const dim = vectors[0].length;
  const mean = new Float32Array(dim);

  for (const vector of vectors) {
    for (let dimIdx = 0; dimIdx < dim; dimIdx++) {
      mean[dimIdx] += vector[dimIdx];
    }
  }

  const n = vectors.length;
  for (let dimIdx = 0; dimIdx < dim; dimIdx++) {
    mean[dimIdx] /= n;
  }

  return mean;
}

/**
 * Simple seedable PRNG (mulberry32) for deterministic test runs.
 * Production calls pass no seed and use Math.random.
 */
function makeRng(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * K-means clustering algorithm
 * @param matrix - Voting matrix (rows = users, cols = statements)
 * @param k - Number of clusters (will auto-determine if too many)
 * @param maxIterations - Maximum iterations for convergence
 * @param randomSeed - Optional seed for deterministic centroid initialization (used by tests)
 */
export function kMeansClustering(
  matrix: Float32Array[],
  k: number = 3,
  maxIterations: number = 10,
  randomSeed?: number,
): { assignments: number[]; centroids: Float32Array[] } {
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

  const random = makeRng(randomSeed);
  const dim = matrix[0].length;

  // Initialize centroids randomly by selecting k random users
  const centroids: Float32Array[] = [];
  const selectedIndices = new Set<number>();
  while (centroids.length < k) {
    const idx = Math.floor(random() * n);
    if (!selectedIndices.has(idx)) {
      selectedIndices.add(idx);
      centroids.push(new Float32Array(matrix[idx]));
    }
  }

  let assignments = new Array(n).fill(0);
  // Preallocate sum/count buffers reused across iterations for centroid recalculation.
  const sums: Float32Array[] = new Array(k);
  for (let c = 0; c < k; c++) sums[c] = new Float32Array(dim);
  const counts = new Array<number>(k).fill(0);

  let converged = false;
  let iterations = 0;

  while (!converged && iterations < maxIterations) {
    // Assign each user to nearest centroid (using squared distance — monotonic, no sqrt needed)
    const newAssignments = new Array<number>(n);
    for (let u = 0; u < n; u++) {
      const userVector = matrix[u];
      let minDistance = Infinity;
      let closestCluster = 0;
      for (let i = 0; i < k; i++) {
        const distance = squaredDistance(userVector, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = i;
        }
      }
      newAssignments[u] = closestCluster;
    }

    // Check for convergence
    converged = true;
    for (let i = 0; i < n; i++) {
      if (newAssignments[i] !== assignments[i]) {
        converged = false;
        break;
      }
    }
    assignments = newAssignments;

    // Recalculate centroids in a single pass: sum then divide.
    // Previously this did k separate O(n) filter() calls followed by calculateMean per cluster.
    for (let c = 0; c < k; c++) {
      sums[c].fill(0);
      counts[c] = 0;
    }
    for (let u = 0; u < n; u++) {
      const cluster = assignments[u];
      const vec = matrix[u];
      const sum = sums[cluster];
      for (let i = 0; i < dim; i++) {
        sum[i] += vec[i];
      }
      counts[cluster]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        const sum = sums[c];
        const centroid = centroids[c];
        const inv = 1 / counts[c];
        for (let i = 0; i < dim; i++) {
          centroid[i] = sum[i] * inv;
        }
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
  randomSeed?: number,
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
    undefined,
    randomSeed,
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
    totalVotes: statements.reduce(
      (sum, stmt) => sum + stmt.votes.length,
      0,
    ),
    clusterSizes,
    // Convert Float32Array centroids to plain arrays for JSON serialization to KV.
    centroids: centroids.map((c) => Array.from(c)),
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
    (ca) => `cluster_assignment:${roomId}:${ca.userId}`,
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

  const allKeys = [...assignmentKeys, metadataKey];
  const allValues = [...assignmentValues, metadataValue];

  await saveClusterData(allKeys, allValues);

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
  return getClusterAssignment(roomId, userId);
}

/**
 * Get cluster metadata for a room
 */
export async function getClusterMetadata(
  roomId: string,
): Promise<ClusterMetadata | null> {
  return getClusterMetadataRecord(roomId);
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
  return getClusterAssignmentsBatch(roomId, userIds);
}

/**
 * Helper: Get votes for a statement
 */
async function safelyGetVotesForStatement(
  statementId: string,
): Promise<Vote[]> {
  try {
    return await getVotesForStatement(statementId);
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

    const roomStatements = await getStatementsForRoom(roomId);

    if (roomStatements.length === 0) {
      console.log(
        `[Clustering] No statements found for room ${roomId}`,
      );
      return null;
    }

    const statementsWithVotes = await Promise.all(
      roomStatements.map(async (stmt) => {
        const votes = await safelyGetVotesForStatement(stmt.id);
        return { id: stmt.id, votes };
      }),
    );

    const voterIds = getStatementVoterIds(roomStatements);

    if (voterIds.length === 0) {
      console.log(
        `[Clustering] No voting participants found for room ${roomId}`,
      );
      return null;
    }

    // Run clustering
    const metadata = await clusterUsersAndSave(
      roomId,
      voterIds,
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