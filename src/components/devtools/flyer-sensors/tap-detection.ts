import type { AccelerometerSample, TapCluster, TapPeak } from "./sensor-types";

export interface TapDetectionParams {
  minPeakMagnitude: number;
  minTapSpacingMs: number;
  maxTapGapMs: number;
  tapsPerSignal: number;
}

export const DEFAULT_TAP_DETECTION_PARAMS: TapDetectionParams = {
  minPeakMagnitude: 25,
  minTapSpacingMs: 100,
  maxTapGapMs: 700,
  tapsPerSignal: 3,
};

function isLocalMaximum(samples: AccelerometerSample[], index: number): boolean {
  const current = samples[index].magnitude;
  const previous = samples[index - 1]?.magnitude ?? -Infinity;
  const next = samples[index + 1]?.magnitude ?? -Infinity;
  return current >= previous && current >= next;
}

export function findTapPeaks(
  samples: AccelerometerSample[],
  minPeakMagnitude: number,
  minTapSpacingMs: number,
): TapPeak[] {
  const peaks: TapPeak[] = [];
  samples.forEach((sample, index) => {
    if (sample.magnitude < minPeakMagnitude || !isLocalMaximum(samples, index)) return;
    const peak = { timeMs: sample.timeMs, magnitude: sample.magnitude };
    const last = peaks[peaks.length - 1];
    if (last && peak.timeMs - last.timeMs < minTapSpacingMs) {
      if (peak.magnitude > last.magnitude) peaks[peaks.length - 1] = peak;
      return;
    }
    peaks.push(peak);
  });
  return peaks;
}

export function groupPeaksIntoClusters(
  peaks: TapPeak[],
  maxTapGapMs: number,
  tapsPerSignal: number,
): TapCluster[] {
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
  return groups.map((group) => ({
    startMs: group[0].timeMs,
    endMs: group[group.length - 1].timeMs,
    peaks: group,
    isSignal: group.length === tapsPerSignal,
  }));
}

export function detectTapClusters(
  samples: AccelerometerSample[],
  params: TapDetectionParams,
): TapCluster[] {
  const peaks = findTapPeaks(samples, params.minPeakMagnitude, params.minTapSpacingMs);
  return groupPeaksIntoClusters(peaks, params.maxTapGapMs, params.tapsPerSignal);
}
