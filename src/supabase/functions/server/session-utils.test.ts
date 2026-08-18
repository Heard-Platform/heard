import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { computeSessions, EventForGrouping, SESSION_GAP_MS } from "./session-utils.ts";

const NOW = 1_000_000_000_000;

const makeEvent = (
  overrides: Partial<EventForGrouping> = {},
): EventForGrouping => ({
  id: `event-${Math.random()}`,
  userId: "user-1",
  type: "initial_load",
  createdAt: NOW,
  sessionId: null,
  ...overrides,
});

describe("computeSessions", () => {
  it("groups events within 15 minutes into a single active session", () => {
    const events = [
      makeEvent({ id: "a", createdAt: NOW - 10 * 60_000 }),
      makeEvent({ id: "b", createdAt: NOW - 5 * 60_000 }),
    ];

    const { sessions, newlyTagged } = computeSessions(events, NOW);

    assertEquals(sessions.length, 1);
    assertEquals(sessions[0].isActive, true);
    assertEquals(sessions[0].eventCount, 2);
    assertEquals(sessions[0].endedAt, null);
    assertEquals(newlyTagged.length, 0);
  });

  it("splits into two sessions across a 15+ minute gap and tags the closed one", () => {
    const events = [
      makeEvent({ id: "a", createdAt: NOW - 60 * 60_000 }),
      makeEvent({ id: "b", createdAt: NOW - 59 * 60_000 }),
      // 20 minute gap here, closes the first session
      makeEvent({ id: "c", createdAt: NOW - 10 * 60_000 }),
    ];

    const { sessions, newlyTagged } = computeSessions(events, NOW);

    assertEquals(sessions.length, 2);

    const closed = sessions.find((s) => !s.isActive)!;
    const active = sessions.find((s) => s.isActive)!;

    assertEquals(closed.eventCount, 2);
    assertEquals(closed.endedAt, NOW - 59 * 60_000);
    assertEquals(active.eventCount, 1);
    assertEquals(active.endedAt, null);

    assertEquals(newlyTagged.length, 1);
    assertEquals(newlyTagged[0].eventIds.sort(), ["a", "b"]);
  });

  it("closes the trailing session once now is 15+ minutes past the last event", () => {
    const events = [
      makeEvent({ id: "a", createdAt: NOW - 30 * 60_000 }),
      makeEvent({ id: "b", createdAt: NOW - 20 * 60_000 }),
    ];

    const { sessions, newlyTagged } = computeSessions(events, NOW);

    assertEquals(sessions.length, 1);
    assertEquals(sessions[0].isActive, false);
    assertEquals(sessions[0].endedAt, NOW - 20 * 60_000);
    assertEquals(newlyTagged.length, 1);
    assertEquals(newlyTagged[0].eventIds.sort(), ["a", "b"]);
  });

  it("does not re-derive boundaries for already-tagged events", () => {
    const events = [
      makeEvent({ id: "a", createdAt: NOW - 60 * 60_000, sessionId: "existing-session" }),
      makeEvent({ id: "b", createdAt: NOW - 55 * 60_000, sessionId: "existing-session" }),
      makeEvent({ id: "c", createdAt: NOW - 5 * 60_000 }),
    ];

    const { sessions, newlyTagged } = computeSessions(events, NOW);

    assertEquals(sessions.length, 2);
    assertEquals(newlyTagged.length, 0);

    const preTagged = sessions.find((s) => s.sessionId === "existing-session")!;
    assertEquals(preTagged.eventCount, 2);
    assertEquals(preTagged.isActive, false);
  });

  it("keeps separate users in separate sessions", () => {
    const events = [
      makeEvent({ id: "a", userId: "user-1", createdAt: NOW - 5 * 60_000 }),
      makeEvent({ id: "b", userId: "user-2", createdAt: NOW - 5 * 60_000 }),
    ];

    const { sessions } = computeSessions(events, NOW);

    assertEquals(sessions.length, 2);
    assertEquals(new Set(sessions.map((s) => s.userId)).size, 2);
  });

  it("treats exactly the gap threshold as a boundary", () => {
    const events = [
      makeEvent({ id: "a", createdAt: NOW - SESSION_GAP_MS - 1_000 }),
      // exactly SESSION_GAP_MS after "a", and well within the active window
      makeEvent({ id: "b", createdAt: NOW - 1_000 }),
    ];

    const { sessions, newlyTagged } = computeSessions(events, NOW);

    assertEquals(sessions.length, 2);
    assertEquals(newlyTagged.length, 1);
    assertEquals(newlyTagged[0].eventIds, ["a"]);

    const active = sessions.find((s) => s.isActive)!;
    assertEquals(active.eventCount, 1);
  });
});
