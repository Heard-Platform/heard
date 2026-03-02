import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { sortRoomsByActivity } from "./debate-api.tsx";
import { DebateRoom, Statement } from "./types.tsx";

const MIN = 60_000;
const HOUR = 60 * MIN;

const makeRoom = (now: number, overrides: Partial<DebateRoom> = {}): DebateRoom => ({
  id: "room-1",
  topic: "Test topic",
  phase: "round1",
  gameNumber: 1,
  roundStartTime: now,
  participants: [],
  hostId: "host-1",
  isActive: true,
  createdAt: now,
  mode: "realtime",
  ...overrides,
});

const makeStatement = (overrides: Partial<Statement> = {}): Statement => ({
  id: "stmt-1",
  text: "Test statement",
  author: "user-1",
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId: "room-1",
  timestamp: 0,
  round: 1,
  voters: {},
  ...overrides,
});

describe("sortRoomsByActivity", () => {
  describe("Edge cases", () => {
    it("returns empty array for empty input", () => {
      const now = Date.now();
      assertEquals(sortRoomsByActivity([], [], now), []);
    });

    it("returns single room unchanged", () => {
      const now = Date.now();
      const room = makeRoom(now, { id: "r1" });
      const result = sortRoomsByActivity([room], [[]], now);
      assertEquals(result.length, 1);
      assertEquals(result[0].id, "r1");
    });
  });

  describe("Ordering by last activity", () => {
    it("sorts by most recent statement timestamp", () => {
      const now = Date.now();
      const roomA = makeRoom(now, { id: "a", createdAt: now - 2 * HOUR });
      const roomB = makeRoom(now, { id: "b", createdAt: now - 1 * HOUR });

      // roomA is older, but has a more recent statement
      const stmtsA = [makeStatement({ timestamp: now - 1 * MIN })];
      const stmtsB = [makeStatement({ timestamp: now - 10 * MIN })];

      const result = sortRoomsByActivity([roomB, roomA], [stmtsB, stmtsA], now);
      assertEquals(result[0].id, "a");
      assertEquals(result[1].id, "b");
    });

    it("falls back to createdAt when no statements", () => {
      const now = Date.now();
      const older = makeRoom(now, { id: "older", createdAt: now - 2 * HOUR });
      const newer = makeRoom(now, { id: "newer", createdAt: now - 1 * HOUR });

      const result = sortRoomsByActivity([older, newer], [[], []], now);
      assertEquals(result[0].id, "newer");
      assertEquals(result[1].id, "older");
    });

    it("uses latest statement when room has multiple", () => {
      const now = Date.now();
      const roomA = makeRoom(now, { id: "a", createdAt: now - 2 * HOUR });
      const roomB = makeRoom(now, { id: "b", createdAt: now - 2 * HOUR });

      const stmtsA = [
        makeStatement({ id: "s1", timestamp: now - 30 * MIN }),
        makeStatement({ id: "s2", timestamp: now - 5 * MIN }), // latest
      ];
      const stmtsB = [
        makeStatement({ id: "s3", timestamp: now - 10 * MIN }),
      ];

      const result = sortRoomsByActivity([roomB, roomA], [stmtsB, stmtsA], now);
      assertEquals(result[0].id, "a"); // 5 min ago beats 10 min ago
      assertEquals(result[1].id, "b");
    });

    it("recent statement on old room outranks newer empty room", () => {
      const now = Date.now();
      const oldRoomWithRecentStmt = makeRoom(now, { id: "old", createdAt: now - 4 * HOUR });
      // 20-min-old empty room: score ≈ 72. Old room with stmt 1 min ago: score ≈ 99.
      const newerEmptyRoom = makeRoom(now, { id: "newer", createdAt: now - 20 * MIN });

      const stmts = [makeStatement({ timestamp: now - 1 * MIN })];

      const result = sortRoomsByActivity(
        [newerEmptyRoom, oldRoomWithRecentStmt],
        [[], stmts],
        now,
      );
      assertEquals(result[0].id, "old");
      assertEquals(result[1].id, "newer");
    });

    it("inactive old room ranks below brand-new empty room", () => {
      const now = Date.now();
      const newRoom = makeRoom(now, { id: "new" });
      const staleRoom = makeRoom(now, { id: "stale", createdAt: now - 24 * HOUR });

      const result = sortRoomsByActivity([staleRoom, newRoom], [[], []], now);
      assertEquals(result[0].id, "new");
      assertEquals(result[1].id, "stale");
    });
  });

  describe("Votes", () => {
    it("room with more votes ranks above room with equal activity but fewer votes", () => {
      const now = Date.now();
      const lastStmt = now - 5 * MIN;
      const roomA = makeRoom(now, { id: "a", createdAt: now - 2 * HOUR });
      const roomB = makeRoom(now, { id: "b", createdAt: now - 2 * HOUR });

      const stmtsA = [
        makeStatement({ timestamp: lastStmt, agrees: 50, disagrees: 20 }), // 70 votes
      ];
      const stmtsB = [
        makeStatement({ timestamp: lastStmt, agrees: 5, disagrees: 2 }),   // 7 votes
      ];

      const result = sortRoomsByActivity([roomB, roomA], [stmtsB, stmtsA], now);
      assertEquals(result[0].id, "a");
      assertEquals(result[1].id, "b");
    });

    it("votes do not rescue a dormant room from a new active room", () => {
      const now = Date.now();
      const dormantPopular = makeRoom(now, { id: "dormant", createdAt: now - 12 * HOUR });
      const newActive = makeRoom(now, { id: "active", createdAt: now - 30 * MIN });

      const dormantStmts = [
        makeStatement({ timestamp: now - 3 * HOUR, agrees: 200, disagrees: 100 }), // 300 votes, 3 hrs ago
      ];
      const activeStmts = [
        makeStatement({ timestamp: now - 2 * MIN }), // 0 votes, 2 min ago
      ];

      const result = sortRoomsByActivity(
        [dormantPopular, newActive],
        [dormantStmts, activeStmts],
        now,
      );
      assertEquals(result[0].id, "active");
      assertEquals(result[1].id, "dormant");
    });
  });

  describe("Mixed scenarios", () => {
    it("ranks recently active > brand-new > dormant", () => {
      const now = Date.now();
      const recentlyActive = makeRoom(now, { id: "active", createdAt: now - 5 * HOUR });
      const brandNew = makeRoom(now, { id: "new", createdAt: now - 10 * MIN });
      const dormant = makeRoom(now, { id: "dormant", createdAt: now - 24 * HOUR });

      // active: stmt 2 min ago (score ≈ 96)
      // brandNew: no stmts, createdAt 10 min ago (score = 90)
      // dormant: stmt 20 hrs ago (score ≈ 3)
      const result = sortRoomsByActivity(
        [dormant, brandNew, recentlyActive],
        [
          [makeStatement({ timestamp: now - 20 * HOUR })],
          [],
          [makeStatement({ timestamp: now - 2 * MIN })],
        ],
        now,
      );

      assertEquals(result[0].id, "active");
      assertEquals(result[1].id, "new");
      assertEquals(result[2].id, "dormant");
    });

    it("revived old room jumps above newer inactive rooms", () => {
      const now = Date.now();
      const revived = makeRoom(now, { id: "revived", createdAt: now - 6 * HOUR });
      const quietNew = makeRoom(now, { id: "quiet", createdAt: now - 30 * MIN });
      const quietNewer = makeRoom(now, { id: "quieter", createdAt: now - 15 * MIN });

      // revived: stmt 3 min ago (score ≈ 92)
      // quietNewer: no stmts, 15 min old (score = 80)
      // quietNew: no stmts, 30 min old (score = 60)
      const result = sortRoomsByActivity(
        [quietNew, quietNewer, revived],
        [
          [],
          [],
          [makeStatement({ timestamp: now - 3 * MIN })],
        ],
        now,
      );

      assertEquals(result[0].id, "revived");
      assertEquals(result[1].id, "quieter");
      assertEquals(result[2].id, "quiet");
    });
  });

  describe("Slicing", () => {
    it("caps output at 20 rooms", () => {
      const now = Date.now();
      const rooms = Array.from({ length: 25 }, (_, i) =>
        makeRoom(now, { id: `room-${i}`, createdAt: now - i * MIN })
      );

      const result = sortRoomsByActivity(rooms, rooms.map(() => []), now);
      assertEquals(result.length, 20);
    });

    it("returns the 20 most recently active when given more than 20", () => {
      const now = Date.now();
      // room-0 most recent, room-24 oldest
      const rooms = Array.from({ length: 25 }, (_, i) =>
        makeRoom(now, { id: `room-${i}`, createdAt: now - i * MIN })
      );

      const result = sortRoomsByActivity(rooms, rooms.map(() => []), now);
      assertEquals(result[0].id, "room-0");
      assertEquals(result[19].id, "room-19");
    });
  });
});
