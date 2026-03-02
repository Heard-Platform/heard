import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { sortRoomsByActivity } from "./debate-api.tsx";
import { DebateRoom, Statement } from "./types.tsx";

const MIN = 60_000;
const HOUR = 60 * MIN;

const makeRoom = (overrides: Partial<DebateRoom> = {}): DebateRoom => ({
  id: "room-1",
  topic: "Test topic",
  phase: "round1",
  gameNumber: 1,
  roundStartTime: Date.now(),
  participants: [],
  hostId: "host-1",
  isActive: true,
  createdAt: Date.now(),
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
  timestamp: Date.now(),
  round: 1,
  voters: {},
  ...overrides,
});

describe("sortRoomsByActivity", () => {
  describe("Edge cases", () => {
    it("returns empty array for empty input", () => {
      assertEquals(sortRoomsByActivity([], []), []);
    });

    it("returns single room unchanged", () => {
      const now = Date.now();
      const room = makeRoom({ id: "r1", createdAt: now });
      const result = sortRoomsByActivity([room], [[]]);
      assertEquals(result.length, 1);
      assertEquals(result[0].id, "r1");
    });
  });

  describe("Ordering by last activity", () => {
    it("sorts by most recent statement timestamp", () => {
      const now = Date.now();
      const roomA = makeRoom({ id: "a", createdAt: now - 2 * HOUR });
      const roomB = makeRoom({ id: "b", createdAt: now - 1 * HOUR });

      // roomA is older, but has a more recent statement
      const stmtsA = [makeStatement({ timestamp: now - 1 * MIN })];
      const stmtsB = [makeStatement({ timestamp: now - 10 * MIN })];

      const result = sortRoomsByActivity([roomB, roomA], [stmtsB, stmtsA]);
      assertEquals(result[0].id, "a");
      assertEquals(result[1].id, "b");
    });

    it("falls back to createdAt when no statements", () => {
      const now = Date.now();
      const older = makeRoom({ id: "older", createdAt: now - 2 * HOUR });
      const newer = makeRoom({ id: "newer", createdAt: now - 1 * HOUR });

      const result = sortRoomsByActivity([older, newer], [[], []]);
      assertEquals(result[0].id, "newer");
      assertEquals(result[1].id, "older");
    });

    it("uses latest statement when room has multiple", () => {
      const now = Date.now();
      const roomA = makeRoom({ id: "a", createdAt: now - 2 * HOUR });
      const roomB = makeRoom({ id: "b", createdAt: now - 2 * HOUR });

      const stmtsA = [
        makeStatement({ id: "s1", timestamp: now - 30 * MIN }),
        makeStatement({ id: "s2", timestamp: now - 5 * MIN }), // latest
      ];
      const stmtsB = [
        makeStatement({ id: "s3", timestamp: now - 10 * MIN }),
      ];

      const result = sortRoomsByActivity([roomB, roomA], [stmtsB, stmtsA]);
      assertEquals(result[0].id, "a"); // 5 min ago beats 10 min ago
      assertEquals(result[1].id, "b");
    });

    it("recent statement on old room outranks brand-new empty room", () => {
      const now = Date.now();
      const oldRoomWithRecentStmt = makeRoom({ id: "old", createdAt: now - 4 * HOUR });
      const newEmptyRoom = makeRoom({ id: "new", createdAt: now - 5 * MIN });

      const stmts = [makeStatement({ timestamp: now - 1 * MIN })];

      const result = sortRoomsByActivity(
        [newEmptyRoom, oldRoomWithRecentStmt],
        [[], stmts],
      );
      assertEquals(result[0].id, "old");
      assertEquals(result[1].id, "new");
    });

    it("inactive old room ranks below brand-new empty room", () => {
      const now = Date.now();
      const newRoom = makeRoom({ id: "new", createdAt: now });
      const staleRoom = makeRoom({ id: "stale", createdAt: now - 24 * HOUR });

      const result = sortRoomsByActivity([staleRoom, newRoom], [[], []]);
      assertEquals(result[0].id, "new");
      assertEquals(result[1].id, "stale");
    });
  });

  describe("Mixed scenarios", () => {
    it("ranks recently active > brand-new > dormant", () => {
      const now = Date.now();
      const recentlyActive = makeRoom({ id: "active", createdAt: now - 5 * HOUR });
      const brandNew = makeRoom({ id: "new", createdAt: now - 10 * MIN });
      const dormant = makeRoom({ id: "dormant", createdAt: now - 24 * HOUR });

      // active: last statement 2 min ago
      // brandNew: no statements, falls back to createdAt (10 min ago)
      // dormant: last statement 20 hours ago
      const result = sortRoomsByActivity(
        [dormant, brandNew, recentlyActive],
        [
          [makeStatement({ timestamp: now - 20 * HOUR })],
          [],
          [makeStatement({ timestamp: now - 2 * MIN })],
        ],
      );

      assertEquals(result[0].id, "active");
      assertEquals(result[1].id, "new");
      assertEquals(result[2].id, "dormant");
    });

    it("revived old room jumps above newer inactive rooms", () => {
      const now = Date.now();
      const revived = makeRoom({ id: "revived", createdAt: now - 6 * HOUR });
      const quietNew = makeRoom({ id: "quiet", createdAt: now - 30 * MIN });
      const quietNewer = makeRoom({ id: "quieter", createdAt: now - 15 * MIN });

      const result = sortRoomsByActivity(
        [quietNew, quietNewer, revived],
        [
          [],
          [],
          [makeStatement({ timestamp: now - 3 * MIN })],
        ],
      );

      assertEquals(result[0].id, "revived");   // 3 min ago
      assertEquals(result[1].id, "quieter");   // 15 min ago (createdAt)
      assertEquals(result[2].id, "quiet");     // 30 min ago (createdAt)
    });
  });

  describe("Slicing", () => {
    it("caps output at 20 rooms", () => {
      const now = Date.now();
      const rooms = Array.from({ length: 25 }, (_, i) =>
        makeRoom({ id: `room-${i}`, createdAt: now - i * MIN })
      );

      const result = sortRoomsByActivity(rooms, rooms.map(() => []));
      assertEquals(result.length, 20);
    });

    it("returns the 20 most recently active when given more than 20", () => {
      const now = Date.now();
      // room-0 most recent, room-24 oldest
      const rooms = Array.from({ length: 25 }, (_, i) =>
        makeRoom({ id: `room-${i}`, createdAt: now - i * MIN })
      );

      const result = sortRoomsByActivity(rooms, rooms.map(() => []));
      assertEquals(result[0].id, "room-0");
      assertEquals(result[19].id, "room-19");
    });
  });
});
