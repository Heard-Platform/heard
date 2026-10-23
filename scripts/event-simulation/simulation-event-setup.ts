import type { HeardApiClient } from "../shared/heard-api-client.ts";
import { addPostsToEvent } from "../shared/event-post-creation.ts";
import { SIMULATION_POSTS } from "./simulation-content.ts";

export const APP_URL = "https://heard.vote";
export const SIMULATION_COMMUNITY_NAME = "test";

export interface SimulationEventLinks {
  moderatorControls: string;
  display: string | null;
  phone: string;
}

export function buildSimulationEventName(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `Event simulation ${now.getMonth() + 1}/${now.getDate()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function buildSimulationEventLinks(eventId: string, displayKey: string | null): SimulationEventLinks {
  return {
    moderatorControls: `${APP_URL}/event/${eventId}/moderate`,
    display: displayKey ? `${APP_URL}/event/${eventId}/display?key=${displayKey}` : null,
    phone: `${APP_URL}/event/${eventId}/live`,
  };
}

export async function createSimulationEvent(moderatorApi: HeardApiClient, now: Date): Promise<string> {
  const { event } = await moderatorApi.createEvent({
    name: buildSimulationEventName(now),
    communityName: SIMULATION_COMMUNITY_NAME,
  });
  const eventId = String(event.id);
  await addPostsToEvent(moderatorApi, { eventId, communityName: SIMULATION_COMMUNITY_NAME }, SIMULATION_POSTS);
  return eventId;
}
