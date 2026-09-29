import { getClusterRecomputeMarker, saveClusterRecomputeMarker } from "./kv-utils.tsx";
import { recalculateClustersForRoom } from "./clustering.tsx";
import { DebateRoom } from "./types.tsx";

export const RECOMPUTE_VOTE_GROWTH_FACTOR = 1.1;
export const RECOMPUTE_MIN_INTERVAL_MS = 5 * 60 * 1000;

export interface ClusterRecomputeMarker {
  voteCount: number;
  startedAt: number;
}

export function areClustersStale(
  marker: ClusterRecomputeMarker | null,
  voteCount: number,
  now: number,
): boolean {
  if (!marker) return true;
  if (now - marker.startedAt < RECOMPUTE_MIN_INTERVAL_MS) return false;
  return voteCount >= marker.voteCount * RECOMPUTE_VOTE_GROWTH_FACTOR;
}

export function shouldRecomputeClusters(
  room: DebateRoom,
  marker: ClusterRecomputeMarker | null,
  now: number,
): boolean {
  const voteCount = room.totalVotes ?? 0;
  if (room.participants.length === 0 || voteCount === 0) return false;
  return areClustersStale(marker, voteCount, now);
}

export async function recomputeClustersIfNeeded(room: DebateRoom): Promise<void> {
  const now = Date.now();
  const marker = await getClusterRecomputeMarker(room.id);
  if (!shouldRecomputeClusters(room, marker, now)) return;

  const voteCount = room.totalVotes ?? 0;
  await saveClusterRecomputeMarker(room.id, { voteCount, startedAt: now });
  console.log(`[ClusterFreshness] Recomputing clusters for room ${room.id} at ${voteCount} votes`);
  await recalculateClustersForRoom(room.id);
}
