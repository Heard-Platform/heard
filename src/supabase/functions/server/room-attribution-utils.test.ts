import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import {
  computeReferralEventSummary,
  computeRoomTrafficSources,
  FlyerUser,
} from "./room-attribution-utils.ts";
import { DebateRoom, UserEvent } from "./types.tsx";

const ROOM_ID = "room-1";

const makeRoom = (
  overrides: Partial<DebateRoom> = {},
): Pick<
  DebateRoom,
  "id" | "hostId" | "cohostIds" | "participants"
> => ({
  id: ROOM_ID,
  hostId: "host-1",
  participants: [],
  ...overrides,
});

const makeEvent = (
  overrides: Partial<UserEvent> = {},
): UserEvent => ({
  type: "referred_by_newsletter",
  userId: "user-1",
  roomId: ROOM_ID,
  createdAt: 1000,
  ...overrides,
});

const makeDirectLinkEvent = (
  userId: string,
  createdAt: number,
  roomId = ROOM_ID,
): UserEvent => ({
  type: "initial_load",
  userId,
  url: `https://heard.vote/room/${roomId}`,
  createdAt,
});

const noFlyerUsers = (): FlyerUser[] => [];

describe("computeRoomTrafficSources", () => {
  it("counts a newsletter join", () => {
    const room = makeRoom({ participants: ["user-1"] });
    const result = computeRoomTrafficSources(
      room,
      [makeEvent()],
      noFlyerUsers(),
    );

    assertEquals(result.trafficSources, [
      { key: "direct", count: 0 },
      { key: "newsletter", count: 1 },
      { key: "referral", count: 0 },
      { key: "flyer", count: 0 },
      { key: "social", count: 0 },
      { key: "other", count: 0 },
    ]);
    assertEquals(result.referrers, []);
  });

  it("counts a referral join and groups shares by referrer", () => {
    const room = makeRoom({
      participants: ["user-1", "user-2", "user-3"],
    });
    const events: UserEvent[] = [
      makeEvent({
        type: "referred_by_user",
        userId: "user-1",
        referralUserId: "sharer-a",
      }),
      makeEvent({
        type: "referred_by_user",
        userId: "user-2",
        referralUserId: "sharer-a",
      }),
      makeEvent({
        type: "referred_by_user",
        userId: "user-3",
        referralUserId: "sharer-b",
      }),
    ];
    const result = computeRoomTrafficSources(
      room,
      events,
      noFlyerUsers(),
    );

    assertEquals(result.trafficSources[2], {
      key: "referral",
      count: 3,
    });
    assertEquals(result.referrers, [
      { id: "referrer-0", shares: 2 },
      { id: "referrer-1", shares: 1 },
    ]);
  });

  it("counts a social join", () => {
    const room = makeRoom({ participants: ["user-1"] });
    const events: UserEvent[] = [
      makeEvent({ type: "referred_by_social", userId: "user-1" }),
    ];
    const result = computeRoomTrafficSources(
      room,
      events,
      noFlyerUsers(),
    );

    assertEquals(result.trafficSources[4], {
      key: "social",
      count: 1,
    });
  });

  it("counts a flyer signup", () => {
    const room = makeRoom({ participants: ["user-1", "user-2"] });
    const flyerUsers: FlyerUser[] = [
      { userId: "user-1", createdAt: 500 },
    ];
    const result = computeRoomTrafficSources(room, [], flyerUsers);

    assertEquals(result.trafficSources[3], {
      key: "flyer",
      count: 1,
    });
    assertEquals(result.trafficSources[5], {
      key: "other",
      count: 1,
    });
  });

  it("ignores a flyer signup for a user who isn't a participant of this room", () => {
    const room = makeRoom({ participants: ["user-1"] });
    const flyerUsers: FlyerUser[] = [
      { userId: "some-other-user", createdAt: 500 },
    ];
    const result = computeRoomTrafficSources(room, [], flyerUsers);

    assertEquals(result.trafficSources[3], {
      key: "flyer",
      count: 0,
    });
  });

  it("counts a direct link landing (plain /room/:id, no ?src=)", () => {
    const room = makeRoom({ participants: ["user-1"] });
    const events: UserEvent[] = [makeDirectLinkEvent("user-1", 1000)];
    const result = computeRoomTrafficSources(
      room,
      events,
      noFlyerUsers(),
    );

    assertEquals(result.trafficSources[0], {
      key: "direct",
      count: 1,
    });
  });

  it("does not count a tagged link's initial_load as direct", () => {
    const room = makeRoom({ participants: ["user-1"] });
    const events: UserEvent[] = [
      {
        ...makeDirectLinkEvent("user-1", 1000),
        url: `https://heard.vote/room/${ROOM_ID}?src=newsletter`,
      },
    ];
    const result = computeRoomTrafficSources(
      room,
      events,
      noFlyerUsers(),
    );

    assertEquals(result.trafficSources[0], {
      key: "direct",
      count: 0,
    });
    assertEquals(result.trafficSources[5], {
      key: "other",
      count: 1,
    });
  });

  it("ignores an initial_load for a different room", () => {
    const room = makeRoom({ participants: ["user-1"] });
    const events: UserEvent[] = [
      makeDirectLinkEvent("user-1", 1000, "some-other-room"),
    ];
    const result = computeRoomTrafficSources(
      room,
      events,
      noFlyerUsers(),
    );

    assertEquals(result.trafficSources[0], {
      key: "direct",
      count: 0,
    });
    assertEquals(result.trafficSources[5], {
      key: "other",
      count: 1,
    });
  });

  it("buckets an unattributed participant as other", () => {
    const room = makeRoom({ participants: ["user-1", "user-2"] });
    const result = computeRoomTrafficSources(
      room,
      [makeEvent({ userId: "user-1" })],
      noFlyerUsers(),
    );

    assertEquals(result.trafficSources[1], {
      key: "newsletter",
      count: 1,
    });
    assertEquals(result.trafficSources[5], {
      key: "other",
      count: 1,
    });
  });

  it("buckets everyone as other when there are no signals at all", () => {
    const room = makeRoom({
      participants: ["user-1", "user-2", "user-3"],
    });
    const result = computeRoomTrafficSources(
      room,
      [],
      noFlyerUsers(),
    );

    assertEquals(result.trafficSources[5], {
      key: "other",
      count: 3,
    });
    assertEquals(result.referrers, []);
  });

  it("ignores events for users who never actually joined the room", () => {
    const room = makeRoom({ participants: ["user-1"] });
    const events: UserEvent[] = [
      makeEvent({ userId: "user-1" }),
      makeEvent({ userId: "user-not-a-participant" }),
    ];
    const result = computeRoomTrafficSources(
      room,
      events,
      noFlyerUsers(),
    );

    assertEquals(result.trafficSources[1], {
      key: "newsletter",
      count: 1,
    });
    assertEquals(result.trafficSources[5], {
      key: "other",
      count: 0,
    });
  });

  it("excludes the host and cohosts from participants and from other", () => {
    const room = makeRoom({
      hostId: "host-1",
      cohostIds: ["cohost-1"],
      participants: ["host-1", "cohost-1", "user-1"],
    });
    const result = computeRoomTrafficSources(
      room,
      [],
      noFlyerUsers(),
    );

    assertEquals(result.trafficSources[5], {
      key: "other",
      count: 1,
    });
  });

  it("attributes a user to their earliest signal across all signal types", () => {
    const room = makeRoom({ participants: ["user-1"] });
    const events: UserEvent[] = [
      makeEvent({
        type: "referred_by_newsletter",
        userId: "user-1",
        createdAt: 3000,
      }),
      makeEvent({
        type: "referred_by_user",
        userId: "user-1",
        referralUserId: "sharer-a",
        createdAt: 2000,
      }),
      makeDirectLinkEvent("user-1", 1000),
    ];
    const flyerUsers: FlyerUser[] = [
      { userId: "user-1", createdAt: 500 },
    ];
    const result = computeRoomTrafficSources(
      room,
      events,
      flyerUsers,
    );

    // Flyer signup (500) predates everything else, so it wins even though a
    // newsletter and referral event also exist for this user in this room.
    assertEquals(result.trafficSources[3], {
      key: "flyer",
      count: 1,
    });
    assertEquals(result.trafficSources[0], {
      key: "direct",
      count: 0,
    });
    assertEquals(result.trafficSources[1], {
      key: "newsletter",
      count: 0,
    });
    assertEquals(result.trafficSources[2], {
      key: "referral",
      count: 0,
    });
    assertEquals(result.referrers, []);
  });

  it("handles a referral event with no referralUserId without crashing", () => {
    const room = makeRoom({ participants: ["user-1"] });
    const events: UserEvent[] = [
      makeEvent({
        type: "referred_by_user",
        userId: "user-1",
        referralUserId: undefined,
      }),
    ];
    const result = computeRoomTrafficSources(
      room,
      events,
      noFlyerUsers(),
    );

    assertEquals(result.trafficSources[2], {
      key: "referral",
      count: 1,
    });
    assertEquals(result.referrers, []);
  });

  it("defaults everyone to named when no anonymous set is given", () => {
    const room = makeRoom({ participants: ["user-1", "user-2"] });
    const result = computeRoomTrafficSources(room, [], noFlyerUsers());

    assertEquals(result.anonymity, { anonymous: 0, named: 2 });
  });

  it("splits participants into anonymous and named", () => {
    const room = makeRoom({
      participants: ["user-1", "user-2", "user-3"],
    });
    const result = computeRoomTrafficSources(
      room,
      [],
      noFlyerUsers(),
      new Set(["user-1", "user-2"]),
    );

    assertEquals(result.anonymity, { anonymous: 2, named: 1 });
  });

  it("excludes the host and cohosts from the anonymity breakdown", () => {
    const room = makeRoom({
      hostId: "host-1",
      cohostIds: ["cohost-1"],
      participants: ["host-1", "cohost-1", "user-1"],
    });
    const result = computeRoomTrafficSources(
      room,
      [],
      noFlyerUsers(),
      new Set(["host-1", "cohost-1"]),
    );

    assertEquals(result.anonymity, { anonymous: 0, named: 1 });
  });

  it("dedupes repeat events from the same user, keeping only the earliest", () => {
    const room = makeRoom({ participants: ["user-1"] });
    const events: UserEvent[] = [
      makeEvent({ userId: "user-1", createdAt: 3000 }),
      makeEvent({ userId: "user-1", createdAt: 1000 }),
      makeEvent({ userId: "user-1", createdAt: 2000 }),
    ];
    const result = computeRoomTrafficSources(
      room,
      events,
      noFlyerUsers(),
    );

    assertEquals(result.trafficSources[1], {
      key: "newsletter",
      count: 1,
    });
    assertEquals(result.trafficSources[5], {
      key: "other",
      count: 0,
    });
  });
});

describe("computeReferralEventSummary", () => {
  it("counts raw events by source across rooms", () => {
    const events: UserEvent[] = [
      makeEvent({ type: "referred_by_newsletter", roomId: "room-1" }),
      makeEvent({ type: "referred_by_newsletter", roomId: "room-2" }),
      makeEvent({ type: "referred_by_user", roomId: "room-1", referralUserId: "sharer-a" }),
    ];
    const result = computeReferralEventSummary(events);

    assertEquals(result.bySource, [
      { source: "newsletter", count: 2 },
      { source: "user", count: 1 },
    ]);
  });

  it("surfaces an unrecognized ?src= value as its own source", () => {
    const events: UserEvent[] = [makeEvent({ type: "referred_by_tiktok_campaign" })];
    const result = computeReferralEventSummary(events);

    assertEquals(result.bySource, [{ source: "tiktok_campaign", count: 1 }]);
  });

  it("returns empty summaries for no events", () => {
    const result = computeReferralEventSummary([]);
    assertEquals(result.bySource, []);
    assertEquals(result.referrals, []);
  });

  it("lists a referee for every source, not just referred_by_user", () => {
    const events: UserEvent[] = [
      makeEvent({ type: "referred_by_newsletter", userId: "user-1", roomId: "room-1", createdAt: 1000 }),
      makeEvent({ type: "referred_by_social", userId: "user-2", roomId: "room-1", createdAt: 2000 }),
    ];
    const result = computeReferralEventSummary(events);

    // Sorted most-recent-first.
    assertEquals(result.referrals, [
      { refereeUserId: "user-2", source: "social", roomId: "room-1", createdAt: 2000 },
      { refereeUserId: "user-1", source: "newsletter", roomId: "room-1", createdAt: 1000 },
    ]);
  });

  it("includes referrer fields only for referred_by_user rows", () => {
    const events: UserEvent[] = [
      makeEvent({ type: "referred_by_user", userId: "user-1", referralUserId: "sharer-a" }),
      makeEvent({ type: "referred_by_newsletter", userId: "user-2" }),
    ];
    const result = computeReferralEventSummary(events, {
      "user-1": "referee@example.com",
      "sharer-a": "sharer@example.com",
    });

    assertEquals(result.referrals[0], {
      refereeUserId: "user-1",
      refereeEmail: "refere••••@••••",
      source: "user",
      referrerUserId: "sharer-a",
      referrerEmail: "sharer••••@••••",
      roomId: ROOM_ID,
      createdAt: 1000,
    });
    assertEquals(result.referrals[1], {
      refereeUserId: "user-2",
      source: "newsletter",
      roomId: ROOM_ID,
      createdAt: 1000,
    });
  });

  it("omits referee/referrer emails when unknown, without crashing", () => {
    const events: UserEvent[] = [
      makeEvent({ type: "referred_by_user", userId: "user-1", referralUserId: undefined }),
    ];
    const result = computeReferralEventSummary(events, {});

    assertEquals(result.referrals, [
      { refereeUserId: "user-1", source: "user", roomId: ROOM_ID, createdAt: 1000 },
    ]);
  });

  it("skips events with no userId", () => {
    const events: UserEvent[] = [makeEvent({ userId: undefined })];
    const result = computeReferralEventSummary(events);

    assertEquals(result.bySource, [{ source: "newsletter", count: 1 }]);
    assertEquals(result.referrals, []);
  });
});
