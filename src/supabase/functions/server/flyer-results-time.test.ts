import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { getLatestResultsTime, isAfterRevealTime } from "./flyer-results-time.ts";

// October is EDT (UTC-4); December is EST (UTC-5).
const EDT_6_59_PM = Date.parse("2026-10-03T22:59:00Z");
const EDT_7_00_PM = Date.parse("2026-10-03T23:00:00Z");
const EDT_11_30_PM = Date.parse("2026-10-04T03:30:00Z");
const EST_6_30_PM = Date.parse("2026-12-03T23:30:00Z");
const EST_7_00_PM = Date.parse("2026-12-04T00:00:00Z");

describe("isAfterRevealTime", () => {
  it("flips at 7 PM Eastern in daylight time", () => {
    assertEquals(isAfterRevealTime(EDT_6_59_PM), false);
    assertEquals(isAfterRevealTime(EDT_7_00_PM), true);
  });

  it("flips at 7 PM Eastern in standard time", () => {
    assertEquals(isAfterRevealTime(EST_6_30_PM), false);
    assertEquals(isAfterRevealTime(EST_7_00_PM), true);
  });
});

describe("getLatestResultsTime", () => {
  it("is the previous evening before 7 PM", () => {
    assertEquals(getLatestResultsTime(EDT_6_59_PM), Date.parse("2026-10-02T23:00:00Z"));
  });

  it("is this evening at and after 7 PM", () => {
    assertEquals(getLatestResultsTime(EDT_7_00_PM), EDT_7_00_PM);
    assertEquals(getLatestResultsTime(EDT_11_30_PM), EDT_7_00_PM);
  });

  it("uses 7 PM Eastern in standard time", () => {
    assertEquals(getLatestResultsTime(EST_7_00_PM), EST_7_00_PM);
    assertEquals(getLatestResultsTime(EST_6_30_PM), Date.parse("2026-12-03T00:00:00Z"));
  });
});
