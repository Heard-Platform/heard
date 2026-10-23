import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseSimulationOptions } from "./simulation-options.ts";

Deno.test("parseSimulationOptions defaults to 70 phones over a minute on a new event", () => {
  assertEquals(parseSimulationOptions([]), { attendeeCount: 70, joinWindowMs: 60_000, existingEventId: null });
});

Deno.test("parseSimulationOptions reads people, join seconds and an existing event", () => {
  assertEquals(parseSimulationOptions(["--people", "150", "--join-seconds", "30", "--event", "42"]), {
    attendeeCount: 150,
    joinWindowMs: 30_000,
    existingEventId: "42",
  });
});

Deno.test("parseSimulationOptions refuses a bad people count", () => {
  assertThrows(() => parseSimulationOptions(["--people", "0"]), Error, "--people");
  assertThrows(() => parseSimulationOptions(["--people", "501"]), Error, "--people");
  assertThrows(() => parseSimulationOptions(["--people", "lots"]), Error, "--people");
});

Deno.test("parseSimulationOptions refuses negative join seconds", () => {
  assertThrows(() => parseSimulationOptions(["--join-seconds=-5"]), Error, "--join-seconds");
});
