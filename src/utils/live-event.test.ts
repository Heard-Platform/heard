import { describe, expect, it } from "vitest";
import {
  getControlsPhase,
  EVENT_POLL_MAX_INTERVAL_MS,
  moveInOrder,
  getIntervalWithBackoff,
  orderByRoomOrder,
  pickNewestState,
} from "./live-event";

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

describe("getControlsPhase", () => {
  it("is not started during setup", () => {
    expect(getControlsPhase("setup", null, 3)).toBe("not-started");
  });

  it("is live before the last post", () => {
    expect(getControlsPhase("live", 1, 3)).toBe("live");
  });

  it("is the last post on the final index", () => {
    expect(getControlsPhase("live", 2, 3)).toBe("last-post");
  });

  it("is the last post when there is only one post", () => {
    expect(getControlsPhase("live", 0, 1)).toBe("last-post");
  });

  it("is ended once the session ends", () => {
    expect(getControlsPhase("ended", 2, 3)).toBe("ended");
  });
});

describe("getIntervalWithBackoff", () => {
  it("polls at the base rate while requests succeed", () => {
    expect(getIntervalWithBackoff(3000, 0)).toBe(3000);
  });

  it("doubles the wait after each failure in a row", () => {
    expect(getIntervalWithBackoff(3000, 1)).toBe(6000);
    expect(getIntervalWithBackoff(3000, 2)).toBe(12000);
  });

  it("caps the wait", () => {
    expect(getIntervalWithBackoff(3000, 10)).toBe(EVENT_POLL_MAX_INTERVAL_MS);
  });
});

describe("pickNewestState", () => {
  const at = (updatedAt: number) => ({ updatedAt });

  it("takes the incoming state when there is none yet", () => {
    expect(pickNewestState(null, at(5))).toEqual(at(5));
  });

  it("takes a newer or equal incoming state", () => {
    expect(pickNewestState(at(5), at(6))).toEqual(at(6));
    expect(pickNewestState(at(5), at(5))).toEqual(at(5));
  });

  it("ignores a stale poll that lands after a newer action result", () => {
    const current = at(9);
    expect(pickNewestState(current, at(5))).toBe(current);
  });
});
