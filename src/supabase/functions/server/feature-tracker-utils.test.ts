import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildFlyerLandingFunnel, buildFlyerScreenFunnel, buildFlyerSwipeFunnel, countByWeek } from "./feature-tracker-utils.ts";

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

const OCT_3_NOON_ET = Date.parse("2026-10-03T16:00:00Z");
const OCT_4_NOON_ET = Date.parse("2026-10-04T16:00:00Z");
const OCT_4_LATE_ET = Date.parse("2026-10-05T02:00:00Z");
const OCT_5_NOON_ET = Date.parse("2026-10-05T16:00:00Z");
const OCT_6_NOON_ET = Date.parse("2026-10-06T16:00:00Z");

Deno.test("buildFlyerScreenFunnel - counts unique users at each step", () => {
  const events = [
    { type: "flyer_screen_opened", userId: "u1", createdAt: 0 },
    { type: "flyer_screen_opened", userId: "u2", createdAt: 0 },
    { type: "flyer_screen_opened", userId: "u3", createdAt: 0 },
    { type: "flyer_screen_email_added", userId: "u1", createdAt: 0 },
    { type: "flyer_screen_email_added", userId: "u2", createdAt: 0 },
    { type: "referred_by_flyer_welcome_email", userId: "u1", createdAt: OCT_4_NOON_ET },
    { type: "referred_by_flyer_results_email", userId: "u1", createdAt: OCT_6_NOON_ET },
    { type: "referred_by_flyer_results_email", userId: "u2", createdAt: OCT_6_NOON_ET },
  ];

  assertEquals(buildFlyerScreenFunnel(events, []), {
    opened: 3,
    emailAdded: 2,
    returnedViaEmail: 2,
    returnedOnMultipleDays: 0,
  });
});

Deno.test("buildFlyerScreenFunnel - counts people who came back on 2+ Eastern days after adding their email, by any route", () => {
  const events = [
    { type: "flyer_screen_email_added", userId: "multi", createdAt: OCT_3_NOON_ET },
    { type: "flyer_screen_email_added", userId: "same-day", createdAt: OCT_3_NOON_ET },
    { type: "flyer_screen_email_added", userId: "before", createdAt: OCT_5_NOON_ET },
  ];
  const appLoads = [
    { userId: "multi", createdAt: OCT_4_NOON_ET },
    { userId: "multi", createdAt: OCT_6_NOON_ET },
    // 10 PM Eastern is the next day in UTC, but the same day in DC.
    { userId: "same-day", createdAt: OCT_4_NOON_ET },
    { userId: "same-day", createdAt: OCT_4_LATE_ET },
    // Loads before adding their email don't count.
    { userId: "before", createdAt: OCT_4_NOON_ET },
    { userId: "before", createdAt: OCT_6_NOON_ET },
  ];

  assertEquals(buildFlyerScreenFunnel(events, appLoads).returnedOnMultipleDays, 1);
});

Deno.test("buildFlyerScreenFunnel - ignores email returns from people who didn't add their email on the screen", () => {
  const events = [
    { type: "flyer_screen_email_added", userId: "screen-user", createdAt: 0 },
    { type: "referred_by_flyer_results_email", userId: "screen-user", createdAt: OCT_4_NOON_ET },
    { type: "referred_by_flyer_results_email", userId: "older-flyer-voter", createdAt: OCT_4_NOON_ET },
  ];
  const appLoads = [
    { userId: "older-flyer-voter", createdAt: OCT_4_NOON_ET },
    { userId: "older-flyer-voter", createdAt: OCT_6_NOON_ET },
  ];

  const funnel = buildFlyerScreenFunnel(events, appLoads);
  assertEquals(funnel.returnedViaEmail, 1);
  assertEquals(funnel.returnedOnMultipleDays, 0);
});
