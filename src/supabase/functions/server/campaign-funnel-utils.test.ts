import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildCampaignFunnel, type CampaignConfig, type CampaignFunnelInput } from "./campaign-funnel-utils.ts";
import type { User, Vote } from "./types.tsx";

const CAMPAIGN: CampaignConfig = {
  name: "Waymo flyering",
  roomId: "waymo-room",
  flyerId: "waymo-room",
  directUrlFlyers: ["waymo"],
  flyerScreenEmailEventTypes: ["personal_flyer_screen_email_added"],
};

const ALL_TIME = { from: null, to: 10_000 };

const makeUser = (id: string, overrides: Partial<User> = {}): User =>
  ({ id, email: "", isAnonymous: true, createdAt: 0, ...overrides }) as User;

const makeVote = (userId: string, statementId: string, timestamp: number, overrides: Partial<Vote> = {}): Vote => ({
  id: `${statementId}:${userId}`,
  statementId,
  userId,
  voteType: "agree",
  timestamp,
  ...overrides,
});

const flyerVote = (userId: string, timestamp: number, overrides: Partial<Vote> = {}) =>
  makeVote(userId, "waymo-statement", timestamp, { flyerId: "waymo-room", ...overrides });

const emptyInput = (): CampaignFunnelInput => ({
  users: [],
  votes: [],
  statements: [],
  campaignRoomStatementIds: ["waymo-statement", "waymo-statement-2"],
  roomViews: [],
  directUrlScans: [],
  flyerScreenEmailEvents: [],
});

Deno.test("buildCampaignFunnel - attributes each person to the channel they arrived through first", () => {
  const input = emptyInput();
  input.users = [makeUser("scanner"), makeUser("visitor"), makeUser("both")];
  input.votes = [flyerVote("scanner", 100), flyerVote("both", 100)];
  input.directUrlScans = [
    { userId: "visitor", createdAt: 100 },
    { userId: "both", createdAt: 200 },
    { userId: null, createdAt: 100 },
  ];

  const funnel = buildCampaignFunnel(input, CAMPAIGN, ALL_TIME);

  assertEquals(funnel.flyerScan.arrived, 2);
  assertEquals(funnel.directUrl.arrived, 1);
  assertEquals(funnel.arrivedViaBoth, 1);
});

Deno.test("buildCampaignFunnel - only includes arrivals inside the range", () => {
  const input = emptyInput();
  input.users = [makeUser("early"), makeUser("late")];
  input.votes = [flyerVote("early", 100), flyerVote("late", 900)];

  const funnel = buildCampaignFunnel(input, CAMPAIGN, { from: 500, to: 1000 });

  assertEquals(funnel.flyerScan.arrived, 1);
});

Deno.test("buildCampaignFunnel - excludes developers and test users", () => {
  const input = emptyInput();
  input.users = [makeUser("dev", { isDeveloper: true }), makeUser("tester", { isTestUser: true })];
  input.votes = [flyerVote("dev", 100), flyerVote("tester", 100)];

  assertEquals(buildCampaignFunnel(input, CAMPAIGN, ALL_TIME).flyerScan.arrived, 0);
});

Deno.test("buildCampaignFunnel - counts votes, responses and other posts only after arriving", () => {
  const input = emptyInput();
  input.users = [makeUser("engaged"), makeUser("regular")];
  input.votes = [
    flyerVote("engaged", 100),
    makeVote("engaged", "other-statement", 200),
    flyerVote("regular", 500),
    makeVote("regular", "other-statement", 50),
  ];
  input.statements.push(
    { author: "engaged", timestamp: 300 },
    { author: "regular", timestamp: 10 },
  );
  input.roomViews = [
    { userId: "engaged", roomId: "other-room", lastSeenAt: 200 },
    { userId: "engaged", roomId: "waymo-room", lastSeenAt: 200 },
    { userId: "regular", roomId: "waymo-room", lastSeenAt: 600 },
  ];

  const funnel = buildCampaignFunnel(input, CAMPAIGN, ALL_TIME);

  assertEquals(funnel.flyerScan.votedMoreThanOnce, 1);
  assertEquals(funnel.flyerScan.addedResponse, 1);
  assertEquals(funnel.flyerScan.viewedSecondPost, 1);
  assertEquals(funnel.flyerScan.votedOnSecondPost, 1);
});

Deno.test("buildCampaignFunnel - counts people who did any later step once", () => {
  const input = emptyInput();
  input.users = [makeUser("voter"), makeUser("viewer"), makeUser("scan-only")];
  input.votes = [
    flyerVote("voter", 100),
    makeVote("voter", "other-statement", 200),
    flyerVote("viewer", 100),
    flyerVote("scan-only", 100),
  ];
  input.roomViews = [{ userId: "viewer", roomId: "other-room", lastSeenAt: 200 }];

  assertEquals(buildCampaignFunnel(input, CAMPAIGN, ALL_TIME).flyerScan.didAnythingMore, 2);
});

Deno.test("buildCampaignFunnel - follows anonymous users merged into an account", () => {
  const input = emptyInput();
  input.users = [
    makeUser("anon", { mergedIntoUserId: "account" }),
    makeUser("account", { email: "a@example.com", isAnonymous: false }),
  ];
  input.votes = [
    flyerVote("account", 100, { anonymousUserId: "anon" }),
    makeVote("account", "waymo-statement-2", 200, { anonymousUserId: "anon" }),
  ];
  input.directUrlScans = [{ userId: "anon", createdAt: 150 }];
  input.flyerScreenEmailEvents = [{ userId: "anon", createdAt: 120 }];

  const funnel = buildCampaignFunnel(input, CAMPAIGN, ALL_TIME);

  assertEquals(funnel.arrivedViaBoth, 1);
  assertEquals(funnel.flyerScan.votedMoreThanOnce, 1);
  assertEquals(funnel.flyerScan.addedEmailOnFlyerScreen, 1);
  assertEquals(funnel.flyerScan.addedEmailLater, 0);
});

Deno.test("buildCampaignFunnel - counts emails added after the flyer screen only for people who arrived anonymous", () => {
  const input = emptyInput();
  input.users = [
    makeUser("upgraded", { email: "u@example.com", isAnonymous: false, upgradedFromAnonymousAt: 500 }),
    makeUser("anon", { mergedIntoUserId: "returning" }),
    makeUser("returning", { email: "r@example.com", isAnonymous: false }),
    makeUser("existing", { email: "e@example.com", isAnonymous: false }),
    makeUser("still-anon"),
  ];
  input.votes = [
    flyerVote("upgraded", 100),
    flyerVote("returning", 100, { anonymousUserId: "anon" }),
    flyerVote("existing", 100),
    flyerVote("still-anon", 100),
  ];

  assertEquals(buildCampaignFunnel(input, CAMPAIGN, ALL_TIME).flyerScan.addedEmailLater, 2);
});

Deno.test("buildCampaignFunnel - credits later steps to the direct URL channel when that came first", () => {
  const input = emptyInput();
  input.users = [makeUser("visitor")];
  input.directUrlScans = [{ userId: "visitor", createdAt: 100 }];
  input.votes = [flyerVote("visitor", 200), makeVote("visitor", "other-statement", 300)];

  const funnel = buildCampaignFunnel(input, CAMPAIGN, ALL_TIME);

  assertEquals(funnel.directUrl.arrived, 1);
  assertEquals(funnel.directUrl.votedOnSecondPost, 1);
  assertEquals(funnel.flyerScan.arrived, 0);
});
