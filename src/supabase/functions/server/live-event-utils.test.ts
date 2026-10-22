import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  canDriveEvent,
  canModerateEvent,
  createDisplayKey,
  defaultLiveEventState,
  endEvent,
  isCommunityModerator,
  eventPostClosedReason,
  eventStateOrDefault,
  changeActivePost,
  reloadEvent,
  reorderLiveEvent,
  sessionRoomOrder,
  setVotingPaused,
  startEvent,
  countEventTotals,
  countEventHeadcount,
  isLiveScreen,
  PRESENCE_WINDOW_MS,
  toLiveEventView,
} from "./live-event-utils.ts";
import { RouteError } from "./route-error.ts";
import type { EventPresence, LiveEventState } from "./types.tsx";

const NOW = 1_761_000_000_000;
const LATER = NOW + 5_000;

const state = (overrides: Partial<LiveEventState> = {}): LiveEventState => ({
  ...defaultLiveEventState(NOW),
  ...overrides,
});

const NO_ONE = { peopleHere: 0, finishedCurrentPost: 0 };

const presence = (overrides: Partial<EventPresence>): EventPresence => ({
  userId: "u1",
  shownRoomId: "a",
  screen: "swiping",
  updatedAt: NOW,
  ...overrides,
});

const assertRouteError = (fn: () => unknown, status: number) => {
  const error = assertThrows(fn, RouteError);
  assertEquals(error.status, status);
};

Deno.test("defaultLiveEventState - setup with no order and nothing live", () => {
  assertEquals(defaultLiveEventState(NOW), {
    roomOrder: [],
    currentIndex: null,
    status: "setup",
    votingPaused: false,
    reloadNonce: 0,
    totals: null,
    startedAt: null,
    updatedAt: NOW,
  });
});

Deno.test("toLiveEventView - no current post before the session starts", () => {
  assertEquals(toLiveEventView(state({ roomOrder: ["a", "b"] }), NO_ONE).currentRoomId, null);
});

Deno.test("toLiveEventView - current post follows the current index", () => {
  const view = toLiveEventView(state({ roomOrder: ["a", "b"], currentIndex: 1, status: "live" }), NO_ONE);
  assertEquals(view.currentRoomId, "b");
});

Deno.test("canModerateEvent - creator, admin and moderators only", () => {
  const event = { creatorId: "creator" };
  const community = { adminId: "admin", modIds: ["mod"] };
  assertEquals(canModerateEvent("creator", event, community), true);
  assertEquals(canModerateEvent("admin", event, community), true);
  assertEquals(canModerateEvent("mod", event, community), true);
  assertEquals(canModerateEvent("someone", event, community), false);
});

Deno.test("canModerateEvent - creator still allowed when the community is missing", () => {
  assertEquals(canModerateEvent("creator", { creatorId: "creator" }, null), true);
  assertEquals(canModerateEvent("someone", { creatorId: "creator" }, null), false);
});

Deno.test("isCommunityModerator - admin and moderators only", () => {
  const community = { adminId: "admin", modIds: ["mod"] };
  assertEquals(isCommunityModerator("admin", community), true);
  assertEquals(isCommunityModerator("mod", community), true);
  assertEquals(isCommunityModerator("someone", community), false);
  assertEquals(isCommunityModerator("someone", { adminId: "admin" }), false);
  assertEquals(isCommunityModerator("admin", null), false);
});

Deno.test("reorderLiveEvent - saves the new order and time", () => {
  assertEquals(
    reorderLiveEvent(state(), ["c", "a", "b"], ["a", "b", "c"], LATER),
    state({ roomOrder: ["c", "a", "b"], updatedAt: LATER }),
  );
});

Deno.test("reorderLiveEvent - refused once live or ended", () => {
  assertRouteError(() => reorderLiveEvent(state({ status: "live", currentIndex: 0 }), ["a"], ["a"], LATER), 409);
  assertRouteError(() => reorderLiveEvent(state({ status: "ended" }), ["a"], ["a"], LATER), 409);
});

Deno.test("reorderLiveEvent - refuses a post listed twice", () => {
  assertRouteError(() => reorderLiveEvent(state(), ["a", "a", "b"], ["a", "b"], LATER), 400);
});

Deno.test("reorderLiveEvent - refuses an order missing a post or naming another one", () => {
  assertRouteError(() => reorderLiveEvent(state(), ["a"], ["a", "b"], LATER), 409);
  assertRouteError(() => reorderLiveEvent(state(), ["a", "x"], ["a", "b"], LATER), 409);
});

const live = (overrides: Partial<LiveEventState> = {}) =>
  state({ roomOrder: ["a", "b", "c"], currentIndex: 0, status: "live", startedAt: NOW, ...overrides });

const TOTALS = { people: 2, votes: 5, statementsFromRoom: 1, stayedToEndPercent: 50 };

Deno.test("eventStateOrDefault - fills fields missing from an older record", () => {
  const { totals: _totals, startedAt: _startedAt, ...older } = state({ roomOrder: ["a"] });
  assertEquals(eventStateOrDefault(older as LiveEventState, LATER), state({ roomOrder: ["a"] }));
});

Deno.test("eventStateOrDefault - default setup state when nothing is stored", () => {
  assertEquals(eventStateOrDefault(null, LATER), defaultLiveEventState(LATER));
});

Deno.test("sessionRoomOrder - keeps the saved order, drops deleted posts, appends new ones oldest first", () => {
  const rooms = [
    { id: "a", createdAt: 3 },
    { id: "b", createdAt: 1 },
    { id: "new-late", createdAt: 9 },
    { id: "new-early", createdAt: 5 },
  ];
  assertEquals(sessionRoomOrder(["b", "gone", "a"], rooms), ["b", "a", "new-early", "new-late"]);
});

Deno.test("sessionRoomOrder - oldest first when nothing was reordered", () => {
  assertEquals(sessionRoomOrder([], [{ id: "x", createdAt: 2 }, { id: "y", createdAt: 1 }]), ["y", "x"]);
});

Deno.test("startEvent - goes live on the first post", () => {
  const started = startEvent(state({ votingPaused: true }), [{ id: "a", createdAt: 1 }, { id: "b", createdAt: 2 }], LATER);
  assertEquals(started, state({
    roomOrder: ["a", "b"],
    currentIndex: 0,
    status: "live",
    startedAt: LATER,
    updatedAt: LATER,
  }));
});

Deno.test("startEvent - refused with no posts or once started", () => {
  assertRouteError(() => startEvent(state(), [], LATER), 409);
  assertRouteError(() => startEvent(live(), [{ id: "a", createdAt: 1 }], LATER), 409);
});

Deno.test("changeActivePost - next and back move one post and resume voting", () => {
  assertEquals(changeActivePost(live({ votingPaused: true }), 1, 0, LATER), live({ currentIndex: 1, updatedAt: LATER }));
  assertEquals(changeActivePost(live({ currentIndex: 2, votingPaused: true }), -1, 2, LATER), live({ currentIndex: 1, updatedAt: LATER }));
});

Deno.test("changeActivePost - a double-tapped Next moves only once", () => {
  const once = changeActivePost(live(), 1, 0, LATER);
  assertRouteError(() => changeActivePost(once, 1, 0, LATER), 409);
});

Deno.test("changeActivePost - refused past either end, without fromIndex, or when not live", () => {
  assertRouteError(() => changeActivePost(live(), -1, 0, LATER), 409);
  assertRouteError(() => changeActivePost(live({ currentIndex: 2 }), 1, 2, LATER), 409);
  assertRouteError(() => changeActivePost(live(), 1, undefined, LATER), 400);
  assertRouteError(() => changeActivePost(state(), 1, 0, LATER), 409);
});

Deno.test("setVotingPaused - pauses and resumes only while live", () => {
  assertEquals(setVotingPaused(live(), true, LATER), live({ votingPaused: true, updatedAt: LATER }));
  assertEquals(setVotingPaused(live({ votingPaused: true }), false, LATER), live({ updatedAt: LATER }));
  assertRouteError(() => setVotingPaused(state(), true, LATER), 409);
});

Deno.test("endEvent - ends with the totals and clears the pause", () => {
  assertEquals(
    endEvent(live({ votingPaused: true }), TOTALS, LATER),
    live({ status: "ended", totals: TOTALS, updatedAt: LATER }),
  );
  assertRouteError(() => endEvent(state(), TOTALS, LATER), 409);
});

Deno.test("reloadEvent - bumps the reload nonce in any state", () => {
  assertEquals(reloadEvent(state({ reloadNonce: 2 }), LATER).reloadNonce, 3);
});

Deno.test("eventPostClosedReason - closed before Start", () => {
  assertEquals(eventPostClosedReason(state({ roomOrder: ["a", "b"] }), "a"), "not-started");
});

Deno.test("eventPostClosedReason - only the current post is open while live", () => {
  assertEquals(eventPostClosedReason(live(), "a"), null);
  assertEquals(eventPostClosedReason(live(), "b"), "not-current");
  assertEquals(eventPostClosedReason(live({ currentIndex: 1 }), "a"), "not-current");
});

Deno.test("eventPostClosedReason - the current post is closed while paused", () => {
  assertEquals(eventPostClosedReason(live({ votingPaused: true }), "a"), "paused");
  assertEquals(eventPostClosedReason(live({ votingPaused: true }), "b"), "not-current");
});

Deno.test("eventPostClosedReason - every post opens after End", () => {
  assertEquals(eventPostClosedReason(live({ status: "ended" }), "a"), null);
  assertEquals(eventPostClosedReason(live({ status: "ended" }), "c"), null);
});

Deno.test("countEventTotals - counts only what happened after Start", () => {
  const votes = [
    { userId: "u1", roomId: "a", timestamp: NOW + 1 },
    { userId: "u1", roomId: "c", timestamp: NOW + 2 },
    { userId: "u2", roomId: "a", timestamp: NOW + 3 },
    { userId: "u3", roomId: "a", timestamp: NOW - 1 },
  ];
  const statements = [
    { roomId: "a", timestamp: NOW - 100 },
    { roomId: "b", timestamp: NOW + 10 },
  ];
  assertEquals(countEventTotals(["a", "b", "c"], statements, votes, NOW), {
    people: 2,
    votes: 3,
    statementsFromRoom: 1,
    stayedToEndPercent: 50,
  });
});

Deno.test("countEventTotals - zero people means zero stayed", () => {
  assertEquals(countEventTotals(["a"], [], [], NOW).stayedToEndPercent, 0);
});

Deno.test("toLiveEventView - carries the headcount", () => {
  const view = toLiveEventView(state(), { peopleHere: 12, finishedCurrentPost: 5 });
  assertEquals([view.peopleHere, view.finishedCurrentPost], [12, 5]);
});

Deno.test("countEventHeadcount - counts phones heard from in the last 5 minutes", () => {
  const live = state({ roomOrder: ["a", "b"], currentIndex: 0, status: "live" });
  const presences = [
    presence({ userId: "fresh" }),
    presence({ userId: "edge", updatedAt: NOW - PRESENCE_WINDOW_MS }),
    presence({ userId: "gone", updatedAt: NOW - PRESENCE_WINDOW_MS - 1 }),
  ];
  assertEquals(countEventHeadcount(presences, live, NOW).peopleHere, 2);
});

Deno.test("countEventHeadcount - finished means waiting on the current post", () => {
  const live = state({ roomOrder: ["a", "b"], currentIndex: 1, status: "live" });
  const presences = [
    presence({ userId: "done", screen: "waiting", shownRoomId: "b" }),
    presence({ userId: "stale-post", screen: "waiting", shownRoomId: "a" }),
    presence({ userId: "swiping", screen: "swiping", shownRoomId: "b" }),
    presence({ userId: "gone", screen: "waiting", shownRoomId: "b", updatedAt: NOW - PRESENCE_WINDOW_MS - 1 }),
  ];
  assertEquals(countEventHeadcount(presences, live, NOW), { peopleHere: 3, finishedCurrentPost: 1 });
});

Deno.test("countEventHeadcount - nobody has finished before the session starts", () => {
  const presences = [presence({ screen: "waiting", shownRoomId: null })];
  assertEquals(countEventHeadcount(presences, state(), NOW), { peopleHere: 1, finishedCurrentPost: 0 });
});

Deno.test("isLiveScreen - only the four phone screens", () => {
  assertEquals(["lobby", "swiping", "waiting", "end"].every(isLiveScreen), true);
  assertEquals(isLiveScreen("dancing"), false);
});

Deno.test("canDriveEvent lets moderators drive without a display key", () => {
  assertEquals(canDriveEvent(true, undefined, null), true);
});

Deno.test("canDriveEvent lets anyone with the matching display key drive", () => {
  assertEquals(canDriveEvent(false, "secret", "secret"), true);
});

Deno.test("canDriveEvent refuses a wrong or missing display key", () => {
  assertEquals(canDriveEvent(false, "guess", "secret"), false);
  assertEquals(canDriveEvent(false, undefined, "secret"), false);
});

Deno.test("canDriveEvent refuses everyone but moderators before a display key exists", () => {
  assertEquals(canDriveEvent(false, "", null), false);
  assertEquals(canDriveEvent(false, undefined, null), false);
});

Deno.test("createDisplayKey makes a 32-character key that differs each time", () => {
  const firstDisplayKey = createDisplayKey();
  assertEquals(firstDisplayKey.length, 32);
  assertEquals(firstDisplayKey === createDisplayKey(), false);
});
