import type { TapCluster } from "./sensor-types";

export interface TimeWindow {
  startMs: number;
  endMs: number;
}

export const FLYER_ZOOM_PADDING_MS = 3000;

export function windowAroundCluster(cluster: TapCluster, paddingMs: number): TimeWindow {
  return { startMs: cluster.startMs - paddingMs, endMs: cluster.endMs + paddingMs };
}
