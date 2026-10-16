import { describe, expect, it } from "vitest";
import { formatDateRangeSelection, resolveDateRange } from "./date-range-presets";

const now = new Date(2026, 9, 16, 15, 30);

describe("resolveDateRange", () => {
  it("resolves a rolling preset relative to now", () => {
    const range = resolveDateRange({ kind: "preset", preset: "last24Hours" }, now);
    expect(range.from).toEqual(new Date(2026, 9, 15, 15, 30));
    expect(range.to).toEqual(now);
  });

  it("leaves the start open for all time", () => {
    const range = resolveDateRange({ kind: "preset", preset: "allTime" }, now);
    expect(range.from).toBeNull();
    expect(range.to).toEqual(now);
  });

  it("spans whole days for a custom range", () => {
    const range = resolveDateRange(
      { kind: "custom", from: new Date(2026, 9, 6, 12), to: new Date(2026, 9, 12, 9) },
      now,
    );
    expect(range.from).toEqual(new Date(2026, 9, 6));
    expect(range.to).toEqual(new Date(2026, 9, 12, 23, 59, 59, 999));
  });
});

describe("formatDateRangeSelection", () => {
  it("uses the preset label", () => {
    expect(formatDateRangeSelection({ kind: "preset", preset: "last7Days" })).toBe("Last 7 days");
  });
});
