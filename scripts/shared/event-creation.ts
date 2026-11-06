import type {
  EventOnboardingQuestionInput,
  NewEvent,
} from "../../src/types/index.ts";
import type { HeardApiClient } from "./heard-api-client.ts";
import {
  addPostsToEvent,
  type EventPostDraft,
} from "./event-post-creation.ts";

export interface EventContent {
  posts: EventPostDraft[];
  onboardingQuestions: EventOnboardingQuestionInput[];
}

export async function createEventWithContent(
  moderatorApi: HeardApiClient,
  newEvent: NewEvent,
  content: EventContent,
): Promise<string> {
  const { event } = await moderatorApi.createEvent(newEvent);
  const eventId = String(event.id);
  await addPostsToEvent(
    moderatorApi,
    { eventId, communityName: newEvent.communityName },
    content.posts,
  );
  await moderatorApi.updateEventOnboardingQuestions(
    eventId,
    content.onboardingQuestions,
  );
  return eventId;
}
