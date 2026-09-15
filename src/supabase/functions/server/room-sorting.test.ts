import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import {
  recencyScore,
  sortRoomsByActivity,
  sortRoomsForFeed,
  filterFeedRooms,
  scoreRoom,
} from "./feed-utils.ts";
import { Community, DebateRoom } from "./types.tsx";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const makeRoom = (createdAt: number, overrides: Partial<DebateRoom> = {}): DebateRoom => ({
  id: "room-1",
  topic: "Test topic",
  phase: "round1",
  gameNumber: 1,
  roundStartTime: createdAt,
  participants: [],
  hostId: "host-1",
  isActive: true,
  createdAt,
  mode: "realtime",
  totalVotes: 0,
  ...overrides,
});

describe("recencyScore", () => {
  it("returns 1 for zero minutes ago", () => {
    assertEquals(recencyScore(0), 1);
  });

  it("returns 0.5 at the 12-hour half-life", () => {
    assertEquals(recencyScore(12 * 60), 0.5);
  });

  it("returns 1/3 at 24 hours", () => {
    assertEquals(recencyScore(24 * 60), 1 / 3);
  });

  it("returns 0.25 at 36 hours", () => {
    assertEquals(recencyScore(36 * 60), 0.25);
  });

  it("decreases as time increases", () => {
    assertEquals(recencyScore(60) > recencyScore(360), true);
    assertEquals(recencyScore(360) > recencyScore(720), true);
    assertEquals(recencyScore(720) > recencyScore(1440), true);
  });

  it("approaches zero for very old activity", () => {
    assertEquals(recencyScore(100_000) < 0.01, true);
  });
});

describe("scoreRoom", () => {
  it("scores 100 when lastActivityAt is current", () => {
    const now = Date.now();
    const room = makeRoom(now, { lastActivityAt: now, totalVotes: 0 });
    assertEquals(scoreRoom(room, now), 100);
  });

  it("scores 0 for a room that has never had activity", () => {
    const now = Date.now();
    const room = makeRoom(now - 10 * DAY, { totalVotes: 50 });
    assertEquals(scoreRoom(room, now), 0);
  });

  it("scores 50 at the 12-hour half-life", () => {
    const now = Date.now();
    const room = makeRoom(now - 20 * HOUR, { lastActivityAt: now - 12 * HOUR });
    assertEquals(scoreRoom(room, now), 50);
  });

  it("adds votes to the activity weight", () => {
    const now = Date.now();
    const room = makeRoom(now, { lastActivityAt: now, totalVotes: 10 });
    assertEquals(scoreRoom(room, now), 106);
  });

  it("is unaffected by createdAt", () => {
    const now = Date.now();
    const lastActivityAt = now - 2 * HOUR;
    const recentlyCreated = makeRoom(now, { lastActivityAt });
    const longAgoCreated = makeRoom(now - 10 * DAY, { lastActivityAt });
    assertEquals(scoreRoom(recentlyCreated, now), scoreRoom(longAgoCreated, now));
  });
});

describe("sortRoomsByActivity", () => {
  describe("Edge cases", () => {
    it("returns empty array for empty input", () => {
      const now = Date.now();
      assertEquals(sortRoomsByActivity([], now), []);
    });

    it("returns single room unchanged", () => {
      const now = Date.now();
      const room = makeRoom(now);
      const result = sortRoomsByActivity([room], now);
      assertEquals(result.length, 1);
      assertEquals(result[0], room);
    });
  });

  describe("Ordering by last activity", () => {
    it("favors more recent activity over older activity", () => {
      const now = Date.now();
      const oldActive = makeRoom(now - 2 * HOUR, { lastActivityAt: now - 1 * MIN });
      const newQuiet = makeRoom(now - 1 * HOUR, { lastActivityAt: now - 10 * MIN });

      const result = sortRoomsByActivity([newQuiet, oldActive], now);
      assertEquals(result[0], oldActive);
      assertEquals(result[1], newQuiet);
    });

    it("does not fall back to createdAt for rooms that have never had activity", () => {
      const now = Date.now();
      const olderRoom = makeRoom(now - 2 * HOUR);
      const newerRoom = makeRoom(now - 1 * HOUR);

      const result = sortRoomsByActivity([olderRoom, newerRoom], now);
      assertEquals(result, [olderRoom, newerRoom]);
    });

    it("active old room outranks newer empty room", () => {
      const now = Date.now();
      const olderRoom = makeRoom(now - 4 * HOUR, { lastActivityAt: now - 1 * MIN });
      const newerRoom = makeRoom(now - 20 * MIN);

      const result = sortRoomsByActivity([newerRoom, olderRoom], now);
      assertEquals(result, [olderRoom, newerRoom]);
    });

    it("a room with any activity, however old, outranks a room that has never been touched", () => {
      const now = Date.now();
      const ancientlyActive = makeRoom(now - 30 * DAY, { lastActivityAt: now - 20 * DAY });
      const brandNewEmpty = makeRoom(now);

      const result = sortRoomsByActivity([brandNewEmpty, ancientlyActive], now);
      assertEquals(result, [ancientlyActive, brandNewEmpty]);
    });

    it("a very new empty room does not outrank an old but active room", () => {
      const now = Date.now();
      const newRoom = makeRoom(now - 5 * MIN);
      const olderActiveRoom = makeRoom(now - 48 * HOUR, { lastActivityAt: now - 3 * HOUR, totalVotes: 300 });

      const result = sortRoomsByActivity([olderActiveRoom, newRoom], now);
      assertEquals(result, [olderActiveRoom, newRoom]);
    });
  });

  describe("Votes", () => {
    it("room with more votes ranks above room with equal activity but fewer votes", () => {
      const now = Date.now();
      const lastActivityAt = now - 5 * MIN;
      const manyVotesRoom = makeRoom(now - 2 * HOUR, { lastActivityAt, totalVotes: 70 });
      const fewVotesRoom = makeRoom(now - 2 * HOUR, { lastActivityAt, totalVotes: 7 });

      const result = sortRoomsByActivity([fewVotesRoom, manyVotesRoom], now);
      assertEquals(result, [manyVotesRoom, fewVotesRoom]);
    });

    it("votes do not rescue a very stale room from a fresh active room", () => {
      const now = Date.now();
      const staleRoom = makeRoom(now - 6 * DAY, { lastActivityAt: now - 5 * DAY, totalVotes: 300 });
      const activeRoom = makeRoom(now - 30 * MIN, { lastActivityAt: now - 2 * MIN, totalVotes: 0 });

      const result = sortRoomsByActivity([staleRoom, activeRoom], now);
      assertEquals(result, [activeRoom, staleRoom]);
    });
  });

  describe("Mixed scenarios", () => {
    it("any real activity outranks a brand-new untouched room, no matter how stale", () => {
      const now = Date.now();
      const rwsActive = makeRoom(now - 5 * HOUR, { lastActivityAt: now - 2 * MIN });
      const rwsBrandNew = makeRoom(now - 10 * MIN);
      const rwsDormant = makeRoom(now - 24 * HOUR, { lastActivityAt: now - 20 * HOUR });

      const result = sortRoomsByActivity([rwsDormant, rwsBrandNew, rwsActive], now);

      assertEquals(result, [rwsActive, rwsDormant, rwsBrandNew]);
    });

    it("revived old room jumps above untouched newer rooms", () => {
      const now = Date.now();
      const rwsRevived = makeRoom(now - 6 * DAY, { lastActivityAt: now - 3 * MIN });
      const rwsQuietNew = makeRoom(now - 30 * MIN);
      const rwsQuietNewer = makeRoom(now - 15 * MIN);

      const result = sortRoomsByActivity([rwsQuietNew, rwsQuietNewer, rwsRevived], now);

      assertEquals(result, [rwsRevived, rwsQuietNew, rwsQuietNewer]);
    });
  });

});

describe("sortRoomsForFeed", () => {
  it("bubbles joined community rooms above higher-scoring non-joined rooms", () => {
    const now = Date.now();
    const joinedRoom = makeRoom(now - 2 * HOUR, {
      subHeard: "politics",
    });
    const betterRoom = makeRoom(now - 1 * MIN, {
      subHeard: "sports",
      lastActivityAt: now - 1 * MIN,
    });

    const result = sortRoomsForFeed(
      [betterRoom, joinedRoom],
      new Set(["politics"]),
      now,
    );

    assertEquals(result[0], joinedRoom);
    assertEquals(result[1], betterRoom);
  });

  it("preserves activity order within joined group", () => {
    const now = Date.now();
    const joinedActive = makeRoom(now - 1 * HOUR, {
      subHeard: "music",
      lastActivityAt: now - 1 * MIN,
    });
    const joinedDormant = makeRoom(now - 30 * MIN, {
      subHeard: "music",
    });

    const result = sortRoomsForFeed(
      [joinedDormant, joinedActive],
      new Set(["music"]),
      now,
    );

    assertEquals(result[0], joinedActive);
    assertEquals(result[1], joinedDormant);
  });

  it("preserves activity order within non-joined group", () => {
    const now = Date.now();
    const joinedRoom = makeRoom(now - 3 * HOUR, {
      subHeard: "politics",
    });
    const otherActive = makeRoom(now - 1 * HOUR, {
      subHeard: "sports",
      lastActivityAt: now - 2 * MIN,
    });
    const otherDormant = makeRoom(now - 30 * MIN, {
      subHeard: "tech",
    });

    const result = sortRoomsForFeed(
      [otherDormant, otherActive, joinedRoom],
      new Set(["politics"]),
      now,
    );

    assertEquals(result[0], joinedRoom);
    assertEquals(result[1], otherActive);
    assertEquals(result[2], otherDormant);
  });

  it("without memberships, sorts purely by activity score", () => {
    const now = Date.now();
    const olderJoined = makeRoom(now - 2 * HOUR, {
      subHeard: "politics",
    });
    const newerOther = makeRoom(now - 1 * MIN, {
      subHeard: "sports",
      lastActivityAt: now - 1 * MIN,
    });

    const result = sortRoomsForFeed(
      [olderJoined, newerOther],
      new Set(),
      now,
    );

    assertEquals(result[0], newerOther);
    assertEquals(result[1], olderJoined);
  });
});

const makeCommunity = (
  name: string,
  overrides: Partial<Community> = {},
): Community => ({
  name,
  adminId: "admin-1",
  isPrivate: false,
  hostOnlyPosting: false,
  ...overrides,
});

describe("filterFeedRooms", () => {
  it("shows public rooms to anyone", () => {
    const rooms = [makeRoom(Date.now(), { subHeard: "politics" })];
    const communities = [makeCommunity("politics")];
    const memberships = new Set<string>();
    const userId = "user-1";

    const result = filterFeedRooms(rooms, communities, memberships, userId);

    assertEquals(result, rooms);
  });

  it("hides private rooms from non-members", () => {
    const rooms = [makeRoom(Date.now(), { subHeard: "private-club" })];
    const communities = [makeCommunity("private-club", { isPrivate: true })];
    const memberships = new Set<string>();
    const userId = "user-1";

    const result = filterFeedRooms(rooms, communities, memberships, userId);

    assertEquals(result, []);
  });

  it("shows private rooms to members", () => {
    const rooms = [makeRoom(Date.now(), { subHeard: "private-club" })];
    const communities = [makeCommunity("private-club", { isPrivate: true })];
    const memberships = new Set(["private-club"]);
    const userId = "user-1";

    const result = filterFeedRooms(rooms, communities, memberships, userId);

    assertEquals(result, rooms);
  });

  it("shows private rooms to the admin", () => {
    const rooms = [makeRoom(Date.now(), { subHeard: "private-club" })];
    const communities = [
      makeCommunity("private-club", {
        isPrivate: true,
        adminId: "admin-1",
      }),
    ];
    const memberships = new Set<string>();
    const userId = "admin-1";

    const result = filterFeedRooms(rooms, communities, memberships, userId);

    assertEquals(result, rooms);
  });

  it("filters to a specific subHeard when provided", () => {
    const rooms = [
      makeRoom(Date.now(), { subHeard: "politics" }),
      makeRoom(Date.now(), { subHeard: "sports" }),
    ];
    const communities = [
      makeCommunity("politics"),
      makeCommunity("sports"),
    ];
    const memberships = new Set<string>();
    const userId = "user-1";
    const selectedSubheard = "politics";

    const result = filterFeedRooms(
      rooms,
      communities,
      memberships,
      userId,
      selectedSubheard,
    );

    assertEquals(result, [rooms[0]]);
  });
});
