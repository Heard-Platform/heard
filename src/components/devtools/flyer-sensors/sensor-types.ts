export interface AccelerometerSample {
  timeMs: number;
  x: number;
  y: number;
  z: number;
  magnitude: number;
}

export interface LocationFix {
  timeMs: number;
  latitude: number;
  longitude: number;
  horizontalAccuracyM: number;
}

export interface TapPeak {
  timeMs: number;
  magnitude: number;
}

export interface TapCluster {
  startMs: number;
  endMs: number;
  peaks: TapPeak[];
  isSignal: boolean;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface FlyerLocation extends LatLng {
  horizontalAccuracyM: number;
  fixCount: number;
}

export interface FlyerPlacement {
  number: number;
  cluster: TapCluster;
  location: FlyerLocation | null;
  manualPosition: LatLng | null;
  headingDeg: number | null;
}

export interface FlyerAdjustment {
  position?: LatLng;
  headingDeg?: number;
}

export type FlyerAdjustments = Record<number, FlyerAdjustment>;
