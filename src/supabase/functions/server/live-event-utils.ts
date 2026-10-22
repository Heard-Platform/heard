import _ from "lodash";
import { RouteError } from "./route-error.ts";
import type { Community, Event, LiveEventState, LiveEventView } from "./types.tsx";

export const defaultLiveEventState = (now: number): LiveEventState => ({
  roomOrder: [],
  currentIndex: null,
  status: "setup",
  votingPaused: false,
  reloadNonce: 0,
  updatedAt: now,
});

export const toLiveEventView = (state: LiveEventState): LiveEventView => ({
  ...state,
  currentRoomId: state.currentIndex === null ? null : state.roomOrder[state.currentIndex] ?? null,
  peopleHere: 0,
  finishedCurrentPost: 0,
});

export const isCommunityModerator = (
  userId: string,
  community: Pick<Community, "adminId" | "modIds"> | null,
): boolean => community?.adminId === userId || !!community?.modIds?.includes(userId);

export const canModerateEvent = (
  userId: string,
  event: Pick<Event, "creatorId">,
  community: Pick<Community, "adminId" | "modIds"> | null,
): boolean => event.creatorId === userId || isCommunityModerator(userId, community);

export const reorderLiveEvent = (
  state: LiveEventState,
  roomOrder: string[],
  eventRoomIds: string[],
  now: number,
): LiveEventState => {
  if (state.status !== "setup") {
    throw new RouteError("Posts can only be reordered before the session starts", 409);
  }
  if (_.uniq(roomOrder).length !== roomOrder.length) {
    throw new RouteError("Each post can appear only once in the order", 400);
  }
  if (!_.isEqual(_.sortBy(roomOrder), _.sortBy(eventRoomIds))) {
    throw new RouteError("The event's posts have changed. Refresh and try again", 409);
  }
  return { ...state, roomOrder, updatedAt: now };
};
