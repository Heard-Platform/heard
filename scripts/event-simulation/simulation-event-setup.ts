import type { HeardApiClient } from "../shared/heard-api-client.ts";
import { createEventWithContent } from "../shared/event-creation.ts";
import {
  SIMULATION_ONBOARDING_QUESTIONS,
  SIMULATION_POSTS,
} from "./simulation-content.ts";

export const SIMULATION_COMMUNITY_NAME = "test";

export function buildSimulationEventName(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `Event simulation ${now.getMonth() + 1}/${now.getDate()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function createSimulationEvent(
  moderatorApi: HeardApiClient,
  now: Date,
): Promise<string> {
  return createEventWithContent(
    moderatorApi,
    {
      name: buildSimulationEventName(now),
      communityName: SIMULATION_COMMUNITY_NAME,
    },
    {
      posts: SIMULATION_POSTS,
      onboardingQuestions: SIMULATION_ONBOARDING_QUESTIONS,
    },
  );
}
