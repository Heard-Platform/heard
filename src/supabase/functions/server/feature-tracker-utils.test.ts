import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { averageVotesPerSessionByWeek, buildFlyerLandingFunnel, buildFlyerSwipeFunnel, countByWeek } from "./feature-tracker-utils.ts";

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

Deno.test("buildFlyerSwipeFunnel - counts unique users reaching each swipe, saving, and exiting", () => {
  const events = [
    { type: "flyer_swipe_opened", userId: "u1" },
    { type: "flyer_swipe_card_1_agree", userId: "u1" },
    { type: "flyer_swipe_card_2_pass", userId: "u1" },
    { type: "flyer_results_get_results_clicked", userId: "u1" },
    { type: "flyer_swipe_opened", userId: "u2" },
    { type: "flyer_swipe_opened", userId: "u2" },
    { type: "flyer_swipe_card_1_disagree", userId: "u2" },
    { type: "flyer_swipe_card_1_agree", userId: "u2" },
    { type: "flyer_swipe_closed_2", userId: "u2" },
    { type: "flyer_swipe_opened", userId: "u3" },
    { type: "flyer_swipe_card_1_agree", userId: "u3" },
    { type: "flyer_swipe_card_2_agree", userId: "u3" },
    { type: "flyer_swipe_just_looking_clicked", userId: "u3" },
  ];

  assertEquals(buildFlyerSwipeFunnel(events), { opened: 3, swipes: [3, 2], saved: 1, exited: 1 });
});

Deno.test("buildFlyerSwipeFunnel - ignores users who never opened the swipe flow", () => {
  const events = [
    { type: "flyer_results_get_results_clicked", userId: "legacy" },
    { type: "flyer_swipe_card_1_agree", userId: null },
  ];

  assertEquals(buildFlyerSwipeFunnel(events), { opened: 0, swipes: [], saved: 0, exited: 0 });
});

Deno.test("buildFlyerSwipeFunnel - counts a user who saved and then exited only as saved", () => {
  const events = [
    { type: "flyer_swipe_opened", userId: "u1" },
    { type: "flyer_results_get_results_clicked", userId: "u1" },
    { type: "flyer_swipe_just_looking_clicked", userId: "u1" },
  ];

  assertEquals(buildFlyerSwipeFunnel(events), { opened: 1, swipes: [], saved: 1, exited: 0 });
});

Deno.test("buildFlyerLandingFunnel - counts unique users at each step", () => {
  const events = [
    { type: "flyer_landing_opened", userId: "u1" },
    { type: "flyer_landing_opened", userId: "u1" },
    { type: "flyer_landing_email_submitted", userId: "u1" },
    { type: "flyer_landing_looked_around", userId: "u1" },
    { type: "flyer_landing_opened", userId: "u2" },
    { type: "flyer_landing_email_submitted", userId: "u2" },
    { type: "flyer_landing_opened", userId: "u3" },
  ];

  assertEquals(buildFlyerLandingFunnel(events), { opened: 3, submitted: 2, lookedAround: 1 });
});

Deno.test("buildFlyerLandingFunnel - counts users whose id changed after logging in with a code", () => {
  const events = [
    { type: "flyer_landing_opened", userId: "anon-1" },
    { type: "flyer_landing_email_submitted", userId: "existing-account" },
    { type: "flyer_landing_looked_around", userId: "existing-account" },
  ];

  assertEquals(buildFlyerLandingFunnel(events), { opened: 1, submitted: 1, lookedAround: 1 });
});

Deno.test("buildFlyerLandingFunnel - ignores events without a user", () => {
  const events = [{ type: "flyer_landing_opened", userId: null }];

  assertEquals(buildFlyerLandingFunnel(events), { opened: 0, submitted: 0, lookedAround: 0 });
});
