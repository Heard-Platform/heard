import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildSwipeSix, pickRecentRooms, SwipeSixPost } from "./swipe-six-utils.ts";
import type { DebateRoom, Statement } from "./types.tsx";

const DAY = 24 * 60 * 60 * 1000;

const room = (id: string, createdAt = 0) => ({ id, createdAt } as DebateRoom);
const post = (roomId: string, count: number): SwipeSixPost => ({
  room: room(roomId),
  unvotedStatements: Array.from({ length: count }, (_, i) => ({ id: `${roomId}-${i}`, roomId } as Statement)),
});

Deno.test("buildSwipeSix - orders 2 DC, 1 fun, 2 DC, 1 fun from distinct posts", () => {
  const items = buildSwipeSix(
    [post("dc1", 5), post("dc2", 5)],
    [post("fun1", 3), post("fun2", 3)],
  );
  assertEquals(items.map((i) => i.room.id), ["dc1", "dc1", "fun1", "dc2", "dc2", "fun2"]);
});

Deno.test("buildSwipeSix - builds a shorter list when fewer than 2 posts are given", () => {
  const items = buildSwipeSix([post("dc1", 5)], [post("fun1", 3)]);
  assertEquals(items.map((i) => i.room.id), ["dc1", "dc1", "fun1"]);
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
