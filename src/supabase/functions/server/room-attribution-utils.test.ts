import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import {
  computeReferralEventSummary,
  computeRoomTrafficSources,
} from "./room-attribution-utils.ts";
import { DebateRoom, User, UserEvent } from "./types.tsx";

const ROOM_ID = "room-1";

const makeRoom = (
  overrides: Partial<DebateRoom> = {},
): Pick<DebateRoom, "id" | "hostId" | "cohostIds"> => ({
  id: ROOM_ID,
  hostId: "host-1",
  ...overrides,
});

const makeUser = (id: string, overrides: Partial<User> = {}): User => ({
  id,
  nickname: id,
  email: `${id}@example.com`,
  score: 0,
  streak: 0,
  lastActive: 0,
  emailDigestsEnabled: false,
  createdAt: 0,
  ...overrides,
});

const makeUsers = (ids: string[]): User[] => ids.map((id) => makeUser(id));

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

describe("computeRoomTrafficSources", () => {
  it("counts a newsletter join", () => {
    const room = makeRoom();
    const result = computeRoomTrafficSources(
      room,
      ["user-1"],
      [makeEvent()],
      makeUsers(["user-1"]),
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
    const room = makeRoom();
    const participantIds = ["user-1", "user-2", "user-3"];
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
      participantIds,
      events,
      makeUsers(participantIds),
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
    const room = makeRoom();
    const events: UserEvent[] = [
      makeEvent({ type: "referred_by_social", userId: "user-1" }),
    ];
    const result = computeRoomTrafficSources(
      room,
      ["user-1"],
      events,
      makeUsers(["user-1"]),
    );

    assertEquals(result.trafficSources[4], {
      key: "social",
      count: 1,
    });
  });

  it("counts a flyer signup", () => {
    const room = makeRoom();
    const users = [
      makeUser("user-1", { flyerId: ROOM_ID, createdAt: 500 }),
      makeUser("user-2"),
    ];
    const result = computeRoomTrafficSources(
      room,
      ["user-1", "user-2"],
      [],
      users,
    );

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
    const room = makeRoom();
    const users = [
      makeUser("user-1"),
      makeUser("some-other-user", { flyerId: ROOM_ID, createdAt: 500 }),
    ];
    const result = computeRoomTrafficSources(room, ["user-1"], [], users);

    assertEquals(result.trafficSources[3], {
      key: "flyer",
      count: 0,
    });
  });

  it("counts a direct link landing (plain /room/:id, no ?src=)", () => {
    const room = makeRoom();
    const events: UserEvent[] = [makeDirectLinkEvent("user-1", 1000)];
    const result = computeRoomTrafficSources(
      room,
      ["user-1"],
      events,
      makeUsers(["user-1"]),
    );

    assertEquals(result.trafficSources[0], {
      key: "direct",
      count: 1,
    });
  });

  it("does not count a tagged link's initial_load as direct", () => {
    const room = makeRoom();
    const events: UserEvent[] = [
      {
        ...makeDirectLinkEvent("user-1", 1000),
        url: `https://heard.vote/room/${ROOM_ID}?src=newsletter`,
      },
    ];
    const result = computeRoomTrafficSources(
      room,
      ["user-1"],
      events,
      makeUsers(["user-1"]),
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
    const room = makeRoom();
    const events: UserEvent[] = [
      makeDirectLinkEvent("user-1", 1000, "some-other-room"),
    ];
    const result = computeRoomTrafficSources(
      room,
      ["user-1"],
      events,
      makeUsers(["user-1"]),
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
    const room = makeRoom();
    const participantIds = ["user-1", "user-2"];
    const result = computeRoomTrafficSources(
      room,
      participantIds,
      [makeEvent({ userId: "user-1" })],
      makeUsers(participantIds),
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
    const room = makeRoom();
    const participantIds = ["user-1", "user-2", "user-3"];
    const result = computeRoomTrafficSources(
      room,
      participantIds,
      [],
      makeUsers(participantIds),
    );

    assertEquals(result.trafficSources[5], {
      key: "other",
      count: 3,
    });
    assertEquals(result.referrers, []);
  });

  it("ignores events for users who never actually joined the room", () => {
    const room = makeRoom();
    const events: UserEvent[] = [
      makeEvent({ userId: "user-1" }),
      makeEvent({ userId: "user-not-a-participant" }),
    ];
    const result = computeRoomTrafficSources(
      room,
      ["user-1"],
      events,
      makeUsers(["user-1"]),
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

  it("excludes participants who aren't in the provided real users list", () => {
    const room = makeRoom();
    const result = computeRoomTrafficSources(
      room,
      ["user-1", "bot-user"],
      [],
      makeUsers(["user-1"]),
    );

    assertEquals(result.trafficSources[5], {
      key: "other",
      count: 1,
    });
  });

  it("excludes the host and cohosts from participants and from other", () => {
    const room = makeRoom({
      hostId: "host-1",
      cohostIds: ["cohost-1"],
    });
    const participantIds = ["host-1", "cohost-1", "user-1"];
    const result = computeRoomTrafficSources(
      room,
      participantIds,
      [],
      makeUsers(participantIds),
    );

    assertEquals(result.trafficSources[5], {
      key: "other",
      count: 1,
    });
  });

  it("attributes a user to their earliest signal across all signal types", () => {
    const room = makeRoom();
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
    const users = [
      makeUser("user-1", { flyerId: ROOM_ID, createdAt: 500 }),
    ];
    const result = computeRoomTrafficSources(
      room,
      ["user-1"],
      events,
      users,
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
    const room = makeRoom();
    const events: UserEvent[] = [
      makeEvent({
        type: "referred_by_user",
        userId: "user-1",
        referralUserId: undefined,
      }),
    ];
    const result = computeRoomTrafficSources(
      room,
      ["user-1"],
      events,
      makeUsers(["user-1"]),
    );

    assertEquals(result.trafficSources[2], {
      key: "referral",
      count: 1,
    });
    assertEquals(result.referrers, []);
  });

  it("defaults everyone to named when no one is anonymous", () => {
    const room = makeRoom();
    const participantIds = ["user-1", "user-2"];
    const result = computeRoomTrafficSources(
      room,
      participantIds,
      [],
      makeUsers(participantIds),
    );

    assertEquals(result.anonymity, { anonymous: 0, named: 2 });
  });

  it("splits participants into anonymous and named", () => {
    const users = [
      makeUser("user-1", { isAnonymous: true }),
      makeUser("user-2", { isAnonymous: true }),
      makeUser("user-3"),
    ];
    const result = computeRoomTrafficSources(
      makeRoom(),
      ["user-1", "user-2", "user-3"],
      [],
      users,
    );

    assertEquals(result.anonymity, { anonymous: 2, named: 1 });
  });

  it("excludes the host and cohosts from the anonymity breakdown", () => {
    const room = makeRoom({
      hostId: "host-1",
      cohostIds: ["cohost-1"],
    });
    const users = [
      makeUser("host-1", { isAnonymous: true }),
      makeUser("cohost-1", { isAnonymous: true }),
      makeUser("user-1"),
    ];
    const result = computeRoomTrafficSources(
      room,
      ["host-1", "cohost-1", "user-1"],
      [],
      users,
    );

    assertEquals(result.anonymity, { anonymous: 0, named: 1 });
  });

  it("dedupes repeat events from the same user, keeping only the earliest", () => {
    const room = makeRoom();
    const events: UserEvent[] = [
      makeEvent({ userId: "user-1", createdAt: 3000 }),
      makeEvent({ userId: "user-1", createdAt: 1000 }),
      makeEvent({ userId: "user-1", createdAt: 2000 }),
    ];
    const result = computeRoomTrafficSources(
      room,
      ["user-1"],
      events,
      makeUsers(["user-1"]),
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
