import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  canModerateEvent,
  defaultLiveEventState,
  isCommunityModerator,
  reorderLiveEvent,
  toLiveEventView,
} from "./live-event-utils.ts";
import { RouteError } from "./route-error.ts";
import type { LiveEventState } from "./types.tsx";

const NOW = 1_761_000_000_000;
const LATER = NOW + 5_000;

const state = (overrides: Partial<LiveEventState> = {}): LiveEventState => ({
  ...defaultLiveEventState(NOW),
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
    updatedAt: NOW,
  });
});

Deno.test("toLiveEventView - no current post before the session starts", () => {
  assertEquals(toLiveEventView(state({ roomOrder: ["a", "b"] })).currentRoomId, null);
});

Deno.test("toLiveEventView - current post follows the current index", () => {
  const view = toLiveEventView(state({ roomOrder: ["a", "b"], currentIndex: 1, status: "live" }));
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
