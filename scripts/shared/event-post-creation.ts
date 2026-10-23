import type { DebateRoom, NewDebateRoom } from "../../src/types/index.ts";
import type { HeardApiClient } from "./heard-api-client.ts";

export const EVENT_POST_LENGTH_MINUTES = 7 * 24 * 60;

export interface EventPostDraft {
  topic: string;
  statements: string[];
}

export interface EventPostTarget {
  eventId: string;
  communityName: string;
}

export function buildNewEventPost(draft: EventPostDraft, target: EventPostTarget): NewDebateRoom {
  return {
    topic: draft.topic,
    subHeard: target.communityName,
    seedStatements: draft.statements,
    allowAnonymous: true,
    eventId: Number(target.eventId),
    debateLength: EVENT_POST_LENGTH_MINUTES,
    demographicQuestions: [],
  };
}

export async function addPostsToEvent(
  api: HeardApiClient,
  target: EventPostTarget,
  drafts: EventPostDraft[],
  onPostAdded: (post: DebateRoom, postNumber: number) => void = () => {},
): Promise<DebateRoom[]> {
  const addedPosts: DebateRoom[] = [];
  for (const draft of drafts) {
    const post = await api.createPost(buildNewEventPost(draft, target));
    addedPosts.push(post);
    onPostAdded(post, addedPosts.length);
  }
  return addedPosts;
}
