import {
  getCommunity,
  getEventOrThrow,
  getLiveEventState,
} from "./kv-utils.tsx";
import { canModerateEvent, eventStateOrDefault } from "./live-event-utils.ts";
import {
  countDemographicAnswersForQuestionIds,
  deleteDemographicQuestionsForEvent,
  getAttendeeAnswers,
  getDemographicQuestionsForEvent,
  insertEventDemographicQuestions,
  replaceDemographicAnswers,
} from "./model-utils.ts";
import {
  hasDuplicateAnswers,
  isOptOutMixedWithOptions,
  OPT_OUT_ANSWER,
  toStoredAnswers,
} from "./demographics-utils.ts";
import { RouteError } from "./route-error.ts";
import type {
  AttendeeOnboarding,
  DemographicAnswer,
  DemographicQuestion,
  Event,
  EventOnboardingQuestionInput,
  EventOnboardingQuestionList,
  LiveEventState,
  NewEventDemographicQuestion,
} from "./types.tsx";

export const MINIMUM_OPTIONS_PER_ONBOARDING_QUESTION = 1;

const ANSWERS_ERROR_MESSAGE =
  "Pick one of the question's options, or Prefer not to say on its own";

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

export const requireQuestionsUnanswered = (
  answerCount: number,
): void => {
  if (answerCount > 0) {
    throw new RouteError(
      "Onboarding questions can't change once someone has answered them",
      409,
    );
  }
};

const countAnswersToQuestions = (
  questions: DemographicQuestion[],
): Promise<number> =>
  countDemographicAnswersForQuestionIds(
    questions.map((question) => question.id),
  );

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

export const loadEventOnboardingQuestionList = async (
  eventId: number,
): Promise<EventOnboardingQuestionList> => {
  const questions = await loadEventOnboardingQuestions(eventId);
  const answerCount = await countAnswersToQuestions(questions);
  return { questions, hasAnswers: answerCount > 0 };
};

export const replaceEventOnboardingQuestions = async (
  eventId: number,
  userId: string | undefined,
  questions: EventOnboardingQuestionInput[],
): Promise<DemographicQuestion[]> => {
  const event = await getEventOrThrow(eventId);
  await requireCanModerateEvent(event, userId);
  requireEventInSetup(eventStateOrDefault(await getLiveEventState(eventId), Date.now()));
  const savedQuestions =
    await getDemographicQuestionsForEvent(eventId);
  requireQuestionsUnanswered(
    await countAnswersToQuestions(savedQuestions),
  );

  await deleteDemographicQuestionsForEvent(eventId);
  await insertEventDemographicQuestions(toEventDemographicQuestionRows(eventId, questions));
  return getDemographicQuestionsForEvent(eventId);
};

export const requireEventDoorsOpen = (
  state: LiveEventState,
): void => {
  if (state.status === "setup") {
    throw new RouteError("The doors aren't open yet", 409);
  }
};

export const findEventQuestionOrThrow = (
  questions: DemographicQuestion[],
  questionId: number,
): DemographicQuestion => {
  const question = questions.find(
    (eventQuestion) => eventQuestion.id === questionId,
  );
  if (!question) {
    throw new RouteError(
      "That question isn't part of this event",
      404,
    );
  }
  return question;
};

const isAllowedAnswer = (
  question: DemographicQuestion,
  answer: string,
): boolean =>
  answer === OPT_OUT_ANSWER ||
  (question.options ?? []).includes(answer);

export const isValidAnswerList = (
  question: DemographicQuestion,
  answers: string[],
): boolean => {
  if (!question.multiSelect && answers.length !== 1) return false;
  if (hasDuplicateAnswers(answers)) return false;
  if (isOptOutMixedWithOptions(answers)) return false;
  return answers.every((answer) => isAllowedAnswer(question, answer));
};

export const collectAnsweredQuestionIds = (
  answers: DemographicAnswer[],
): number[] => [
  ...new Set(answers.map((answer) => answer.questionId)),
];

const loadAnsweredQuestionIds = async (
  userId: string,
  questions: DemographicQuestion[],
): Promise<number[]> => {
  if (questions.length === 0) return [];
  const answers = await getAttendeeAnswers(
    userId,
    questions.map((question) => question.id),
  );
  return collectAnsweredQuestionIds(answers);
};

export const loadAttendeeOnboarding = async (
  eventId: number,
  userId: string,
): Promise<AttendeeOnboarding> => {
  const questions = await loadEventOnboardingQuestions(eventId);
  return {
    questions,
    answeredQuestionIds: await loadAnsweredQuestionIds(
      userId,
      questions,
    ),
  };
};

export const saveEventDemographicAnswer = async (
  eventId: number,
  userId: string,
  questionId: number,
  answers: string[],
): Promise<void> => {
  const [questions, storedState] = await Promise.all([
    getDemographicQuestionsForEvent(eventId),
    getLiveEventState(eventId),
  ]);
  const question = findEventQuestionOrThrow(questions, questionId);
  requireEventDoorsOpen(eventStateOrDefault(storedState, Date.now()));
  if (!isValidAnswerList(question, answers)) {
    throw new RouteError(ANSWERS_ERROR_MESSAGE, 400);
  }
  await replaceDemographicAnswers(
    userId,
    questionId,
    toStoredAnswers(answers),
  );
};
