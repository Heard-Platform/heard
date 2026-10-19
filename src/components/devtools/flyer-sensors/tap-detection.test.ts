import { describe, it, expect } from "vitest";
import {
  DEFAULT_TAP_DETECTION_PARAMS,
  detectTapClusters,
  findTapPeaks,
  groupPeaksIntoClusters,
} from "./tap-detection";
import { createMockSensorRecording } from "./flyer-sensors-mock-data";
import type { AccelerometerSample, TapPeak } from "./sensor-types";
import realFlyerClipCsv from "./fixtures/flyer-taps-clip.csv?raw";

const INTERVAL_MS = 10;

function samplesFromMagnitudes(magnitudes: number[], startMs = 0): AccelerometerSample[] {
  return magnitudes.map((magnitude, index) => ({
    timeMs: startMs + index * INTERVAL_MS,
    x: 0,
    y: 0,
    z: magnitude,
    magnitude,
  }));
}

function repeat(value: number, count: number): number[] {
  return Array.from({ length: count }, () => value);
}

function peak(timeMs: number): TapPeak {
  return { timeMs, magnitude: 15, jolt: 15 };
}

// 28 seconds of a real recording (Sensor Logger on an iPhone) around one flyer: standing still while taping,
// a jostle just before the taps, three taps starting ~16.4s in, then walking away.
function parseClip(csv: string): AccelerometerSample[] {
  return csv
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [timeMs, x, y, z] = line.split(",").map(Number);
      return { timeMs, x, y, z, magnitude: Math.hypot(x, y, z) };
    });
}

describe("findTapPeaks", () => {
  it("finds sudden spikes even when they're smaller than smooth swings", () => {
    const smoothSwing = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 19, 17, 15, 13, 11, 9, 7, 5, 3, 1];
    const samples = samplesFromMagnitudes([...repeat(0.3, 5), ...smoothSwing, ...repeat(0.3, 20), 12, ...repeat(0.3, 5)]);

    expect(findTapPeaks(samples, 7, 100).map((tap) => tap.timeMs)).toEqual([460]);
  });

  it("keeps only the sharpest jolt within the minimum spacing", () => {
    const samples = samplesFromMagnitudes([...repeat(0.3, 5), 10, 0.3, 0.3, 20, 0.3, ...repeat(0.3, 5)]);
    const peaks = findTapPeaks(samples, 7, 100);

    expect(peaks).toHaveLength(1);
    expect(peaks[0].timeMs).toBe(80);
  });
});

describe("groupPeaksIntoClusters", () => {
  it("splits groups when the gap exceeds the max tap gap", () => {
    const groups = groupPeaksIntoClusters([peak(0), peak(250), peak(500), peak(3000), peak(3250)], 500);
    expect(groups.map((group) => group.length)).toEqual([3, 2]);
  });
});

describe("detectTapClusters", () => {
  it("finds the flyer in a real recording and nothing in the walking around it", () => {
    const samples = parseClip(realFlyerClipCsv);
    const signals = detectTapClusters(samples, DEFAULT_TAP_DETECTION_PARAMS).filter((cluster) => cluster.isSignal);

    expect(signals).toHaveLength(1);
    expect(signals[0].peaks).toHaveLength(3);
    expect(signals[0].startMs).toBeGreaterThan(16_000);
    expect(signals[0].startMs).toBeLessThan(16_500);
  });

  it("finds every triple tap in the mock DC recording and skips the two-tap stop", () => {
    const { accelerometerSamples } = createMockSensorRecording();
    const clusters = detectTapClusters(accelerometerSamples, DEFAULT_TAP_DETECTION_PARAMS);

    expect(clusters.map((cluster) => cluster.peaks.length)).toEqual([3, 3, 3, 3, 3, 3]);
    expect(clusters.every((cluster) => cluster.isSignal)).toBe(true);
  });

  it("finds taps made right after walking up, with no standing still before them", () => {
    const walking = Array.from({ length: 1_500 }, (_, index) => 6 + 3 * Math.sin(index / 8));
    const taps = [20, 0.3, ...repeat(0.3, 23), 20, 0.3, ...repeat(0.3, 23), 20];
    const samples = samplesFromMagnitudes([...walking, ...taps, ...repeat(0.3, 500)]);
    const signals = detectTapClusters(samples, DEFAULT_TAP_DETECTION_PARAMS).filter((cluster) => cluster.isSignal);

    expect(signals.map((cluster) => cluster.peaks.length)).toEqual([3]);
  });

  it("flags a burst with more taps than a signal as a near miss", () => {
    const tap = [20, ...repeat(0.3, 24)];
    const samples = samplesFromMagnitudes([...repeat(0.3, 100), ...tap, ...tap, ...tap, ...tap, ...tap, ...repeat(0.3, 100)]);
    const clusters = detectTapClusters(samples, DEFAULT_TAP_DETECTION_PARAMS);

    expect(clusters.map((cluster) => [cluster.peaks.length, cluster.isSignal])).toEqual([[5, false]]);
  });
});
