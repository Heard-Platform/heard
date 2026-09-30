import { describe, it, expect } from "vitest";
import {
  DEFAULT_TAP_DETECTION_PARAMS,
  detectTapClusters,
  findTapPeaks,
  groupPeaksIntoClusters,
} from "./tap-detection";
import { createMockSensorRecording } from "./flyer-sensors-mock-data";
import type { AccelerometerSample } from "./sensor-types";

function samplesFromMagnitudes(magnitudes: number[], intervalMs = 10): AccelerometerSample[] {
  return magnitudes.map((magnitude, index) => ({
    timeMs: index * intervalMs,
    x: 0,
    y: 0,
    z: magnitude,
    magnitude,
  }));
}

function quiet(count: number): number[] {
  return Array.from({ length: count }, () => 0.5);
}

describe("findTapPeaks", () => {
  it("ignores samples below the threshold", () => {
    const samples = samplesFromMagnitudes([...quiet(5), 10, ...quiet(5)]);
    expect(findTapPeaks(samples, 25, 100)).toEqual([]);
  });

  it("keeps only the strongest peak within the minimum spacing", () => {
    const samples = samplesFromMagnitudes([...quiet(5), 30, 1, 1, 50, 1, ...quiet(5)]);
    const peaks = findTapPeaks(samples, 25, 100);
    expect(peaks).toEqual([{ timeMs: 80, magnitude: 50 }]);
  });

  it("finds separate peaks that are further apart than the minimum spacing", () => {
    const samples = samplesFromMagnitudes([...quiet(5), 40, ...quiet(20), 45, ...quiet(5)]);
    expect(findTapPeaks(samples, 25, 100).map((peak) => peak.timeMs)).toEqual([50, 260]);
  });
});

describe("groupPeaksIntoClusters", () => {
  const peak = (timeMs: number) => ({ timeMs, magnitude: 40 });

  it("marks a cluster with the expected tap count as a signal", () => {
    const clusters = groupPeaksIntoClusters([peak(0), peak(200), peak(450)], 700, 3);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toMatchObject({ startMs: 0, endMs: 450, isSignal: true });
  });

  it("splits clusters when the gap exceeds the max tap gap", () => {
    const clusters = groupPeaksIntoClusters(
      [peak(0), peak(200), peak(400), peak(3000), peak(3200), peak(3400)],
      700,
      3,
    );
    expect(clusters.map((cluster) => cluster.startMs)).toEqual([0, 3000]);
    expect(clusters.every((cluster) => cluster.isSignal)).toBe(true);
  });

  it("does not treat clusters with too many or too few taps as signals", () => {
    const clusters = groupPeaksIntoClusters(
      [peak(0), peak(200), peak(2000), peak(2200), peak(2400), peak(2600)],
      700,
      3,
    );
    expect(clusters.map((cluster) => cluster.peaks.length)).toEqual([2, 4]);
    expect(clusters.some((cluster) => cluster.isSignal)).toBe(false);
  });
});

describe("detectTapClusters", () => {
  it("finds every triple tap in the mock DC recording and rejects the four-tap stop", () => {
    const { accelerometerSamples } = createMockSensorRecording();
    const clusters = detectTapClusters(accelerometerSamples, DEFAULT_TAP_DETECTION_PARAMS);

    expect(clusters.filter((cluster) => cluster.isSignal)).toHaveLength(6);
    expect(clusters.filter((cluster) => !cluster.isSignal).map((cluster) => cluster.peaks.length)).toEqual([4]);
  });
});
