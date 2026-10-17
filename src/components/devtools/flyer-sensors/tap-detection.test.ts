import { describe, it, expect } from "vitest";
import {
  DEFAULT_TAP_DETECTION_PARAMS,
  detectTapClusters,
  findTapPeaks,
  groupPeaksIntoClusters,
  wasStillBefore,
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

describe("wasStillBefore", () => {
  const firstTapMs = 16_000;
  const maxStillMagnitude = DEFAULT_TAP_DETECTION_PARAMS.maxStillMagnitude;

  it("accepts taps after standing still", () => {
    const samples = samplesFromMagnitudes(repeat(0.3, 1_700));
    expect(wasStillBefore(samples, firstTapMs, maxStillMagnitude)).toBe(true);
  });

  it("accepts a brief jostle just before the taps", () => {
    const samples = samplesFromMagnitudes([...repeat(0.3, 1_300), ...repeat(6, 200), ...repeat(0.3, 200)]);
    expect(wasStillBefore(samples, firstTapMs, maxStillMagnitude)).toBe(true);
  });

  it("rejects taps made while walking", () => {
    const samples = samplesFromMagnitudes([...repeat(0.3, 300), ...repeat(6, 1_400)]);
    expect(wasStillBefore(samples, firstTapMs, maxStillMagnitude)).toBe(false);
  });

  it("rejects spikes a few seconds after walking away from a stop", () => {
    const samples = samplesFromMagnitudes([...repeat(0.3, 1_000), ...repeat(6, 700)]);
    expect(wasStillBefore(samples, firstTapMs, maxStillMagnitude)).toBe(false);
  });

  it("rejects taps at the very start of a recording, with nothing to show stillness before", () => {
    const samples = samplesFromMagnitudes(repeat(0.3, 300));
    expect(wasStillBefore(samples, 100, maxStillMagnitude)).toBe(false);
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

  it("finds every triple tap in the mock DC recording and flags the two-tap stop as a near miss", () => {
    const { accelerometerSamples } = createMockSensorRecording();
    const clusters = detectTapClusters(accelerometerSamples, DEFAULT_TAP_DETECTION_PARAMS);

    expect(clusters.filter((cluster) => cluster.isSignal)).toHaveLength(6);
    expect(clusters.filter((cluster) => !cluster.isSignal).map((cluster) => cluster.peaks.length)).toEqual([2]);
  });
});
