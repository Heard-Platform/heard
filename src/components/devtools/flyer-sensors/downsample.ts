import type { AccelerometerSample } from "./sensor-types";

export interface MagnitudePoint {
  timeMs: number;
  magnitude: number;
}

export function downsampleByPeakMagnitude(
  samples: AccelerometerSample[],
  bucketCount: number,
): MagnitudePoint[] {
  if (samples.length <= bucketCount) {
    return samples.map(({ timeMs, magnitude }) => ({ timeMs, magnitude }));
  }

  const bucketSize = Math.ceil(samples.length / bucketCount);
  const points: MagnitudePoint[] = [];
  for (let start = 0; start < samples.length; start += bucketSize) {
    let peak = samples[start];
    const end = Math.min(start + bucketSize, samples.length);
    for (let index = start + 1; index < end; index++) {
      if (samples[index].magnitude > peak.magnitude) peak = samples[index];
    }
    points.push({ timeMs: peak.timeMs, magnitude: peak.magnitude });
  }
  return points;
}

function firstIndexWhere(samples: AccelerometerSample[], isPast: (timeMs: number) => boolean): number {
  let low = 0;
  let high = samples.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (isPast(samples[middle].timeMs)) high = middle;
    else low = middle + 1;
  }
  return low;
}

export function samplesInWindow(
  samples: AccelerometerSample[],
  startMs: number,
  endMs: number,
): AccelerometerSample[] {
  return samples.slice(
    firstIndexWhere(samples, (timeMs) => timeMs >= startMs),
    firstIndexWhere(samples, (timeMs) => timeMs > endMs),
  );
}
