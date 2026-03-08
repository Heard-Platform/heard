import {
  assertEquals,
  assertAlmostEquals,
  assertGreater,
  assertLess,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import {
  recencyScore,
  sortRoomsByActivity,
  scoreRoom,
} from "./feed-utils.ts";
import { DebateRoom } from "./types.tsx";

const MIN = 60_000;
const HOUR = 60 * MIN;

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

  it("returns 0.5 at the 30-minute half-life", () => {
    assertEquals(recencyScore(30), 0.5);
  });

  it("returns 0.25 at 90 minutes", () => {
    assertEquals(recencyScore(90), 0.25);
  });

  it("returns 1/3 at 60 minutes", () => {
    assertEquals(recencyScore(60), 1 / 3);
  });

  it("decreases as time increases", () => {
    assertEquals(recencyScore(10) > recencyScore(30), true);
    assertEquals(recencyScore(30) > recencyScore(60), true);
    assertEquals(recencyScore(60) > recencyScore(120), true);
  });

  it("approaches zero for very old activity", () => {
    assertEquals(recencyScore(10_000) < 0.01, true);
  });
});

describe("scoreRoom", () => {
  it("scores 120 when both signals are current", () => {
    const now = Date.now();
    const room = makeRoom(now, { lastActivityAt: now, totalVotes: 0 });
    assertEquals(scoreRoom(room, now), 120);
  });

  it("scores 60 at the 30-minute half-life", () => {
    const now = Date.now();
    const createdAt = now - 30 * MIN;
    const lastActivityAt = now - 30 * MIN;
    const totalVotes = 0;
    const room = makeRoom(createdAt, { lastActivityAt, totalVotes });
    assertEquals(scoreRoom(room, now), 60);
  });

  it("adds votes to the activity weight", () => {
    const now = Date.now();
    const createdAt = now;
    const lastActivityAt = now;
    const totalVotes = 10;
    const room = makeRoom(createdAt, { lastActivityAt, totalVotes });
    const score = scoreRoom(room, now);
    assertGreater(score, 110);
    assertLess(score, 130);
  });

  it("treats lastActivity and createdAt as independent signals", () => {
    const now = Date.now();
    const createdAt = now - 60 * MIN;
    const lastActivityAt = now;
    const totalVotes = 0;
    const room = makeRoom(createdAt, { lastActivityAt, totalVotes });
    assertAlmostEquals(scoreRoom(room, now), 106 + 2 / 3, 1e-9);
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
    it("favors new over old if some activity", () => {
      const now = Date.now();
      const oldActive = makeRoom(now - 2 * HOUR, {lastActivityAt: now - 1 * MIN });
      const newQuiet = makeRoom(now - 1 * HOUR, {lastActivityAt: now - 10 * MIN });

      const result = sortRoomsByActivity([newQuiet, oldActive], now);
      assertEquals(result[0], oldActive);
      assertEquals(result[1], newQuiet);
    });

    it("falls back to createdAt when no activity", () => {
      const now = Date.now();
      const olderRoom = makeRoom(now - 2 * HOUR);
      const newerRoom = makeRoom(now - 1 * HOUR);

      const result = sortRoomsByActivity([olderRoom, newerRoom], now);
      assertEquals(result, [newerRoom, olderRoom]);
    });

    it("active old room outranks newer empty room", () => {
      const now = Date.now();
      const olderRoom = makeRoom(now - 4 * HOUR, { lastActivityAt: now - 1 * MIN });
      const newerRoom = makeRoom(now - 20 * MIN);

      const result = sortRoomsByActivity([newerRoom, olderRoom], now);
      assertEquals(result, [olderRoom, newerRoom]);
    });

    it("inactive old room ranks below brand-new empty room", () => {
      const now = Date.now();
      const newRoom = makeRoom(now);
      const olderRoom = makeRoom(now - 24 * HOUR);

      const result = sortRoomsByActivity([olderRoom, newRoom], now);
      assertEquals(result, [newRoom, olderRoom]);
    });

    it("puts very new room above huge slightly dormant older room, until it ages", () => {
      const now = Date.now();
      const newRoom = makeRoom(now - 5 * MIN);
      const olderRoom = makeRoom(now - 48 * HOUR, { lastActivityAt: now - 3 * HOUR, totalVotes: 300 });

      const result = sortRoomsByActivity([olderRoom, newRoom], now);
      assertEquals(result, [newRoom, olderRoom]);

      const agedNewRoom = { ...newRoom, lastActivityAt: now - 2 * HOUR, totalVotes: 2 };
      const resultAfterAging = sortRoomsByActivity([olderRoom, agedNewRoom], now);
      assertEquals(resultAfterAging, [olderRoom, agedNewRoom]);
    });
  });

  describe("Votes", () => {
    it("room with more votes ranks above room with equal activity but fewer votes", () => {
      const now = Date.now();
      const lastActivityAt = now - 5 * MIN;
      const manyVotesRoom = makeRoom(now - 2 * HOUR, {lastActivityAt, totalVotes: 70})
      const fewVotesRoom = makeRoom(now - 2 * HOUR, {lastActivityAt, totalVotes: 7});

      const result = sortRoomsByActivity([fewVotesRoom, manyVotesRoom], now);
      assertEquals(result, [manyVotesRoom, fewVotesRoom]);
    });

    it("votes do not rescue a dormant room from a new active room", () => {
      const now = Date.now();
      const dormantRoom = makeRoom(now - 12 * HOUR, {lastActivityAt: now - 3 * HOUR, totalVotes: 300});
      const activeRoom = makeRoom(now - 30 * MIN, {lastActivityAt: now - 2 * MIN, totalVotes: 0});

      const result = sortRoomsByActivity([dormantRoom, activeRoom], now);
      assertEquals(result, [activeRoom, dormantRoom]);
    });
  });

  describe("Mixed scenarios", () => {
    it("ranks recently active > brand-new > dormant", () => {
      const now = Date.now();
      const rwsActive = makeRoom(now - 5 * HOUR, { lastActivityAt: now - 2 * MIN });
      const rwsBrandNew = makeRoom(now - 10 * MIN);
      const rwsDormant = makeRoom(now - 24 * HOUR, { lastActivityAt: now - 20 * HOUR });

      const result = sortRoomsByActivity([rwsDormant, rwsBrandNew, rwsActive], now);

      assertEquals(result, [rwsActive, rwsBrandNew, rwsDormant]);
    });

    it("revived old room jumps above newer inactive rooms", () => {
      const now = Date.now();
      const rwsRevived = makeRoom(now - 6 * HOUR, { lastActivityAt: now - 3 * MIN });
      const rwsQuietNew = makeRoom(now - 30 * MIN);
      const rwsQuietNewer = makeRoom(now - 15 * MIN);

      const result = sortRoomsByActivity([rwsQuietNew, rwsQuietNewer, rwsRevived], now);

      assertEquals(result, [rwsRevived, rwsQuietNewer, rwsQuietNew]);
    });
  });

  describe("Slicing", () => {
    it("caps output at 20 rooms", () => {
      const now = Date.now();
      const rooms = Array.from({ length: 25 }, (_, i) =>
        makeRoom(now - i * MIN)
      );

      const result = sortRoomsByActivity(rooms, now);
      assertEquals(result.length, 20);
    });

    it("returns the 20 most recently active when given more than 20", () => {
      const now = Date.now();
      const rooms = Array.from({ length: 25 }, (_, i) =>
        makeRoom(now - i * MIN)
      );

      const result = sortRoomsByActivity(rooms, now);
      assertEquals(result[0].createdAt, now);
      assertEquals(result[19].createdAt, now - 19 * MIN);
    });
  });
});