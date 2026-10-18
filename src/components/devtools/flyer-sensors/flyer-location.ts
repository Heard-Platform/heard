import type {
  FlyerAdjustment,
  FlyerAdjustments,
  FlyerLocation,
  FlyerPlacement,
  LatLng,
  LocationFix,
  ManualFlyer,
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

export function detectedFlyerId(cluster: TapCluster): string {
  return `tap-${cluster.startMs}`;
}

interface PlacementSource {
  id: string;
  cluster: TapCluster | null;
  location: FlyerLocation | null;
  initialPosition: LatLng | null;
}

export function isDismissedSignal(cluster: TapCluster, dismissedIds: ReadonlySet<string>): boolean {
  return cluster.isSignal && dismissedIds.has(detectedFlyerId(cluster));
}

// Detected flyers come first in recording order, then flyers added by hand in the order they were added.
// Detected flyers marked as wrong are left out so they aren't saved or counted in the numbering.
export function buildFlyerPlacements(
  clusters: TapCluster[],
  dismissedIds: ReadonlySet<string>,
  manualFlyers: ManualFlyer[],
  fixes: LocationFix[],
  standingWindowMs: number,
  adjustments: FlyerAdjustments,
  firstFlyerGroup: number,
): FlyerPlacement[] {
  const detected: PlacementSource[] = clusters
    .filter((cluster) => cluster.isSignal && !isDismissedSignal(cluster, dismissedIds))
    .map((cluster) => ({
      id: detectedFlyerId(cluster),
      cluster,
      location: estimateFlyerLocation(fixes, cluster, standingWindowMs),
      initialPosition: null,
    }));
  const added: PlacementSource[] = manualFlyers.map((flyer) => ({
    id: flyer.id,
    cluster: null,
    location: null,
    initialPosition: flyer.position,
  }));

  return [...detected, ...added].map(({ id, cluster, location, initialPosition }, index) => {
    const adjustment = adjustments[id];
    return {
      id,
      flyerGroup: adjustment?.flyerGroup ?? firstFlyerGroup + index,
      cluster,
      location,
      manualPosition: adjustment?.position ?? initialPosition,
      headingDeg: adjustment?.headingDeg ?? null,
    };
  });
}

export function updateFlyerAdjustment(
  adjustments: FlyerAdjustments,
  id: string,
  update: (current: FlyerAdjustment) => FlyerAdjustment,
): FlyerAdjustments {
  const next = { ...adjustments };
  const updated = update(adjustments[id] ?? {});
  if (Object.values(updated).every((value) => value === undefined)) {
    delete next[id];
  } else {
    next[id] = updated;
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
