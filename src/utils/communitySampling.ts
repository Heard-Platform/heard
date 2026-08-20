import type { SubHeard } from "../types";

const MIN_ACTIVITY_WEIGHT = 1;

function activityWeight(community: SubHeard): number {
  const recentActivity = community.count ?? 0;
  return MIN_ACTIVITY_WEIGHT + Math.log1p(recentActivity);
}

export function pickWeightedRandomCommunities(
  communities: SubHeard[],
  count: number,
): SubHeard[] {
  const keyed = communities.map((community) => ({
    community,
    key: Math.random() ** (1 / activityWeight(community)),
  }));

  keyed.sort((a, b) => b.key - a.key);

  return keyed.slice(0, count).map((entry) => entry.community);
}
