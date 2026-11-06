import type {
  EventOnboardingQuestionInput,
  NewEvent,
} from "../../src/types/index.ts";
import type { EventContent } from "../shared/event-creation.ts";
import {
  parseEventPostDraftList,
  parseJsonFileText,
} from "../event-posts/event-posts-file.ts";
import { OPT_OUT_ANSWER } from "../../src/utils/demographic-questions.ts";

export class EventSetupFileError extends Error {}

export interface EventSetup {
  newEvent: NewEvent;
  content: EventContent;
}

export function parseEventSetupFile(fileText: string): EventSetup {
  const parsed = parseJsonFileText(fileText);
  if (!isPlainObject(parsed)) {
    throw new EventSetupFileError(
      'The file must be a JSON object with "name", "communityName" and "posts".',
    );
  }
  const {
    name,
    subtitle,
    communityName,
    onboardingQuestions,
    posts,
  } = parsed as Record<string, unknown>;
  return {
    newEvent: {
      name: parseRequiredText(name, "name"),
      subtitle: parseOptionalText(subtitle, "subtitle"),
      communityName: parseRequiredText(
        communityName,
        "communityName",
      ),
    },
    content: {
      posts: parseEventPostDraftList(posts),
      onboardingQuestions: parseOnboardingQuestions(
        onboardingQuestions,
      ),
    },
  };
}

function isPlainObject(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseRequiredText(
  value: unknown,
  fieldName: string,
): string {
  const trimmedValue = typeof value === "string" ? value.trim() : "";
  if (trimmedValue === "") {
    throw new EventSetupFileError(`"${fieldName}" can't be blank.`);
  }
  return trimmedValue;
}

function parseOptionalText(
  value: unknown,
  fieldName: string,
): string | undefined {
  if (value === undefined) return undefined;
  return parseRequiredText(value, fieldName);
}

function parseOnboardingQuestions(
  value: unknown,
): EventOnboardingQuestionInput[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new EventSetupFileError(
      '"onboardingQuestions" must be a list.',
    );
  }
  return value.map((entry, index) =>
    parseOnboardingQuestion(entry, index + 1),
  );
}

function parseOnboardingQuestion(
  entry: unknown,
  questionNumber: number,
): EventOnboardingQuestionInput {
  if (!isPlainObject(entry)) {
    throw new EventSetupFileError(
      `Question ${questionNumber} must be an object with "text" and "options".`,
    );
  }
  const { text, options, multiSelect } = entry as Record<
    string,
    unknown
  >;
  return {
    text: parseRequiredText(text, `Question ${questionNumber} text`),
    options: parseOptions(options, questionNumber),
    multiSelect: parseMultiSelect(multiSelect, questionNumber),
  };
}

function parseOptions(
  options: unknown,
  questionNumber: number,
): string[] {
  if (!Array.isArray(options) || options.length === 0) {
    throw new EventSetupFileError(
      `Question ${questionNumber} needs an "options" list with at least one option.`,
    );
  }
  const trimmedOptions = options.map((option, index) =>
    parseRequiredText(
      option,
      `Question ${questionNumber}, option ${index + 1}`,
    ),
  );
  if (trimmedOptions.includes(OPT_OUT_ANSWER)) {
    throw new EventSetupFileError(
      `Question ${questionNumber} lists "${OPT_OUT_ANSWER}", which every question gets automatically. Remove it.`,
    );
  }
  return trimmedOptions;
}

function parseMultiSelect(
  multiSelect: unknown,
  questionNumber: number,
): boolean {
  if (multiSelect === undefined) return false;
  if (typeof multiSelect !== "boolean") {
    throw new EventSetupFileError(
      `Question ${questionNumber}'s "multiSelect" must be true or false.`,
    );
  }
  return multiSelect;
}
