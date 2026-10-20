import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildRoomSwipeSix, buildSwipeSix, pickRecentRooms, pickTwoPosts, SwipeSixPost } from "./swipe-six-utils.ts";
import type { DebateRoom, Statement } from "./types.tsx";

const DAY = 24 * 60 * 60 * 1000;

const room = (id: string, createdAt = 0) => ({ id, createdAt } as DebateRoom);
const post = (roomId: string, count: number): SwipeSixPost => ({
  room: room(roomId),
  unvotedStatements: Array.from({ length: count }, (_, i) => ({ id: `${roomId}-${i}`, roomId } as Statement)),
});

Deno.test("buildSwipeSix - orders 3 from one DC post, 2 from another, then 1 fun", () => {
  const items = buildSwipeSix([post("dc1", 5), post("dc2", 5)], post("fun1", 3));
  assertEquals(items.map((i) => i.room.id), ["dc1", "dc1", "dc1", "dc2", "dc2", "fun1"]);
});

Deno.test("buildSwipeSix - builds a shorter list when posts are missing or thin", () => {
  const items = buildSwipeSix([post("dc1", 2)], undefined);
  assertEquals(items.map((i) => i.room.id), ["dc1", "dc1"]);
});

Deno.test("pickTwoPosts - puts the post with more unvoted statements first", () => {
  const picked = pickTwoPosts([post("thin", 2), post("deep", 5)]);
  assertEquals(picked.map((p) => p.room.id), ["deep", "thin"]);
});

Deno.test("buildRoomSwipeSix - takes up to 6 distinct statements from the post", () => {
  const items = buildRoomSwipeSix(post("room1", 10));
  assertEquals(items.length, 6);
  assertEquals(new Set(items.map((i) => i.statement.id)).size, 6);
  assertEquals(buildRoomSwipeSix(post("room2", 4)).length, 4);
});

Deno.test("pickRecentRooms - uses the window, falling back to the newest rooms", () => {
  const now = 100 * DAY;
  const recent = Array.from({ length: 7 }, (_, i) => room(`r${i}`, now - (i + 1) * DAY));
  const old = [room("old1", now - 30 * DAY), room("old2", now - 20 * DAY)];
  assertEquals(pickRecentRooms([...old, ...recent], now).map((r) => r.id), recent.map((r) => r.id));
  assertEquals(
    pickRecentRooms([...old, ...recent.slice(0, 3)], now).map((r) => r.id),
    ["r0", "r1", "r2", "old2", "old1"],
  );
});
