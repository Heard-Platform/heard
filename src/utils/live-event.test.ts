import { describe, expect, it } from "vitest";
import { moveInOrder, orderByRoomOrder } from "./live-event";

const room = (id: string) => ({ id });
const ids = (rooms: { id: string }[]) => rooms.map((r) => r.id);

describe("orderByRoomOrder", () => {
  it("returns rooms in the stored order", () => {
    const rooms = [room("a"), room("b"), room("c")];
    expect(ids(orderByRoomOrder(rooms, ["c", "a", "b"]))).toEqual(["c", "a", "b"]);
  });

  it("appends rooms missing from the order in their original order", () => {
    const rooms = [room("a"), room("b"), room("c"), room("d")];
    expect(ids(orderByRoomOrder(rooms, ["c", "a"]))).toEqual(["c", "a", "b", "d"]);
  });

  it("drops ids in the order that no longer match a room", () => {
    const rooms = [room("a"), room("b")];
    expect(ids(orderByRoomOrder(rooms, ["gone", "b", "a"]))).toEqual(["b", "a"]);
  });

  it("keeps the given order when nothing is stored yet", () => {
    const rooms = [room("a"), room("b")];
    expect(ids(orderByRoomOrder(rooms, []))).toEqual(["a", "b"]);
  });
});

describe("moveInOrder", () => {
  const order = ["a", "b", "c"];

  it("moves an item up", () => {
    expect(moveInOrder(order, 1, -1)).toEqual(["b", "a", "c"]);
  });

  it("moves an item down", () => {
    expect(moveInOrder(order, 1, 1)).toEqual(["a", "c", "b"]);
  });

  it("leaves the first item in place when moved up", () => {
    expect(moveInOrder(order, 0, -1)).toBe(order);
  });

  it("leaves the last item in place when moved down", () => {
    expect(moveInOrder(order, 2, 1)).toBe(order);
  });

  it("does not mutate the input", () => {
    moveInOrder(order, 0, 1);
    expect(order).toEqual(["a", "b", "c"]);
  });
});
