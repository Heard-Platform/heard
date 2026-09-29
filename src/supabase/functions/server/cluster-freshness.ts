import { getClusterRecomputeMarker, saveClusterRecomputeMarker } from "./kv-utils.tsx";
import { recalculateClustersForRoom } from "./clustering.tsx";

export const RECOMPUTE_VOTE_GROWTH_FACTOR = 1.1;
export const RECOMPUTE_MIN_INTERVAL_MS = 5 * 60 * 1000;

export interface ClusterRecomputeMarker {
  voteCount: number;
  startedAt: number;
}

export function shouldRecomputeClusters(
  marker: ClusterRecomputeMarker | null,
  voteCount: number,
  now: number,
): boolean {
  if (!marker) return true;
  if (now - marker.startedAt < RECOMPUTE_MIN_INTERVAL_MS) return false;
  return voteCount >= marker.voteCount * RECOMPUTE_VOTE_GROWTH_FACTOR;
}

export async function recomputeClustersIfStale(roomId: string, voteCount: number): Promise<void> {
  const now = Date.now();
  const marker = await getClusterRecomputeMarker(roomId);
  if (!shouldRecomputeClusters(marker, voteCount, now)) return;

  await saveClusterRecomputeMarker(roomId, { voteCount, startedAt: now });
  console.log(`[ClusterFreshness] Recomputing clusters for room ${roomId} at ${voteCount} votes`);
  await recalculateClustersForRoom(roomId);
}
