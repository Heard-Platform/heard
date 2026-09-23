import { describe, it, expect } from "vitest";
import { bearingBetween, formatHeading, normalizeHeading, offsetByBearing } from "./heading";

describe("normalizeHeading", () => {
  it("wraps headings into 0–359", () => {
    expect(normalizeHeading(360)).toBe(0);
    expect(normalizeHeading(-90)).toBe(270);
    expect(normalizeHeading(725)).toBe(5);
  });
});

describe("bearingBetween", () => {
  const origin = { x: 100, y: 100 };

  it("treats screen up as north and measures clockwise", () => {
    expect(bearingBetween(origin, { x: 100, y: 50 })).toBe(0);
    expect(bearingBetween(origin, { x: 150, y: 100 })).toBe(90);
    expect(bearingBetween(origin, { x: 100, y: 150 })).toBe(180);
    expect(bearingBetween(origin, { x: 50, y: 100 })).toBe(270);
    expect(bearingBetween(origin, { x: 150, y: 50 })).toBe(45);
  });
});

describe("offsetByBearing", () => {
  it("round-trips with bearingBetween", () => {
    const origin = { x: 20, y: 40 };
    for (const heading of [0, 45, 135, 200, 315]) {
      expect(bearingBetween(origin, offsetByBearing(origin, heading, 50))).toBe(heading);
    }
  });
});

describe("formatHeading", () => {
  it("labels the nearest compass point", () => {
    expect(formatHeading(0)).toBe("N (0°)");
    expect(formatHeading(44)).toBe("NE (44°)");
    expect(formatHeading(350)).toBe("N (350°)");
    expect(formatHeading(200)).toBe("S (200°)");
  });
});
