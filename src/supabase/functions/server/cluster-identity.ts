export const MIN_IDENTITY_OVERLAP = 0.4;

export interface StanceEntry {
  statementId: string;
  agreeRate: number;
}

export interface ClusterNaming {
  name: string;
  namedAt: number;
  stanceSnapshot: StanceEntry[];
  previousName: string | null;
  renameReason: string | null;
}

export interface ClusterIdentity {
  stableId: string;
  clusterIndex: number;
  slot: number;
  memberIds: string[];
  naming: ClusterNaming | null;
}

export interface ClusterIdentityRecord {
  version: number;
  timestamp: number;
  clusters: ClusterIdentity[];
}

export interface ClusterIdentityResolution {
  record: ClusterIdentityRecord;
  keptCount: number;
  newCount: number;
}

interface ClusterMembership {
  userId: string;
  clusterId: number;
}

export function jaccardOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const id of a) {
    if (b.has(id)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}

function groupMembersByCluster(
  memberships: ClusterMembership[],
  totalClusters: number,
): Set<string>[] {
  const groups = Array.from({ length: totalClusters }, () => new Set<string>());
  for (const { userId, clusterId } of memberships) {
    groups[clusterId].add(userId);
  }
  return groups;
}

function findBestMatching(overlaps: number[][], previousCount: number): (number | null)[] {
  const newCount = overlaps.length;
  let bestScore = -1;
  let best: (number | null)[] = new Array(newCount).fill(null);
  const current: (number | null)[] = new Array(newCount).fill(null);
  const used = new Array<boolean>(previousCount).fill(false);

  const search = (newIdx: number, score: number) => {
    if (newIdx === newCount) {
      if (score > bestScore) {
        bestScore = score;
        best = [...current];
      }
      return;
    }
    for (let prevIdx = 0; prevIdx < previousCount; prevIdx++) {
      const overlap = overlaps[newIdx][prevIdx];
      if (used[prevIdx] || overlap < MIN_IDENTITY_OVERLAP) continue;
      used[prevIdx] = true;
      current[newIdx] = prevIdx;
      search(newIdx + 1, score + overlap);
      used[prevIdx] = false;
    }
    current[newIdx] = null;
    search(newIdx + 1, score);
  };

  search(0, 0);
  return best;
}

function lowestFreeSlot(taken: Set<number>): number {
  let slot = 0;
  while (taken.has(slot)) slot++;
  return slot;
}

export function resolveClusterIdentities(
  previous: ClusterIdentityRecord | null,
  memberships: ClusterMembership[],
  totalClusters: number,
  timestamp: number,
  generateId: () => string = () => crypto.randomUUID(),
): ClusterIdentityResolution {
  const newGroups = groupMembersByCluster(memberships, totalClusters);
  const previousClusters = previous?.clusters ?? [];
  const previousGroups = previousClusters.map((c) => new Set(c.memberIds));

  const overlaps = newGroups.map((group) =>
    previousGroups.map((prevGroup) => jaccardOverlap(group, prevGroup)),
  );
  const matching = findBestMatching(overlaps, previousClusters.length);

  const takenSlots = new Set<number>();
  for (const prevIdx of matching) {
    if (prevIdx !== null) takenSlots.add(previousClusters[prevIdx].slot);
  }

  const unmatchedBySize = newGroups
    .map((group, clusterIndex) => ({ size: group.size, clusterIndex }))
    .filter(({ clusterIndex }) => matching[clusterIndex] === null)
    .sort((a, b) => b.size - a.size || a.clusterIndex - b.clusterIndex);

  const newSlots = new Map<number, number>();
  for (const { clusterIndex } of unmatchedBySize) {
    const slot = lowestFreeSlot(takenSlots);
    takenSlots.add(slot);
    newSlots.set(clusterIndex, slot);
  }

  const clusters: ClusterIdentity[] = newGroups.map((group, clusterIndex) => {
    const prevIdx = matching[clusterIndex];
    const memberIds = [...group];
    if (prevIdx !== null) {
      const prev = previousClusters[prevIdx];
      return {
        stableId: prev.stableId,
        clusterIndex,
        slot: prev.slot,
        memberIds,
        naming: prev.naming ?? null,
      };
    }
    return {
      stableId: generateId(),
      clusterIndex,
      slot: newSlots.get(clusterIndex)!,
      memberIds,
      naming: null,
    };
  });

  const keptCount = matching.filter((m) => m !== null).length;

  return {
    record: {
      version: (previous?.version ?? 0) + 1,
      timestamp,
      clusters,
    },
    keptCount,
    newCount: clusters.length - keptCount,
  };
}
