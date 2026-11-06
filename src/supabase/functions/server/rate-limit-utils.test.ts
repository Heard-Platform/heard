import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isWithinRateLimitWindow } from "./rate-limit-utils.ts";

const NOW = 1_762_000_000_000;

Deno.test("isWithinRateLimitWindow - allows a first statement", () => {
  assertEquals(isWithinRateLimitWindow("statement", null, NOW), false);
});

Deno.test("isWithinRateLimitWindow - blocks a statement under 5 seconds", () => {
  assertEquals(
    isWithinRateLimitWindow("statement", NOW - 4999, NOW),
    true,
  );
});

Deno.test("isWithinRateLimitWindow - allows a statement at 5 seconds", () => {
  assertEquals(
    isWithinRateLimitWindow("statement", NOW - 5000, NOW),
    false,
  );
});
