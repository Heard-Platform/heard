export interface ScreenPoint {
  x: number;
  y: number;
}

const COMPASS_POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const DEGREES_PER_RADIAN = 180 / Math.PI;

export function normalizeHeading(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function bearingBetween(from: ScreenPoint, to: ScreenPoint): number {
  const degrees = Math.atan2(to.x - from.x, from.y - to.y) * DEGREES_PER_RADIAN;
  return normalizeHeading(Math.round(degrees));
}

export function offsetByBearing(from: ScreenPoint, headingDeg: number, distance: number): ScreenPoint {
  const radians = headingDeg / DEGREES_PER_RADIAN;
  return {
    x: from.x + Math.sin(radians) * distance,
    y: from.y - Math.cos(radians) * distance,
  };
}

export function formatHeading(headingDeg: number): string {
  const compassPoint = COMPASS_POINTS[Math.round(headingDeg / 45) % COMPASS_POINTS.length];
  return `${compassPoint} (${Math.round(headingDeg)}°)`;
}
