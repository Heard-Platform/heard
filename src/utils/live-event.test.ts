import { describe, expect, it } from "vitest";
import type { Statement } from "../types";
import {
  buildPostDeck,
  getAttendeeScreen,
  HEARTBEAT_INTERVAL_MS,
  shouldSendHeartbeat,
  toLiveScreen,
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

describe("getAttendeeScreen", () => {
  const live = { status: "live" as const, votingPaused: false };

  it("waits in the lobby before the event starts", () => {
    expect(getAttendeeScreen({ status: "setup", votingPaused: false }, true, false)).toBe("starting");
  });

  it("shows the end screen once the event ends", () => {
    expect(getAttendeeScreen({ status: "ended", votingPaused: false }, true, false)).toBe("end");
  });

  it("pauses even with cards left", () => {
    expect(getAttendeeScreen({ ...live, votingPaused: true }, true, false)).toBe("paused");
  });

  it("pauses even while writing a statement", () => {
    expect(getAttendeeScreen({ ...live, votingPaused: true }, true, true)).toBe("paused");
  });

  it("swipes while cards are left, then waits for the others", () => {
    expect(getAttendeeScreen(live, true, false)).toBe("swiping");
    expect(getAttendeeScreen(live, false, false)).toBe("waiting");
  });

  it("keeps waiting while a statement is being written, even when new cards arrive", () => {
    expect(getAttendeeScreen(live, true, true)).toBe("waiting");
  });

  it("reports both lobby wordings as the lobby screen", () => {
    expect(toLiveScreen("starting")).toBe("lobby");
    expect(toLiveScreen("paused")).toBe("lobby");
    expect(toLiveScreen("waiting")).toBe("waiting");
  });
});

describe("shouldSendHeartbeat", () => {
  const heartbeat = { shownRoomId: "a", screen: "swiping" as const };

  it("sends the first heartbeat", () => {
    expect(shouldSendHeartbeat(null, heartbeat, 0)).toBe(true);
  });

  it("holds an unchanged heartbeat until the interval passes", () => {
    const last = { heartbeat, sentAt: 1_000 };
    expect(shouldSendHeartbeat(last, heartbeat, 1_000 + HEARTBEAT_INTERVAL_MS - 1)).toBe(false);
    expect(shouldSendHeartbeat(last, heartbeat, 1_000 + HEARTBEAT_INTERVAL_MS)).toBe(true);
  });

  it("sends at once when the screen or post changes", () => {
    const last = { heartbeat, sentAt: 1_000 };
    expect(shouldSendHeartbeat(last, { ...heartbeat, screen: "waiting" }, 1_001)).toBe(true);
    expect(shouldSendHeartbeat(last, { ...heartbeat, shownRoomId: "b" }, 1_001)).toBe(true);
  });
});

describe("buildPostDeck", () => {
  const statement = (id: string, overrides: Partial<Statement> = {}) =>
    ({ id, author: "host", voters: {}, ...overrides }) as Statement;
  const deckIds = (statements: Statement[]) => statements.map((s) => s.id);

  it("puts statements already voted on first and counts them", () => {
    const deck = buildPostDeck(
      [statement("a"), statement("b", { voters: { me: "agree" } }), statement("c")],
      "me",
      {},
    );
    expect(deckIds(deck.statements)).toEqual(["b", "a", "c"]);
    expect(deck.votedCount).toBe(1);
  });

  it("counts votes made on this phone before the server knows", () => {
    const deck = buildPostDeck([statement("a"), statement("b")], "me", { a: "pass" });
    expect(deck.votedCount).toBe(1);
    expect(deckIds(deck.statements)).toEqual(["a", "b"]);
  });

  it("deals your own statements like any other", () => {
    const deck = buildPostDeck([statement("a"), statement("mine", { author: "me" })], "me", {});
    expect(deckIds(deck.statements)).toEqual(["a", "mine"]);
    expect(deck.votedCount).toBe(0);
  });

  it("is empty for a post with no statements", () => {
    expect(buildPostDeck([], "me", {})).toEqual({ statements: [], votedCount: 0 });
  });
});
