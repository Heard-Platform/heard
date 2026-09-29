import _ from "lodash";

export const MIN_RADIUS = 0.14;
export const MAX_RADIUS = 0.22;
export const MAX_MEMBER_DOTS = 8;
export const MIN_MEMBER_DOTS = 3;
export const GRAVITY_OFFSET_FRACTION = 0.5;
export const FIRMLY_WITHIN_FRACTION = 0.5;
export const EDGE_PADDING = 0.03;
export const CLUSTER_GAP = 0.04;
export const MAX_CLUSTER_GAP = 0.12;
const LAYOUT_ATTEMPTS = 200;

export interface Point {
  x: number;
  y: number;
}

const FALLBACK_ANCHORS_BY_COUNT: Record<number, Point[]> = {
  1: [{ x: 0.5, y: 0.45 }],
  2: [
    { x: 0.25, y: 0.45 },
    { x: 0.75, y: 0.45 },
  ],
  3: [
    { x: 0.25, y: 0.3 },
    { x: 0.75, y: 0.3 },
    { x: 0.5, y: 0.72 },
  ],
};

export function clusterAnchors(seed: string, slots: number[], radii: number[]): Point[] {
  const random = seededRandom(seed);
  const slotOrder = _.sortBy(slots);
  const radiiInSlotOrder = slotOrder.map((slot) => radii[slots.indexOf(slot)]);

  for (let attempt = 0; attempt < LAYOUT_ATTEMPTS; attempt++) {
    const layout = compactLayout(random, radiiInSlotOrder);
    if (layout) {
      return slots.map((slot) => layout[slotOrder.indexOf(slot)]);
    }
  }

  const fallback = FALLBACK_ANCHORS_BY_COUNT[slots.length] ?? FALLBACK_ANCHORS_BY_COUNT[3];
  return slots.map((slot) => fallback[slotOrder.indexOf(slot)]);
}

function compactLayout(random: () => number, radii: number[]): Point[] | null {
  const centers: Point[] = [{ x: 0, y: 0 }];
  for (let i = 1; i < radii.length; i++) {
    const neighbor = Math.floor(random() * i);
    const angle = random() * Math.PI * 2;
    const gap = CLUSTER_GAP + random() * (MAX_CLUSTER_GAP - CLUSTER_GAP);
    const distance = radii[i] + radii[neighbor] + gap;
    centers.push({
      x: centers[neighbor].x + Math.cos(angle) * distance,
      y: centers[neighbor].y + Math.sin(angle) * distance,
    });
  }
  if (!gapsWithinRange(centers, radii)) return null;
  return centeredInMap(centers, radii);
}

function gapsWithinRange(centers: Point[], radii: number[]): boolean {
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      const distance = Math.hypot(centers[i].x - centers[j].x, centers[i].y - centers[j].y);
      const gap = distance - radii[i] - radii[j];
      if (gap < CLUSTER_GAP || gap > MAX_CLUSTER_GAP) return false;
    }
  }
  return true;
}

function centeredInMap(centers: Point[], radii: number[]): Point[] | null {
  const left = _.min(centers.map((c, i) => c.x - radii[i]))!;
  const right = _.max(centers.map((c, i) => c.x + radii[i]))!;
  const top = _.min(centers.map((c, i) => c.y - radii[i]))!;
  const bottom = _.max(centers.map((c, i) => c.y + radii[i]))!;
  const available = 1 - 2 * EDGE_PADDING;
  if (right - left > available || bottom - top > available) return null;

  const shiftX = 0.5 - (left + right) / 2;
  const shiftY = 0.5 - (top + bottom) / 2;
  return centers.map((c) => ({ x: c.x + shiftX, y: c.y + shiftY }));
}

export function clusterRadius(size: number, largestSize: number): number {
  if (largestSize === 0) return MIN_RADIUS;
  return Math.max(MIN_RADIUS, MAX_RADIUS * Math.sqrt(size / largestSize));
}

export function centerOf(points: Point[]): Point {
  return { x: _.meanBy(points, "x"), y: _.meanBy(points, "y") };
}

export function gravityPoints(anchors: Point[], radii: number[]): Point[] {
  const mapCenter = centerOf(anchors);
  return anchors.map((anchor, i) => {
    const dx = anchor.x - mapCenter.x;
    const dy = anchor.y - mapCenter.y;
    const distanceFromCenter = Math.hypot(dx, dy);
    if (distanceFromCenter === 0) return anchor;
    const offset = radii[i] * GRAVITY_OFFSET_FRACTION;
    return {
      x: anchor.x + (dx / distanceFromCenter) * offset,
      y: anchor.y + (dy / distanceFromCenter) * offset,
    };
  });
}

export function userDotPosition(gravity: Point[], clusterProbabilities: number[]): Point {
  return {
    x: _.sum(gravity.map((point, i) => point.x * clusterProbabilities[i])),
    y: _.sum(gravity.map((point, i) => point.y * clusterProbabilities[i])),
  };
}

function seededRandom(seed: string): () => number {
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function memberDotCount(size: number, largestSize: number): number {
  if (largestSize === 0) return MIN_MEMBER_DOTS;
  return Math.max(MIN_MEMBER_DOTS, Math.round(MAX_MEMBER_DOTS * (size / largestSize)));
}

export function memberDotOffsets(seed: string, count: number): Point[] {
  const random = seededRandom(seed);
  return _.times(count, () => {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * 0.7;
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  });
}

export type LeaningStatus =
  | { kind: "unplaced" }
  | { kind: "between" }
  | { kind: "leaning"; clusterIndex: number }
  | { kind: "firmly"; clusterIndex: number }
  | { kind: "deeply"; clusterIndex: number };

export function leaningStatus(
  userDot: Point | null,
  anchors: Point[],
  gravity: Point[],
  radii: number[],
): LeaningStatus {
  if (!userDot) return { kind: "unplaced" };

  const containingIndex = anchors.findIndex(
    (anchor, i) => Math.hypot(userDot.x - anchor.x, userDot.y - anchor.y) <= radii[i],
  );
  if (containingIndex === -1) return { kind: "between" };

  const center = anchors[containingIndex];
  const radius = radii[containingIndex];
  const fromCenter = { x: userDot.x - center.x, y: userDot.y - center.y };

  const outward = { x: gravity[containingIndex].x - center.x, y: gravity[containingIndex].y - center.y };
  const outwardLength = Math.hypot(outward.x, outward.y);
  const distancePastCenter =
    outwardLength === 0 ? 0 : (fromCenter.x * outward.x + fromCenter.y * outward.y) / outwardLength;

  if (distancePastCenter > 0) {
    return { kind: "deeply", clusterIndex: containingIndex };
  }
  if (Math.hypot(fromCenter.x, fromCenter.y) / radius <= FIRMLY_WITHIN_FRACTION) {
    return { kind: "firmly", clusterIndex: containingIndex };
  }
  return { kind: "leaning", clusterIndex: containingIndex };
}
