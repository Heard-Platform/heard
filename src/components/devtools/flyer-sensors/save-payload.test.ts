import { describe, it, expect } from "vitest";
import { buildSavePayload } from "./save-payload";
import type { FlyerPlacement } from "./sensor-types";

const estimatedLocation = { latitude: 38.9, longitude: -77.0, horizontalAccuracyM: 6, fixCount: 12 };

function placement(overrides: Partial<FlyerPlacement>): FlyerPlacement {
  return {
    number: 1,
    cluster: {
      startMs: 1_000,
      endMs: 1_450,
      peaks: [
        { timeMs: 1_000, magnitude: 40 },
        { timeMs: 1_220, magnitude: 52 },
        { timeMs: 1_450, magnitude: 61 },
      ],
      isSignal: true,
    },
    location: estimatedLocation,
    manualPosition: null,
    headingDeg: null,
    ...overrides,
  };
}

describe("buildSavePayload", () => {
  it("saves the GPS estimate as the position when the flyer was not moved", () => {
    const payload = buildSavePayload("room-1", [placement({})]);

    expect(payload).toEqual({
      roomId: "room-1",
      flyers: [
        {
          tappedAtMs: 1_000,
          tapMagnitudes: [40, 52, 61],
          estimatedLocation,
          position: { latitude: 38.9, longitude: -77.0 },
          positionSource: "gps",
          headingDeg: null,
        },
      ],
    });
  });

  it("saves manual positions and headings alongside the original estimate", () => {
    const moved = { latitude: 38.91, longitude: -77.01 };
    const [flyer] = buildSavePayload("room-1", [placement({ manualPosition: moved, headingDeg: 270 })]).flyers;

    expect(flyer).toMatchObject({
      estimatedLocation,
      position: moved,
      positionSource: "manual",
      headingDeg: 270,
    });
  });

  it("saves a null position when there is no GPS fix or manual position", () => {
    const [flyer] = buildSavePayload("room-1", [placement({ location: null })]).flyers;

    expect(flyer.position).toBeNull();
  });
});
