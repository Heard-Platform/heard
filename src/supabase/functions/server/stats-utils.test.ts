import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { generateSparklineData, medianSessionMinutesByWeek } from "./stats-utils.ts";

Deno.test(
  "generateSparklineData - creates correct number of buckets",
  () => {
    const now = new Date("2024-12-10T12:00:00Z").getTime();
    const daysBack = 7;
    const result = generateSparklineData([], daysBack, now);
    assertEquals(result.length, 7);
  },
);

Deno.test(
  "generateSparklineData - correctly calculates bucket values",
  () => {
    const now = new Date(1765325954782).getTime();
    const daysBack = 7;
    const data = [{ createdAt: 1765313327658 }];

    const result = generateSparklineData(data, daysBack, now);
    assertEquals(result[6].count, 1);
  },
);

const MINUTE = 60 * 1000;
const MONDAY = Date.UTC(2026, 8, 21, 9);
const NEXT_MONDAY = Date.UTC(2026, 8, 28, 9);

Deno.test("medianSessionMinutesByWeek - takes the median first-to-last vote time of multi-vote sessions", () => {
  const votes = [
    { userId: "u1", timestamp: MONDAY },
    { userId: "u1", timestamp: MONDAY + 4 * MINUTE },
    { userId: "u1", timestamp: MONDAY + 60 * MINUTE },
    { userId: "u2", timestamp: MONDAY },
    { userId: "u2", timestamp: MONDAY + 2 * MINUTE },
    { userId: "u3", timestamp: MONDAY },
    { userId: "u3", timestamp: MONDAY + 10 * MINUTE },
  ];

  assertEquals(medianSessionMinutesByWeek(votes, NEXT_MONDAY), [
    { weekStart: "2026-09-21", medianMinutes: 4, sessions: 3 },
  ]);
});

Deno.test("medianSessionMinutesByWeek - averages the middle two for an even count", () => {
  const votes = [
    { userId: "u1", timestamp: MONDAY },
    { userId: "u1", timestamp: MONDAY + 2 * MINUTE },
    { userId: "u2", timestamp: MONDAY },
    { userId: "u2", timestamp: MONDAY + 5 * MINUTE },
  ];

  assertEquals(medianSessionMinutesByWeek(votes, NEXT_MONDAY), [
    { weekStart: "2026-09-21", medianMinutes: 3.5, sessions: 2 },
  ]);
});

Deno.test("medianSessionMinutesByWeek - leaves out single-vote sessions and weeks with only those", () => {
  const votes = [
    { userId: "u1", timestamp: MONDAY },
    { userId: "u2", timestamp: NEXT_MONDAY },
    { userId: "u2", timestamp: NEXT_MONDAY + 6 * MINUTE },
    { userId: "u3", timestamp: NEXT_MONDAY },
  ];

  assertEquals(medianSessionMinutesByWeek(votes, NEXT_MONDAY), [
    { weekStart: "2026-09-28", medianMinutes: 6, sessions: 1 },
  ]);
});

Deno.test("medianSessionMinutesByWeek - ignores sessions older than the window", () => {
  const votes = [
    { userId: "u1", timestamp: Date.UTC(2025, 0, 1) },
    { userId: "u1", timestamp: Date.UTC(2025, 0, 1) + MINUTE },
  ];
  assertEquals(medianSessionMinutesByWeek(votes, NEXT_MONDAY), []);
});
