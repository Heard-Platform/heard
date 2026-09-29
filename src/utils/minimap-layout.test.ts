import { describe, expect, it } from "vitest";
import {
  clusterAnchors,
  centerOf,
  clusterRadius,
  CLUSTER_GAP,
  MAX_CLUSTER_GAP,
  gravityPoints,
  leaningStatus,
  MAX_MEMBER_DOTS,
  MAX_RADIUS,
  MIN_MEMBER_DOTS,
  MIN_RADIUS,
  memberDotCount,
  memberDotOffsets,
  userDotPosition,
} from "./minimap-layout";

describe("clusterAnchors", () => {
  const MIXED_RADII = [MAX_RADIUS, 0.18, MIN_RADIUS];
  const LARGEST_RADII = [MAX_RADIUS, MAX_RADIUS, MAX_RADIUS];

  it("places clusters the same way every time for the same room", () => {
    expect(clusterAnchors("room-a", [0, 1, 2], MIXED_RADII)).toEqual(
      clusterAnchors("room-a", [0, 1, 2], MIXED_RADII),
    );
  });

  it("places clusters differently for different rooms", () => {
    expect(clusterAnchors("room-a", [0, 1, 2], MIXED_RADII)).not.toEqual(
      clusterAnchors("room-b", [0, 1, 2], MIXED_RADII),
    );
  });

  it("keeps every circle inside the map, close together but not touching", () => {
    for (const seed of ["room-a", "room-b", "room-c", "room-d", "room-e"]) {
      for (const radii of [MIXED_RADII, LARGEST_RADII, LARGEST_RADII.slice(0, 2)]) {
        const slots = radii.map((_radius, i) => i);
        const anchors = clusterAnchors(seed, slots, radii);
        for (let i = 0; i < anchors.length; i++) {
          expect(anchors[i].x - radii[i]).toBeGreaterThanOrEqual(0);
          expect(anchors[i].x + radii[i]).toBeLessThanOrEqual(1);
          expect(anchors[i].y - radii[i]).toBeGreaterThanOrEqual(0);
          expect(anchors[i].y + radii[i]).toBeLessThanOrEqual(1);
          for (let j = i + 1; j < anchors.length; j++) {
            const distance = Math.hypot(anchors[i].x - anchors[j].x, anchors[i].y - anchors[j].y);
            const gap = distance - radii[i] - radii[j];
            expect(gap).toBeGreaterThanOrEqual(CLUSTER_GAP);
            expect(gap).toBeLessThanOrEqual(MAX_CLUSTER_GAP);
          }
        }
      }
    }
  });

  it("assigns positions by slot, so a cluster keeps its spot whatever order clusters arrive in", () => {
    const inSlotOrder = clusterAnchors("room-a", [0, 1, 2], MIXED_RADII);
    const shuffled = clusterAnchors("room-a", [2, 0, 1], [MIXED_RADII[2], MIXED_RADII[0], MIXED_RADII[1]]);
    expect(shuffled).toEqual([inSlotOrder[2], inSlotOrder[0], inSlotOrder[1]]);
  });
});

describe("clusterRadius", () => {
  it("gives the largest cluster the largest circle", () => {
    expect(clusterRadius(100, 100)).toBe(MAX_RADIUS);
  });

  it("scales smaller clusters down, but never below the minimum", () => {
    expect(clusterRadius(50, 100)).toBeLessThan(MAX_RADIUS);
    expect(clusterRadius(50, 100)).toBeGreaterThan(MIN_RADIUS);
    expect(clusterRadius(1, 100)).toBe(MIN_RADIUS);
  });
});

describe("gravityPoints", () => {
  it("pushes each circle's gravity point outward, away from the middle of the map", () => {
    const anchors = [
      { x: 0.3, y: 0.5 },
      { x: 0.7, y: 0.5 },
    ];
    const [left, right] = gravityPoints(anchors, [0.2, 0.2]);
    expect(left.x).toBeCloseTo(0.2);
    expect(right.x).toBeCloseTo(0.8);
    expect(left.y).toBe(0.5);
  });
});

describe("userDotPosition", () => {
  const gravity = [
    { x: 0.1, y: 0.2 },
    { x: 0.9, y: 0.2 },
  ];

  it("sits on a gravity point when certain, and between them when split", () => {
    expect(userDotPosition(gravity, [1, 0])).toEqual({ x: 0.1, y: 0.2 });
    expect(userDotPosition(gravity, [0.5, 0.5]).x).toBeCloseTo(0.5);
  });

  it("rests at the middle of the map before any votes", () => {
    expect(centerOf([{ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.4 }])).toEqual({ x: 0.5, y: 0.30000000000000004 });
  });
});

describe("memberDotCount", () => {
  it("shows more dots for bigger clusters, within limits", () => {
    expect(memberDotCount(100, 100)).toBe(MAX_MEMBER_DOTS);
    expect(memberDotCount(1, 100)).toBe(MIN_MEMBER_DOTS);
  });
});

describe("memberDotOffsets", () => {
  it("is the same for the same cluster every time", () => {
    expect(memberDotOffsets("cluster-a", 5)).toEqual(memberDotOffsets("cluster-a", 5));
    expect(memberDotOffsets("cluster-a", 5)).not.toEqual(memberDotOffsets("cluster-b", 5));
  });

  it("keeps dots inside the circle", () => {
    for (const dot of memberDotOffsets("cluster-a", 20)) {
      expect(Math.hypot(dot.x, dot.y)).toBeLessThan(1);
    }
  });
});

describe("leaningStatus", () => {
  const anchors = [
    { x: 0.25, y: 0.5 },
    { x: 0.75, y: 0.5 },
  ];
  const radii = [0.2, 0.2];
  const gravity = gravityPoints(anchors, radii);

  it("is unplaced before any votes", () => {
    expect(leaningStatus(null, anchors, gravity, radii)).toEqual({ kind: "unplaced" });
  });

  it("is in between when the dot is outside every circle", () => {
    expect(leaningStatus({ x: 0.5, y: 0.5 }, anchors, gravity, radii)).toEqual({ kind: "between" });
  });

  it("is leaning just inside the boundary", () => {
    expect(leaningStatus({ x: 0.42, y: 0.5 }, anchors, gravity, radii)).toEqual({ kind: "leaning", clusterIndex: 0 });
  });

  it("is firmly between halfway in and the center", () => {
    expect(leaningStatus({ x: 0.25, y: 0.5 }, anchors, gravity, radii)).toEqual({ kind: "firmly", clusterIndex: 0 });
    expect(leaningStatus({ x: 0.3, y: 0.5 }, anchors, gravity, radii)).toEqual({ kind: "firmly", clusterIndex: 0 });
  });

  it("is deeply anywhere past the center towards the outer edge", () => {
    expect(leaningStatus({ x: 0.24, y: 0.5 }, anchors, gravity, radii)).toEqual({ kind: "deeply", clusterIndex: 0 });
    expect(leaningStatus({ x: 0.15, y: 0.5 }, anchors, gravity, radii)).toEqual({ kind: "deeply", clusterIndex: 0 });
  });
});
