import { describe, it, expect } from "vitest";
import {
  buildFlyerPlacements,
  estimateFlyerLocation,
  interpolatePosition,
  placementPosition,
  updateFlyerAdjustment,
} from "./flyer-location";
import type { LocationFix, TapCluster } from "./sensor-types";

function fix(timeMs: number, latitude: number, longitude: number, horizontalAccuracyM: number): LocationFix {
  return { timeMs, latitude, longitude, horizontalAccuracyM };
}

function cluster(startMs: number, isSignal = true): TapCluster {
  return {
    startMs,
    endMs: startMs + 500,
    peaks: [],
    isSignal,
  };
}

describe("estimateFlyerLocation", () => {
  it("weights fixes in the standing window by inverse squared accuracy", () => {
    const fixes = [fix(90_000, 38.9, -77.0, 5), fix(95_000, 39.0, -77.1, 10)];
    const location = estimateFlyerLocation(fixes, cluster(100_000), 15_000);

    expect(location?.latitude).toBeCloseTo(38.92, 5);
    expect(location?.longitude).toBeCloseTo(-77.02, 5);
    expect(location?.horizontalAccuracyM).toBe(5);
    expect(location?.fixCount).toBe(2);
  });

  it("ignores fixes from before the standing window and after the taps", () => {
    const fixes = [fix(10_000, 1, 1, 5), fix(99_000, 38.9, -77.0, 8), fix(200_000, 2, 2, 5)];
    const location = estimateFlyerLocation(fixes, cluster(100_000), 15_000);

    expect(location).toMatchObject({ latitude: 38.9, longitude: -77.0, fixCount: 1 });
  });

  it("falls back to the nearest fix when none are in the window", () => {
    const fixes = [fix(10_000, 1, 1, 5), fix(150_000, 38.9, -77.0, 20)];
    const location = estimateFlyerLocation(fixes, cluster(100_000), 15_000);

    expect(location).toEqual({ latitude: 38.9, longitude: -77.0, horizontalAccuracyM: 20, fixCount: 1 });
  });

  it("returns null without any fixes", () => {
    expect(estimateFlyerLocation([], cluster(100_000), 15_000)).toBeNull();
  });
});

describe("buildFlyerPlacements", () => {
  it("numbers only signal clusters", () => {
    const fixes = [fix(0, 38.9, -77.0, 5)];
    const placements = buildFlyerPlacements(
      [cluster(1_000), cluster(5_000, false), cluster(9_000)],
      fixes,
      15_000,
      {},
    );

    expect(placements.map((placement) => [placement.number, placement.cluster.startMs])).toEqual([
      [1, 1_000],
      [2, 9_000],
    ]);
  });

  it("attaches adjustments by cluster start time", () => {
    const fixes = [fix(0, 38.9, -77.0, 5)];
    const moved = { latitude: 38.95, longitude: -77.05 };
    const placements = buildFlyerPlacements([cluster(1_000), cluster(9_000)], fixes, 15_000, {
      1_000: { headingDeg: 90 },
      9_000: { position: moved },
    });

    expect(placements.map((placement) => [placement.manualPosition, placement.headingDeg])).toEqual([
      [null, 90],
      [moved, null],
    ]);
  });
});

describe("placementPosition", () => {
  it("prefers the manual position over the GPS estimate", () => {
    const fixes = [fix(0, 38.9, -77.0, 5)];
    const moved = { latitude: 38.95, longitude: -77.05 };
    const [estimated, adjusted] = buildFlyerPlacements([cluster(1_000), cluster(9_000)], fixes, 15_000, {
      9_000: { position: moved },
    });

    expect(placementPosition(estimated)).toMatchObject({ latitude: 38.9, longitude: -77.0 });
    expect(placementPosition(adjusted)).toBe(moved);
  });
});

describe("updateFlyerAdjustment", () => {
  const position = { latitude: 38.95, longitude: -77.05 };

  it("adds to an existing adjustment without dropping other fields", () => {
    const adjustments = updateFlyerAdjustment({ 1_000: { position } }, cluster(1_000), (current) => ({
      ...current,
      headingDeg: 180,
    }));

    expect(adjustments).toEqual({ 1_000: { position, headingDeg: 180 } });
  });

  it("removes the entry once nothing is adjusted", () => {
    const adjustments = updateFlyerAdjustment({ 1_000: { headingDeg: 180 } }, cluster(1_000), () => ({}));

    expect(adjustments).toEqual({});
  });
});

describe("interpolatePosition", () => {
  const fixes = [fix(1_000, 38.9, -77.0, 5), fix(2_000, 39.0, -77.2, 5), fix(3_000, 39.0, -77.2, 5)];

  it("interpolates linearly between the surrounding fixes", () => {
    const position = interpolatePosition(fixes, 1_250);
    expect(position?.latitude).toBeCloseTo(38.925, 6);
    expect(position?.longitude).toBeCloseTo(-77.05, 6);
  });

  it("returns the fix itself at an exact fix time, including the last one", () => {
    expect(interpolatePosition(fixes, 2_000)).toEqual({ latitude: 39.0, longitude: -77.2 });
    expect(interpolatePosition(fixes, 3_000)).toEqual({ latitude: 39.0, longitude: -77.2 });
  });

  it("returns null outside the GPS recording or without fixes", () => {
    expect(interpolatePosition(fixes, 500)).toBeNull();
    expect(interpolatePosition(fixes, 3_500)).toBeNull();
    expect(interpolatePosition([], 1_000)).toBeNull();
  });
});
