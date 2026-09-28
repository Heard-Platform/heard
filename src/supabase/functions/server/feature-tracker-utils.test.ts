import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { countByWeek } from "./feature-tracker-utils.ts";

Deno.test("countByWeek - empty input returns no weeks", () => {
  assertEquals(countByWeek([]), []);
});

Deno.test("countByWeek - buckets by Monday-start UTC week", () => {
  const monday = Date.UTC(2026, 8, 21, 9);
  const sunday = Date.UTC(2026, 8, 27, 23);
  const nextMonday = Date.UTC(2026, 8, 28, 0);

  assertEquals(countByWeek([monday, sunday, nextMonday]), [
    { weekStart: "2026-09-21", count: 2 },
    { weekStart: "2026-09-28", count: 1 },
  ]);
});

Deno.test("countByWeek - fills weeks with no events as zero", () => {
  const first = Date.UTC(2026, 8, 7);
  const third = Date.UTC(2026, 8, 21);

  assertEquals(countByWeek([third, first]), [
    { weekStart: "2026-09-07", count: 1 },
    { weekStart: "2026-09-14", count: 0 },
    { weekStart: "2026-09-21", count: 1 },
  ]);
});
