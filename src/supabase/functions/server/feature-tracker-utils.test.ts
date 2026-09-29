import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { averageVotesPerSessionByWeek, countByWeek } from "./feature-tracker-utils.ts";

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

const MINUTE = 60 * 1000;
const MONDAY = Date.UTC(2026, 8, 21, 9);
const NEXT_MONDAY = Date.UTC(2026, 8, 28, 9);

Deno.test("averageVotesPerSessionByWeek - splits a user's votes into sessions on 15+ minute gaps", () => {
  const votes = [
    { userId: "u1", timestamp: MONDAY },
    { userId: "u1", timestamp: MONDAY + 5 * MINUTE },
    { userId: "u1", timestamp: MONDAY + 10 * MINUTE },
    { userId: "u1", timestamp: MONDAY + 60 * MINUTE },
  ];

  assertEquals(averageVotesPerSessionByWeek(votes, NEXT_MONDAY), [
    { weekStart: "2026-09-21", averageVotes: 2, sessions: 2 },
  ]);
});

Deno.test("averageVotesPerSessionByWeek - averages sessions across users per week", () => {
  const votes = [
    { userId: "u1", timestamp: MONDAY },
    { userId: "u2", timestamp: MONDAY },
    { userId: "u2", timestamp: MONDAY + MINUTE },
    { userId: "u3", timestamp: NEXT_MONDAY },
  ];

  assertEquals(averageVotesPerSessionByWeek(votes, NEXT_MONDAY), [
    { weekStart: "2026-09-21", averageVotes: 1.5, sessions: 2 },
    { weekStart: "2026-09-28", averageVotes: 1, sessions: 1 },
  ]);
});

Deno.test("averageVotesPerSessionByWeek - ignores sessions older than the window", () => {
  const votes = [{ userId: "u1", timestamp: Date.UTC(2025, 0, 1) }];
  assertEquals(averageVotesPerSessionByWeek(votes, NEXT_MONDAY), []);
});
