import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  areClustersStale,
  RECOMPUTE_MIN_INTERVAL_MS,
  shouldRecomputeClusters,
} from "./cluster-freshness.ts";
import { DebateRoom } from "./types.tsx";

const LONG_AGO = 0;
const NOW = RECOMPUTE_MIN_INTERVAL_MS * 10;

function room(participants: number, totalVotes: number): DebateRoom {
  return {
    id: "room",
    participants: Array.from({ length: participants }, (_, i) => `u${i}`),
    totalVotes,
  } as DebateRoom;
}

Deno.test("areClustersStale - a room that has never been clustered is stale", () => {
  assertEquals(areClustersStale(null, 1, NOW), true);
});

Deno.test("areClustersStale - waits for 10% vote growth", () => {
  const marker = { voteCount: 100, startedAt: LONG_AGO };
  assertEquals(areClustersStale(marker, 105, NOW), false);
  assertEquals(areClustersStale(marker, 115, NOW), true);
});

Deno.test("areClustersStale - waits at least the minimum interval even with growth", () => {
  const marker = { voteCount: 100, startedAt: NOW - RECOMPUTE_MIN_INTERVAL_MS + 1 };
  assertEquals(areClustersStale(marker, 500, NOW), false);
  assertEquals(areClustersStale(marker, 500, NOW + 1), true);
});

Deno.test("shouldRecomputeClusters - recomputes a room with participants, votes and stale clusters", () => {
  assertEquals(shouldRecomputeClusters(room(3, 10), null, NOW), true);
});

Deno.test("shouldRecomputeClusters - skips rooms with no participants or no votes", () => {
  assertEquals(shouldRecomputeClusters(room(0, 10), null, NOW), false);
  assertEquals(shouldRecomputeClusters(room(3, 0), null, NOW), false);
});

Deno.test("shouldRecomputeClusters - skips rooms whose clusters are fresh", () => {
  const marker = { voteCount: 10, startedAt: NOW };
  assertEquals(shouldRecomputeClusters(room(3, 10), marker, NOW), false);
});
