import type {
  AnonymityBreakdown,
  ParticipationBreakdown,
  ReferrerShareCount,
  TrafficSourceCount,
  TrafficSourceKey,
} from "./RoomAnalyticsModal";

function makeSeededRng(seed: string): () => number {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const TRACKED_KEYS: TrafficSourceKey[] = ["direct", "newsletter", "referral", "flyer", "other"];

export function generateMockTrafficSources(
  seed: string,
  total: number,
): TrafficSourceCount[] {
  const rng = makeSeededRng(seed);
  const weights = TRACKED_KEYS.map(() => rng() ** 2);
  const weightSum = weights.reduce((sum, w) => sum + w, 0);

  let remaining = total;
  const counts = TRACKED_KEYS.map((_, i) => {
    const count = i === TRACKED_KEYS.length - 1
      ? remaining
      : Math.round((weights[i] / weightSum) * total);
    remaining -= count;
    return Math.max(0, count);
  });

  return [
    ...TRACKED_KEYS.map((key, i) => ({ key, count: counts[i] })),
    { key: "social" as const, count: 0 },
  ];
}

export function generateMockReferrers(seed: string, totalShares: number): ReferrerShareCount[] {
  if (totalShares <= 0) return [];
  const rng = makeSeededRng(seed);
  const referrerCount = Math.min(totalShares, 3 + Math.floor(rng() * 6));

  const weights = Array.from({ length: referrerCount }, () => rng() ** 2);
  const weightSum = weights.reduce((sum, w) => sum + w, 0);

  let remaining = totalShares;
  return weights.map((weight, i) => {
    const shares = i === weights.length - 1
      ? remaining
      : Math.max(1, Math.round((weight / weightSum) * totalShares));
    remaining -= shares;
    return { id: `${seed}-referrer-${i}`, shares: Math.max(0, shares) };
  }).filter((r) => r.shares > 0);
}

export function generateMockAnonymity(seed: string, total: number): AnonymityBreakdown {
  const rng = makeSeededRng(seed);
  const anonymous = Math.round(total * (0.15 + rng() * 0.35));
  return { anonymous, named: total - anonymous };
}

export function generateMockParticipation(seed: string, viewerTotal: number): ParticipationBreakdown {
  const rng = makeSeededRng(seed);
  const participating = Math.round(viewerTotal * (0.2 + rng() * 0.4));
  return { participating, lurking: viewerTotal - participating };
}
