import { placementPosition } from "./flyer-location";
import type { FlyerLocation, FlyerPlacement, LatLng } from "./sensor-types";

export interface SavedFlyerPlacement {
  tappedAtMs: number;
  tapMagnitudes: number[];
  estimatedLocation: FlyerLocation | null;
  position: LatLng | null;
  positionSource: "gps" | "manual";
  headingDeg: number | null;
}

export interface FlyerPlacementsSavePayload {
  roomId: string;
  flyers: SavedFlyerPlacement[];
}

function toSavedFlyerPlacement(placement: FlyerPlacement): SavedFlyerPlacement {
  const position = placementPosition(placement);
  return {
    tappedAtMs: placement.cluster.startMs,
    tapMagnitudes: placement.cluster.peaks.map((peak) => peak.magnitude),
    estimatedLocation: placement.location,
    position: position && { latitude: position.latitude, longitude: position.longitude },
    positionSource: placement.manualPosition ? "manual" : "gps",
    headingDeg: placement.headingDeg,
  };
}

export function buildSavePayload(roomId: string, placements: FlyerPlacement[]): FlyerPlacementsSavePayload {
  return { roomId, flyers: placements.map(toSavedFlyerPlacement) };
}
