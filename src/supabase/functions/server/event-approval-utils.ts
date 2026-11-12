import { eventStateOrDefault } from "./live-event-utils.ts";
import {
  getEventOrThrow,
  getLiveEventState,
  getStatementsForRoomIncludingHidden,
} from "./kv-utils.tsx";
import { isEventStatement } from "./event-content-utils.ts";
import { requireCanDriveEvent } from "./event-utils.ts";
import { listAttendeeStatements } from "./support-view-utils.ts";
import type {
  EventApprovalView,
  LiveEventState,
  Statement,
  SupportViewAttendeeStatement,
} from "./types.tsx";

export const listStatementsForApproval = (
  state: Pick<LiveEventState, "roomOrder" | "startedAt">,
  roomStatements: Statement[][],
): SupportViewAttendeeStatement[] => {
  const eventStatements = roomStatements
    .flat()
    .filter(isEventStatement);
  return listAttendeeStatements(state, eventStatements);
};

export const loadEventApprovalView = async (
  eventId: number,
  userId: string | undefined,
  displayKey: string | undefined,
): Promise<EventApprovalView> => {
  const event = await getEventOrThrow(eventId);
  await requireCanDriveEvent(event, userId, displayKey);
  const state = eventStateOrDefault(
    await getLiveEventState(eventId),
    Date.now(),
  );
  const roomStatements = await Promise.all(
    state.roomOrder.map(getStatementsForRoomIncludingHidden),
  );
  return {
    eventName: event.name,
    attendeeStatements: listStatementsForApproval(state, roomStatements),
  };
};
