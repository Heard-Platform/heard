import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { recencyScore, scoreRoom } from "./debate-api.tsx";
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

describe("recencyScore", () => {
  it("returns 1.0 for brand-new activity (0 minutes ago)", () => {
    assertEquals(recencyScore(0), 1.0);
  });

  it("returns 0.5 at the 30-minute half-life", () => {
    assertEquals(recencyScore(30), 0.5);
  });

  it("returns 0.25 at 90 minutes (two half-lives)", () => {
    assertEquals(recencyScore(90), 0.25);
  });

  it("decays toward 0 for very old activity", () => {
    const score = recencyScore(60 * 24 * 7); // 1 week
    assertEquals(score < 0.01, true);
  });
});

describe("scoreRoom", () => {
  describe("Brand-new room", () => {
    it("scores near maximum recency with no statements", () => {
      const now = Date.now();
      const room = makeRoom({ createdAt: now });
      const score = scoreRoom(room, [], now);
      // recencyScore(0)*80 = 80, no engagement bonus
      assertEquals(score, 80);
    });

    it("includes participant and statement bonuses", () => {
      const now = Date.now();
      const room = makeRoom({
        createdAt: now,
        participants: ["a", "b", "c"],
      });
      const stmts = [makeStatement({ timestamp: now })];
      const score = scoreRoom(room, stmts, now);
      // 80 (recency) + 15 (3 participants × 5) + 3 (1 stmt × 3) + 0 (votes) = 98
      assertEquals(score, 98);
    });
  });

  describe("Vote counts", () => {
    it("adds total votes across all vote types", () => {
      const now = Date.now();
      const room = makeRoom({ createdAt: now });
      const stmt = makeStatement({
        timestamp: now,
        agrees: 5,
        disagrees: 3,
        passes: 2,
        superAgrees: 1,
      });
      const score = scoreRoom(room, [stmt], now);
      // 80 (recency) + 3 (1 stmt) + 11 (total votes × 1) = 94
      assertEquals(score, 94);
    });

    it("sums votes across multiple statements", () => {
      const now = Date.now();
      const room = makeRoom({ createdAt: now });
      const stmts = [
        makeStatement({ id: "s1", timestamp: now, agrees: 10 }),
        makeStatement({ id: "s2", timestamp: now, agrees: 5, disagrees: 5 }),
      ];
      const score = scoreRoom(room, stmts, now);
      // 80 (recency) + 6 (2 stmts × 3) + 20 (total votes) = 106
      assertEquals(score, 106);
    });
  });

  describe("Recency decay", () => {
    it("scores lower for a room with older activity", () => {
      const now = Date.now();
      const newRoom = makeRoom({ createdAt: now });
      const oldRoom = makeRoom({ createdAt: now - 2 * HOUR });

      const newScore = scoreRoom(newRoom, [], now);
      const oldScore = scoreRoom(oldRoom, [], now);

      assertEquals(newScore > oldScore, true);
    });

    it("uses latest statement time when more recent than createdAt", () => {
      const now = Date.now();
      const room = makeRoom({ createdAt: now - 2 * HOUR });
      const recentStmt = makeStatement({ timestamp: now - 5 * MIN });

      const scoreWithRecentStmt = scoreRoom(room, [recentStmt], now);
      const scoreWithoutStmt = scoreRoom(room, [], now);

      assertEquals(scoreWithRecentStmt > scoreWithoutStmt, true);
    });
  });

  describe("Ranking order — active old room vs. inactive new room", () => {
    it("active old room outranks brand-new empty room", () => {
      const now = Date.now();

      const newEmptyRoom = makeRoom({
        id: "new",
        createdAt: now,
        participants: [],
      });

      const activeOldRoom = makeRoom({
        id: "old",
        createdAt: now - 2 * HOUR,
        participants: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
      });
      const activeOldStatements = [
        makeStatement({ id: "s1", roomId: "old", timestamp: now - 10 * MIN, agrees: 20, disagrees: 10 }),
        makeStatement({ id: "s2", roomId: "old", timestamp: now - 8 * MIN, agrees: 15, disagrees: 5 }),
        makeStatement({ id: "s3", roomId: "old", timestamp: now - 5 * MIN, agrees: 8 }),
      ];

      const newScore = scoreRoom(newEmptyRoom, [], now);
      const oldScore = scoreRoom(activeOldRoom, activeOldStatements, now);

      assertEquals(oldScore > newScore, true);
    });

    it("inactive old room ranks below brand-new empty room", () => {
      const now = Date.now();

      const newRoom = makeRoom({
        id: "new",
        createdAt: now,
        participants: [],
      });

      const staleRoom = makeRoom({
        id: "stale",
        createdAt: now - 24 * HOUR,
        participants: [],
      });

      const newScore = scoreRoom(newRoom, [], now);
      const staleScore = scoreRoom(staleRoom, [], now);

      assertEquals(newScore > staleScore, true);
    });
  });

  describe("Edge cases", () => {
    it("falls back to createdAt when no statements posted", () => {
      const now = Date.now();
      const room = makeRoom({ createdAt: now - HOUR });
      const score = scoreRoom(room, [], now);
      // recencyScore(60) = 1/3, so 1/3 * 80 ≈ 26.67
      assertEquals(typeof score, "number");
      assertEquals(score > 0, true);
    });

    it("handles empty statements array without throwing", () => {
      const now = Date.now();
      const room = makeRoom({ createdAt: now });
      const score = scoreRoom(room, [], now);
      assertEquals(typeof score, "number");
    });

    it("handles room with many participants", () => {
      const now = Date.now();
      const participants = Array.from({ length: 50 }, (_, i) => `user-${i}`);
      const room = makeRoom({ createdAt: now, participants });
      const score = scoreRoom(room, [], now);
      // 80 (recency) + 250 (50 participants × 5) = 330
      assertEquals(score, 330);
    });
  });
});
