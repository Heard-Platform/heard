import type { EventPostDraft } from "../shared/event-post-creation.ts";

export const MINIMUM_TOPIC_LENGTH = 5;
export const MAXIMUM_TOPIC_LENGTH = 500;
export const MAXIMUM_STATEMENT_LENGTH = 500;

export class EventPostsFileError extends Error {}

export function parseEventPostsFile(fileText: string): EventPostDraft[] {
  const parsed = parseJson(fileText);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new EventPostsFileError("The file must be a JSON list with at least one post.");
  }
  return parsed.map((entry, index) => parseEventPostDraft(entry, index + 1));
}

function parseJson(fileText: string): unknown {
  try {
    return JSON.parse(fileText);
  } catch (error) {
    throw new EventPostsFileError(`The file isn't valid JSON: ${error instanceof Error ? error.message : error}`);
  }
}

function parseEventPostDraft(entry: unknown, postNumber: number): EventPostDraft {
  if (typeof entry !== "object" || entry === null) {
    throw new EventPostsFileError(`Post ${postNumber} must be an object with "topic" and "statements".`);
  }
  const { topic, statements } = entry as Record<string, unknown>;
  return { topic: parseTopic(topic, postNumber), statements: parseStatements(statements, postNumber) };
}

function parseTopic(topic: unknown, postNumber: number): string {
  const trimmedTopic = typeof topic === "string" ? topic.trim() : "";
  if (trimmedTopic.length < MINIMUM_TOPIC_LENGTH || trimmedTopic.length > MAXIMUM_TOPIC_LENGTH) {
    throw new EventPostsFileError(
      `Post ${postNumber}'s topic must be ${MINIMUM_TOPIC_LENGTH} to ${MAXIMUM_TOPIC_LENGTH} characters.`,
    );
  }
  return trimmedTopic;
}

function parseStatements(statements: unknown, postNumber: number): string[] {
  if (!Array.isArray(statements) || statements.length === 0) {
    throw new EventPostsFileError(`Post ${postNumber} needs a "statements" list with at least one statement.`);
  }
  return statements.map((statement, index) => {
    const trimmedStatement = typeof statement === "string" ? statement.trim() : "";
    if (trimmedStatement.length === 0 || trimmedStatement.length > MAXIMUM_STATEMENT_LENGTH) {
      throw new EventPostsFileError(
        `Post ${postNumber}, statement ${index + 1} must be 1 to ${MAXIMUM_STATEMENT_LENGTH} characters.`,
      );
    }
    return trimmedStatement;
  });
}
