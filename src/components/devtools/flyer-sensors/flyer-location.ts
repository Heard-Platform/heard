import type {
  FlyerAdjustment,
  FlyerAdjustments,
  FlyerLocation,
  FlyerPlacement,
  LatLng,
  LocationFix,
  TapCluster,
} from "./sensor-types";

export const DEFAULT_STANDING_WINDOW_MS = 15_000;
const MIN_ACCURACY_M = 1;

function weightedAverageLocation(fixes: LocationFix[]): FlyerLocation {
  const weights = fixes.map((fix) => 1 / Math.max(fix.horizontalAccuracyM, MIN_ACCURACY_M) ** 2);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const weightedSum = (value: (fix: LocationFix) => number) =>
    fixes.reduce((sum, fix, index) => sum + value(fix) * weights[index], 0) / totalWeight;

  return {
    latitude: weightedSum((fix) => fix.latitude),
    longitude: weightedSum((fix) => fix.longitude),
    horizontalAccuracyM: Math.min(...fixes.map((fix) => fix.horizontalAccuracyM)),
    fixCount: fixes.length,
  };
}

function nearestFix(fixes: LocationFix[], timeMs: number): LocationFix | null {
  let nearest: LocationFix | null = null;
  for (const fix of fixes) {
    if (!nearest || Math.abs(fix.timeMs - timeMs) < Math.abs(nearest.timeMs - timeMs)) {
      nearest = fix;
    }
  }
  return nearest;
}

export function estimateFlyerLocation(
  fixes: LocationFix[],
  cluster: TapCluster,
  standingWindowMs: number,
): FlyerLocation | null {
  const windowFixes = fixes.filter(
    (fix) => fix.timeMs >= cluster.startMs - standingWindowMs && fix.timeMs <= cluster.endMs,
  );
  if (windowFixes.length > 0) return weightedAverageLocation(windowFixes);

  const fallback = nearestFix(fixes, cluster.startMs);
  if (!fallback) return null;
  return {
    latitude: fallback.latitude,
    longitude: fallback.longitude,
    horizontalAccuracyM: fallback.horizontalAccuracyM,
    fixCount: 1,
  };
}

export function buildFlyerPlacements(
  clusters: TapCluster[],
  fixes: LocationFix[],
  standingWindowMs: number,
  adjustments: FlyerAdjustments,
): FlyerPlacement[] {
  return clusters
    .filter((cluster) => cluster.isSignal)
    .map((cluster, index) => ({
      number: index + 1,
      cluster,
      location: estimateFlyerLocation(fixes, cluster, standingWindowMs),
      manualPosition: adjustments[cluster.startMs]?.position ?? null,
      headingDeg: adjustments[cluster.startMs]?.headingDeg ?? null,
    }));
}

export function updateFlyerAdjustment(
  adjustments: FlyerAdjustments,
  cluster: TapCluster,
  update: (current: FlyerAdjustment) => FlyerAdjustment,
): FlyerAdjustments {
  const next = { ...adjustments };
  const updated = update(adjustments[cluster.startMs] ?? {});
  if (updated.position === undefined && updated.headingDeg === undefined) {
    delete next[cluster.startMs];
  } else {
    next[cluster.startMs] = updated;
  }
  return next;
}

export function placementPosition(placement: FlyerPlacement): LatLng | null {
  return placement.manualPosition ?? placement.location;
}

function firstFixAfter(fixes: LocationFix[], timeMs: number): number {
  let low = 0;
  let high = fixes.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (fixes[middle].timeMs > timeMs) high = middle;
    else low = middle + 1;
  }
  return low;
}

export function interpolatePosition(fixes: LocationFix[], timeMs: number): LatLng | null {
  if (fixes.length === 0) return null;
  if (timeMs < fixes[0].timeMs || timeMs > fixes[fixes.length - 1].timeMs) return null;

  const nextIndex = firstFixAfter(fixes, timeMs);
  const previous = fixes[nextIndex - 1];
  const next = fixes[nextIndex];
  if (!next) return { latitude: previous.latitude, longitude: previous.longitude };

  const fraction = (timeMs - previous.timeMs) / (next.timeMs - previous.timeMs);
  return {
    latitude: previous.latitude + (next.latitude - previous.latitude) * fraction,
    longitude: previous.longitude + (next.longitude - previous.longitude) * fraction,
  };
}
