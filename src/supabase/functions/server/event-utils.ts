import { getEventById } from "./model-utils.ts";
import { RouteError } from "./route-error.ts";
import type { Event } from "./types.tsx";

export const parseEventId = (eventIdStr: string | undefined): number => {
  const eventId = Number(eventIdStr);
  if (!eventIdStr || !Number.isInteger(eventId)) throw new RouteError("A valid event ID is required", 400);
  return eventId;
};

export const getEventOrThrow = async (eventId: number): Promise<Event> => {
  const event = await getEventById(eventId);
  if (!event) throw new RouteError("Event not found", 404);
  return event;
};
