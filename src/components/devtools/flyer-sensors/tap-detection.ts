import type { AccelerometerSample, TapCluster, TapPeak } from "./sensor-types";

export interface TapDetectionParams {
  minTapJolt: number;
  minTapSpacingMs: number;
  maxTapGapMs: number;
  tapsPerSignal: number;
}

export const DEFAULT_TAP_DETECTION_PARAMS: TapDetectionParams = {
  minTapJolt: 9,
  minTapSpacingMs: 100,
  maxTapGapMs: 500,
  tapsPerSignal: 3,
};

// A firm tap can ring and register as two spikes, so a signal may have one more tap than asked for.
const EXTRA_TAPS_ALLOWED = 1;

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

function hasSignalTapCount(peaks: TapPeak[], tapsPerSignal: number): boolean {
  return peaks.length >= tapsPerSignal && peaks.length <= tapsPerSignal + EXTRA_TAPS_ALLOWED;
}

// Returns flyer signals plus near misses: clusters with more taps than a signal allows. Walking often
// lands two steps within the tap gap, so groups of fewer taps than a signal are left out as noise.
// Standing still isn't required: sometimes the taps come right after walking up, before taping the flyer.
export function detectTapClusters(
  samples: AccelerometerSample[],
  params: TapDetectionParams,
): TapCluster[] {
  const peaks = findTapPeaks(samples, params.minTapJolt, params.minTapSpacingMs);
  return groupPeaksIntoClusters(peaks, params.maxTapGapMs).flatMap((group) => {
    if (group.length < params.tapsPerSignal) return [];
    return [
      {
        startMs: group[0].timeMs,
        endMs: group[group.length - 1].timeMs,
        peaks: group,
        isSignal: hasSignalTapCount(group, params.tapsPerSignal),
      },
    ];
  });
}
