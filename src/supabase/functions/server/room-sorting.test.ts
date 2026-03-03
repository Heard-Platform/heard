import { assertEquals, assertAlmostEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { recencyScore, scoreRoom, sortRoomsByActivity } from "./debate-api.tsx";
import { DebateRoom, RoomWithStatements, Statement } from "./types.tsx";

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
  ...overrides,
});

const makeRoomWithStatements = (createdAt: number, statements: Statement[] = []): RoomWithStatements => ({
  room: makeRoom(createdAt),
  statements,
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

describe("sortRoomsByActivity", () => {
  describe("Edge cases", () => {
    it("returns empty array for empty input", () => {
      const now = Date.now();
      assertEquals(sortRoomsByActivity([], now), []);
    });

    it("returns single room unchanged", () => {
      const now = Date.now();
      const rws = makeRoomWithStatements(now);
      const result = sortRoomsByActivity([rws], now);
      assertEquals(result.length, 1);
      assertEquals(result[0].room.createdAt, now);
    });
  });

  describe("Ordering by last activity", () => {
    it("sorts by most recent statement timestamp", () => {
      const now = Date.now();
      const rwsA = makeRoomWithStatements(now - 2 * HOUR, [makeStatement({ timestamp: now - 1 * MIN })]);
      const rwsB = makeRoomWithStatements(now - 1 * HOUR, [makeStatement({ timestamp: now - 10 * MIN })]);

      const result = sortRoomsByActivity([rwsB, rwsA], now);
      assertEquals(result[0].room.createdAt, now - 2 * HOUR);
      assertEquals(result[1].room.createdAt, now - 1 * HOUR);
    });

    it("falls back to createdAt when no statements", () => {
      const now = Date.now();
      const rwsOlder = makeRoomWithStatements(now - 2 * HOUR);
      const rwsNewer = makeRoomWithStatements(now - 1 * HOUR);

      const result = sortRoomsByActivity([rwsOlder, rwsNewer], now);
      assertEquals(result[0].room.createdAt, now - 1 * HOUR);
      assertEquals(result[1].room.createdAt, now - 2 * HOUR);
    });

    it("uses latest statement when room has multiple", () => {
      const now = Date.now();
      const rwsA = makeRoomWithStatements(now - 2 * HOUR, [
        makeStatement({ id: "s1", timestamp: now - 30 * MIN }),
        makeStatement({ id: "s2", timestamp: now - 5 * MIN }), // latest
      ]);
      const rwsB = makeRoomWithStatements(now - 2 * HOUR, [
        makeStatement({ id: "s3", timestamp: now - 10 * MIN }),
      ]);

      const result = sortRoomsByActivity([rwsB, rwsA], now);
      assertEquals(Math.max(...result[0].statements.map((s) => s.timestamp)), now - 5 * MIN);
      assertEquals(Math.max(...result[1].statements.map((s) => s.timestamp)), now - 10 * MIN);
    });

    it("recent statement on old room outranks newer empty room", () => {
      const now = Date.now();
      // 20-min-old empty room: score ≈ 72. Old room with stmt 1 min ago: score ≈ 99.
      const rwsOld = makeRoomWithStatements(now - 4 * HOUR, [makeStatement({ timestamp: now - 1 * MIN })]);
      const rwsNewer = makeRoomWithStatements(now - 20 * MIN);

      const result = sortRoomsByActivity([rwsNewer, rwsOld], now);
      assertEquals(result[0].room.createdAt, now - 4 * HOUR);
      assertEquals(result[1].room.createdAt, now - 20 * MIN);
    });

    it("inactive old room ranks below brand-new empty room", () => {
      const now = Date.now();
      const rwsNew = makeRoomWithStatements(now);
      const rwsStale = makeRoomWithStatements(now - 24 * HOUR);

      const result = sortRoomsByActivity([rwsStale, rwsNew], now);
      assertEquals(result[0].room.createdAt, now);
      assertEquals(result[1].room.createdAt, now - 24 * HOUR);
    });
  });

  describe("Votes", () => {
    it("room with more votes ranks above room with equal activity but fewer votes", () => {
      const now = Date.now();
      const lastStmt = now - 5 * MIN;
      const rwsA = makeRoomWithStatements(now - 2 * HOUR, [
        makeStatement({ timestamp: lastStmt, agrees: 50, disagrees: 20 }), // 70 votes
      ]);
      const rwsB = makeRoomWithStatements(now - 2 * HOUR, [
        makeStatement({ timestamp: lastStmt, agrees: 5, disagrees: 2 }), // 7 votes
      ]);

      const result = sortRoomsByActivity([rwsB, rwsA], now);
      assertEquals(result[0].statements[0].agrees, 50);
      assertEquals(result[1].statements[0].agrees, 5);
    });

    it("counts passes and superAgrees alongside agrees and disagrees", () => {
      const now = Date.now();
      const lastStmt = now - 5 * MIN;
      const rwsA = makeRoomWithStatements(now - 2 * HOUR, [
        makeStatement({ timestamp: lastStmt, agrees: 2, disagrees: 2, passes: 2, superAgrees: 2 }), // 8 votes
      ]);
      const rwsB = makeRoomWithStatements(now - 2 * HOUR, [
        makeStatement({ timestamp: lastStmt, agrees: 2, disagrees: 2 }), // 4 votes
      ]);

      const result = sortRoomsByActivity([rwsB, rwsA], now);
      assertEquals(result[0].statements[0].passes, 2);
      assertEquals(result[1].statements[0].passes, 0);
    });

    it("votes do not rescue a dormant room from a new active room", () => {
      const now = Date.now();
      const rwsDormant = makeRoomWithStatements(now - 12 * HOUR, [
        makeStatement({ timestamp: now - 3 * HOUR, agrees: 200, disagrees: 100 }), // 300 votes, 3 hrs ago
      ]);
      const rwsActive = makeRoomWithStatements(now - 30 * MIN, [
        makeStatement({ timestamp: now - 2 * MIN }), // 0 votes, 2 min ago
      ]);

      const result = sortRoomsByActivity([rwsDormant, rwsActive], now);
      assertEquals(result[0].room.createdAt, now - 30 * MIN);
      assertEquals(result[1].room.createdAt, now - 12 * HOUR);
    });
  });

  describe("Mixed scenarios", () => {
    it("ranks recently active > brand-new > dormant", () => {
      const now = Date.now();
      // active: stmt 2 min ago (score ≈ 96)
      // brandNew: no stmts, createdAt 10 min ago (score = 90)
      // dormant: stmt 20 hrs ago (score ≈ 3)
      const rwsActive = makeRoomWithStatements(now - 5 * HOUR, [makeStatement({ timestamp: now - 2 * MIN })]);
      const rwsBrandNew = makeRoomWithStatements(now - 10 * MIN);
      const rwsDormant = makeRoomWithStatements(now - 24 * HOUR, [makeStatement({ timestamp: now - 20 * HOUR })]);

      const result = sortRoomsByActivity([rwsDormant, rwsBrandNew, rwsActive], now);

      assertEquals(result[0].room.createdAt, now - 5 * HOUR);
      assertEquals(result[1].room.createdAt, now - 10 * MIN);
      assertEquals(result[2].room.createdAt, now - 24 * HOUR);
    });

    it("revived old room jumps above newer inactive rooms", () => {
      const now = Date.now();
      // revived: stmt 3 min ago (score ≈ 92)
      // quietNewer: no stmts, 15 min old (score = 80)
      // quietNew: no stmts, 30 min old (score = 60)
      const rwsRevived = makeRoomWithStatements(now - 6 * HOUR, [makeStatement({ timestamp: now - 3 * MIN })]);
      const rwsQuietNew = makeRoomWithStatements(now - 30 * MIN);
      const rwsQuietNewer = makeRoomWithStatements(now - 15 * MIN);

      const result = sortRoomsByActivity([rwsQuietNew, rwsQuietNewer, rwsRevived], now);

      assertEquals(result[0].room.createdAt, now - 6 * HOUR);
      assertEquals(result[1].room.createdAt, now - 15 * MIN);
      assertEquals(result[2].room.createdAt, now - 30 * MIN);
    });
  });

  describe("Slicing", () => {
    it("caps output at 20 rooms", () => {
      const now = Date.now();
      const rwsList = Array.from({ length: 25 }, (_, i) =>
        makeRoomWithStatements(now - i * MIN)
      );

      const result = sortRoomsByActivity(rwsList, now);
      assertEquals(result.length, 20);
    });

    it("returns the 20 most recently active when given more than 20", () => {
      const now = Date.now();
      // index 0 most recent, index 24 oldest
      const rwsList = Array.from({ length: 25 }, (_, i) =>
        makeRoomWithStatements(now - i * MIN)
      );

      const result = sortRoomsByActivity(rwsList, now);
      assertEquals(result[0].room.createdAt, now);
      assertEquals(result[19].room.createdAt, now - 19 * MIN);
    });
  });
});

describe("scoreRoom", () => {
  it("scores 120 when both signals are current", () => {
    const now = Date.now();
    const createdAt = now;
    const lastActivity = now;
    const totalVotes = 0;
    assertEquals(scoreRoom(createdAt, lastActivity, totalVotes, now), 120);
  });

  it("scores 60 at the 30-minute half-life", () => {
    const now = Date.now();
    const createdAt = now - 30 * MIN;
    const lastActivity = now - 30 * MIN;
    const totalVotes = 0;
    assertEquals(scoreRoom(createdAt, lastActivity, totalVotes, now), 60);
  });

  it("adds votes to the activity weight", () => {
    const now = Date.now();
    const createdAt = now;
    const lastActivity = now;
    const totalVotes = 10;
    // recencyScore(0) * (100 + 10 * 0.3) + recencyScore(0) * 20 = 103 + 20 = 123
    assertEquals(scoreRoom(createdAt, lastActivity, totalVotes, now), 123);
  });

  it("treats lastActivity and createdAt as independent signals", () => {
    const now = Date.now();
    const createdAt = now - 60 * MIN;
    const lastActivity = now;
    const totalVotes = 0;
    // lastActivity = now → recencyScore(0) = 1; createdAt 60 min ago → recencyScore(60) = 1/3
    // score = 1 * 100 + (1/3) * 20 ≈ 106.666...
    assertAlmostEquals(scoreRoom(createdAt, lastActivity, totalVotes, now), 106 + 2 / 3, 1e-9);
  });
});
