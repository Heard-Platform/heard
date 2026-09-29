import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { RECOMPUTE_MIN_INTERVAL_MS, shouldRecomputeClusters } from "./cluster-freshness.ts";

const LONG_AGO = 0;
const NOW = RECOMPUTE_MIN_INTERVAL_MS * 10;

Deno.test("shouldRecomputeClusters - recomputes a room that has never been clustered", () => {
  assertEquals(shouldRecomputeClusters(null, 1, NOW), true);
});

Deno.test("shouldRecomputeClusters - waits for 10% vote growth", () => {
  const marker = { voteCount: 100, startedAt: LONG_AGO };
  assertEquals(shouldRecomputeClusters(marker, 105, NOW), false);
  assertEquals(shouldRecomputeClusters(marker, 115, NOW), true);
});

Deno.test("shouldRecomputeClusters - waits at least the minimum interval even with growth", () => {
  const marker = { voteCount: 100, startedAt: NOW - RECOMPUTE_MIN_INTERVAL_MS + 1 };
  assertEquals(shouldRecomputeClusters(marker, 500, NOW), false);
  assertEquals(shouldRecomputeClusters(marker, 500, NOW + 1), true);
});

Deno.test("shouldRecomputeClusters - a room clustered at zero votes recomputes once the interval passes", () => {
  assertEquals(shouldRecomputeClusters({ voteCount: 0, startedAt: LONG_AGO }, 1, NOW), true);
});
