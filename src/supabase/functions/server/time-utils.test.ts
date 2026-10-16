import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseTimestampParam } from "./time-utils.ts";

Deno.test("parseTimestampParam - parses a millisecond timestamp", () => {
  assertEquals(parseTimestampParam("1760000000000"), 1760000000000);
});

Deno.test("parseTimestampParam - returns null when missing or empty", () => {
  assertEquals(parseTimestampParam(undefined), null);
  assertEquals(parseTimestampParam(""), null);
});

Deno.test("parseTimestampParam - returns null for non-numeric values", () => {
  assertEquals(parseTimestampParam("yesterday"), null);
  assertEquals(parseTimestampParam("Infinity"), null);
});
