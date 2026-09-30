import { describe, it, expect } from "vitest";
import { downsampleByPeakMagnitude, samplesInWindow } from "./downsample";
import type { AccelerometerSample } from "./sensor-types";

function samples(magnitudes: number[]): AccelerometerSample[] {
  return magnitudes.map((magnitude, index) => ({ timeMs: index * 10, x: 0, y: 0, z: magnitude, magnitude }));
}

describe("downsampleByPeakMagnitude", () => {
  it("returns every sample when there are fewer than the bucket count", () => {
    expect(downsampleByPeakMagnitude(samples([1, 2, 3]), 10)).toHaveLength(3);
  });

  it("keeps the peak of each bucket so tap spikes survive", () => {
    const points = downsampleByPeakMagnitude(samples([1, 50, 1, 1, 1, 1, 70, 1]), 2);
    expect(points).toEqual([
      { timeMs: 10, magnitude: 50 },
      { timeMs: 60, magnitude: 70 },
    ]);
  });
});

describe("samplesInWindow", () => {
  it("includes samples within the inclusive window", () => {
    expect(samplesInWindow(samples([1, 2, 3, 4, 5]), 10, 30).map((point) => point.magnitude)).toEqual([2, 3, 4]);
  });

  it("handles window edges that fall between samples", () => {
    expect(samplesInWindow(samples([1, 2, 3, 4, 5]), 5, 35).map((point) => point.magnitude)).toEqual([2, 3, 4]);
  });

  it("returns nothing for a window outside the recording", () => {
    expect(samplesInWindow(samples([1, 2, 3]), 100, 200)).toEqual([]);
  });
});
