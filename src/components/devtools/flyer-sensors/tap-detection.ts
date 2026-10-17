import { samplesInWindow } from "./downsample";
import type { AccelerometerSample, TapCluster, TapPeak } from "./sensor-types";

export interface TapDetectionParams {
  minTapJolt: number;
  minTapSpacingMs: number;
  maxTapGapMs: number;
  tapsPerSignal: number;
  maxStillMagnitude: number;
}

export const DEFAULT_TAP_DETECTION_PARAMS: TapDetectionParams = {
  minTapJolt: 9,
  minTapSpacingMs: 100,
  maxTapGapMs: 500,
  tapsPerSignal: 3,
  maxStillMagnitude: 1,
};

// A firm tap can ring and register as two spikes, so a signal may have one more tap than asked for.
const EXTRA_TAPS_ALLOWED = 1;

// Taping a flyer up means standing still for a while before the taps. Requiring stillness for most of the
// window (not just half) rejects spikes a few seconds after a real stop, once walking has started again.
const STILL_WINDOW = { startOffsetMs: -15_000, endOffsetMs: -1_000 };
const STILL_FRACTION = 0.75;

// A tap is a near-instant spike, while walking steps build up over ~100ms, so taps stand out by how much
// the acceleration changes from one sample to the next rather than by how big it gets.
function joltAt(samples: AccelerometerSample[], index: number): number {
  const previous = samples[index - 1];
  if (!previous) return 0;
  const current = samples[index];
  return Math.hypot(current.x - previous.x, current.y - previous.y, current.z - previous.z);
}

export function findTapPeaks(
  samples: AccelerometerSample[],
  minTapJolt: number,
  minTapSpacingMs: number,
): TapPeak[] {
  const jolts = samples.map((_, index) => joltAt(samples, index));
  const peaks: TapPeak[] = [];
  jolts.forEach((jolt, index) => {
    const isLocalMaximum = jolt >= (jolts[index - 1] ?? 0) && jolt >= (jolts[index + 1] ?? 0);
    if (jolt < minTapJolt || !isLocalMaximum) return;
    const peak = { timeMs: samples[index].timeMs, magnitude: samples[index].magnitude, jolt };
    const last = peaks[peaks.length - 1];
    if (last && peak.timeMs - last.timeMs < minTapSpacingMs) {
      if (peak.jolt > last.jolt) peaks[peaks.length - 1] = peak;
      return;
    }
    peaks.push(peak);
  });
  return peaks;
}

export function groupPeaksIntoClusters(peaks: TapPeak[], maxTapGapMs: number): TapPeak[][] {
  const groups: TapPeak[][] = [];
  for (const peak of peaks) {
    const currentGroup = groups[groups.length - 1];
    const lastPeak = currentGroup?.[currentGroup.length - 1];
    if (lastPeak && peak.timeMs - lastPeak.timeMs <= maxTapGapMs) {
      currentGroup.push(peak);
    } else {
      groups.push([peak]);
    }
  }
  return groups;
}

function magnitudePercentile(samples: AccelerometerSample[], fraction: number): number {
  if (samples.length === 0) return Infinity;
  const sorted = samples.map((sample) => sample.magnitude).sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * fraction)];
}

export function wasStillBefore(samples: AccelerometerSample[], firstTapMs: number, maxStillMagnitude: number): boolean {
  const window = samplesInWindow(
    samples,
    firstTapMs + STILL_WINDOW.startOffsetMs,
    firstTapMs + STILL_WINDOW.endOffsetMs,
  );
  return magnitudePercentile(window, STILL_FRACTION) <= maxStillMagnitude;
}

function hasSignalTapCount(peaks: TapPeak[], tapsPerSignal: number): boolean {
  return peaks.length >= tapsPerSignal && peaks.length <= tapsPerSignal + EXTRA_TAPS_ALLOWED;
}

// Returns flyer signals plus near misses: clusters that have the right tap count or the stillness before
// them, but not both. Other spike clusters are just walking and are left out.
export function detectTapClusters(
  samples: AccelerometerSample[],
  params: TapDetectionParams,
): TapCluster[] {
  const peaks = findTapPeaks(samples, params.minTapJolt, params.minTapSpacingMs);
  return groupPeaksIntoClusters(peaks, params.maxTapGapMs).flatMap((group) => {
    const tapCountMatches = hasSignalTapCount(group, params.tapsPerSignal);
    const isStill = wasStillBefore(samples, group[0].timeMs, params.maxStillMagnitude);
    if (!tapCountMatches && !isStill) return [];
    return [
      {
        startMs: group[0].timeMs,
        endMs: group[group.length - 1].timeMs,
        peaks: group,
        isSignal: tapCountMatches && isStill,
      },
    ];
  });
}
