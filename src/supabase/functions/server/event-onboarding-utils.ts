import { getCommunity, getLiveEventState } from "./kv-utils.tsx";
import { canModerateEvent, eventStateOrDefault } from "./live-event-utils.ts";
import {
  deleteDemographicQuestionsForEvent,
  getDemographicQuestionsForEvent,
  insertEventDemographicQuestions,
} from "./model-utils.ts";
import { getEventOrThrow } from "./event-utils.ts";
import { RouteError } from "./route-error.ts";
import type {
  DemographicQuestion,
  Event,
  EventOnboardingQuestionInput,
  LiveEventState,
  NewEventDemographicQuestion,
} from "./types.tsx";

export const MINIMUM_OPTIONS_PER_ONBOARDING_QUESTION = 1;

export const ONBOARDING_QUESTIONS_ERROR_MESSAGE =
  "Each question needs text, at least one option besides Prefer not to say, and a pick-any setting";

const isNonBlankString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

const countNonBlankOptions = (options: unknown[]): number =>
  options.filter(isNonBlankString).length;

export const isValidOnboardingQuestion = (value: unknown): value is EventOnboardingQuestionInput => {
  if (typeof value !== "object" || value === null) return false;
  const { text, options, multiSelect } = value as Record<string, unknown>;
  if (!isNonBlankString(text)) return false;
  if (typeof multiSelect !== "boolean") return false;
  if (!Array.isArray(options)) return false;
  if (!options.every((option) => typeof option === "string")) return false;
  return countNonBlankOptions(options) >= MINIMUM_OPTIONS_PER_ONBOARDING_QUESTION;
};

export const isValidOnboardingQuestionList = (questions: unknown[]): boolean =>
  questions.every(isValidOnboardingQuestion);

export const toEventDemographicQuestionRows = (
  eventId: number,
  questions: EventOnboardingQuestionInput[],
): NewEventDemographicQuestion[] =>
  questions.map((question, position) => ({
    roomId: null,
    eventId,
    type: "custom",
    text: question.text.trim(),
    options: question.options.map((option) => option.trim()).filter((option) => option !== ""),
    multiSelect: question.multiSelect,
    position,
  }));

export const requireEventInSetup = (state: LiveEventState): void => {
  if (state.status !== "setup") {
    throw new RouteError("Onboarding questions can't change once the doors are open", 409);
  }
};

const requireCanModerateEvent = async (event: Event, userId: string | undefined): Promise<void> => {
  const community = await getCommunity(event.communityName);
  if (!userId || !canModerateEvent(userId, event, community)) {
    throw new RouteError(`Only moderators of ${event.communityName} can change this event's questions`, 403);
  }
};

export const loadEventOnboardingQuestions = async (eventId: number): Promise<DemographicQuestion[]> => {
  await getEventOrThrow(eventId);
  return getDemographicQuestionsForEvent(eventId);
};

export const replaceEventOnboardingQuestions = async (
  eventId: number,
  userId: string | undefined,
  questions: EventOnboardingQuestionInput[],
): Promise<DemographicQuestion[]> => {
  const event = await getEventOrThrow(eventId);
  await requireCanModerateEvent(event, userId);
  requireEventInSetup(eventStateOrDefault(await getLiveEventState(eventId), Date.now()));

  await deleteDemographicQuestionsForEvent(eventId);
  await insertEventDemographicQuestions(toEventDemographicQuestionRows(eventId, questions));
  return getDemographicQuestionsForEvent(eventId);
};
