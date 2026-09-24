import { describe, it, expect } from "vitest";
import { buildSavePayload, findSaveProblem, nextFlyerGroup } from "./save-payload";
import type { SavedFlyerPlacement } from "../../../utils/dev-api";
import type { FlyerPlacement } from "./sensor-types";

const estimatedLocation = { latitude: 38.9, longitude: -77.0, horizontalAccuracyM: 6, fixCount: 12 };

function placement(overrides: Partial<FlyerPlacement>): FlyerPlacement {
  return {
    number: 1,
    flyerGroup: 1,
    cluster: { startMs: 1_000, endMs: 1_450, peaks: [], isSignal: true },
    location: estimatedLocation,
    manualPosition: null,
    headingDeg: null,
    ...overrides,
  };
}

function savedFlyer(statementId: string, flyerGroup: number): SavedFlyerPlacement {
  return {
    id: `${statementId}-${flyerGroup}`,
    statementId,
    flyerGroup,
    latitude: 38.9,
    longitude: -77.0,
    headingDeg: null,
    agrees: 0,
    disagrees: 0,
  };
}

describe("nextFlyerGroup", () => {
  it("continues after the highest saved flyer for the statement", () => {
    const saved = [savedFlyer("s1", 3), savedFlyer("s1", 7), savedFlyer("s2", 20)];
    expect(nextFlyerGroup(saved, "s1")).toBe(8);
  });

  it("starts at 1 for a statement without saved flyers or without a statement", () => {
    expect(nextFlyerGroup([savedFlyer("s2", 20)], "s1")).toBe(1);
    expect(nextFlyerGroup([savedFlyer("s2", 20)], null)).toBe(1);
  });
});

describe("findSaveProblem", () => {
  const ready = { roomId: "room", statementId: "s1", placements: [placement({})], savedFlyers: [] };

  it("allows a complete save", () => {
    expect(findSaveProblem(ready)).toBeNull();
  });

  it("requires a room, statement and new flyers", () => {
    expect(findSaveProblem({ ...ready, roomId: null })).toBe("Select a room to save");
    expect(findSaveProblem({ ...ready, statementId: null })).toBe("Select the statement on these flyers to save");
    expect(findSaveProblem({ ...ready, placements: [] })).toBe("Upload a recording with new flyers to save");
  });

  it("requires every flyer to have a position", () => {
    expect(findSaveProblem({ ...ready, placements: [placement({ location: null, flyerGroup: 4 })] })).toBe(
      "Flyers without a position: 4",
    );
  });

  it("rejects repeated or already saved flyer numbers", () => {
    expect(
      findSaveProblem({ ...ready, placements: [placement({ flyerGroup: 2 }), placement({ number: 2, flyerGroup: 2 })] }),
    ).toBe("Flyer numbers used more than once: 2");
    expect(
      findSaveProblem({ ...ready, placements: [placement({ flyerGroup: 5 })], savedFlyers: [savedFlyer("s1", 5)] }),
    ).toBe("Flyer numbers already saved for this statement: 5");
    expect(
      findSaveProblem({ ...ready, placements: [placement({ flyerGroup: 5 })], savedFlyers: [savedFlyer("s2", 5)] }),
    ).toBeNull();
  });
});

describe("buildSavePayload", () => {
  it("saves each flyer's final position, heading and number", () => {
    const moved = { latitude: 38.91, longitude: -77.01 };
    const payload = buildSavePayload("room", "s1", [
      placement({ flyerGroup: 8 }),
      placement({ number: 2, flyerGroup: 9, manualPosition: moved, headingDeg: 270 }),
    ]);

    expect(payload).toEqual({
      roomId: "room",
      statementId: "s1",
      flyers: [
        { flyerGroup: 8, latitude: 38.9, longitude: -77.0, headingDeg: null },
        { flyerGroup: 9, latitude: 38.91, longitude: -77.01, headingDeg: 270 },
      ],
    });
  });
});
