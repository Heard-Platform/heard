import _ from "lodash";
import { getEventOrThrow, getEventPresences } from "./kv-utils.tsx";
import {
  getDemographicAnswersForQuestionIds,
  getDemographicQuestionsForEvent,
} from "./model-utils.ts";
import { OPT_OUT_ANSWER } from "./demographics-utils.ts";
import { requireCanDriveEvent } from "./event-utils.ts";
import type {
  AudienceBreakdownOption,
  AudienceBreakdownQuestion,
  DemographicAnswer,
  DemographicQuestion,
} from "./types.tsx";

export const FEWEST_PEOPLE_PER_GROUP = 5;
export const PERCENT_STEP = 5;
export const OTHER_OPTION = "Other";

const toAnswerLabel = (answer: DemographicAnswer): string =>
  answer.answer ?? OPT_OUT_ANSWER;

const countPeople = (answers: DemographicAnswer[]): number =>
  new Set(answers.map((answer) => answer.userId)).size;

const isTooFewPeopleToShow = (peopleCount: number): boolean =>
  peopleCount > 0 && peopleCount < FEWEST_PEOPLE_PER_GROUP;

export const toRoundedPercent = (
  peopleCount: number,
  answererCount: number,
): number => {
  const exactPercent = (peopleCount / answererCount) * 100;
  const roundedPercent =
    Math.round(exactPercent / PERCENT_STEP) * PERCENT_STEP;
  return Math.max(PERCENT_STEP, roundedPercent);
};

const listShowableOptions = (question: DemographicQuestion): string[] =>
  (question.options ?? []).filter(
    (option) => option !== OTHER_OPTION && option !== OPT_OUT_ANSWER,
  );

const toBreakdownOption = (
  label: string,
  peopleCount: number,
  answererCount: number,
): AudienceBreakdownOption => ({
  label,
  percent: toRoundedPercent(peopleCount, answererCount),
  isOptOut: label === OPT_OUT_ANSWER,
});

const notEnoughAnswers = (
  question: DemographicQuestion,
): AudienceBreakdownQuestion => ({
  questionId: question.id,
  text: question.text ?? "",
  multiSelect: question.multiSelect,
  hasEnoughAnswers: false,
  options: [],
  hasHiddenAnswers: false,
});

export const calcAudienceQuestionBreakdown = (
  question: DemographicQuestion,
  attendeeAnswers: DemographicAnswer[],
): AudienceBreakdownQuestion => {
  const answererCount = countPeople(attendeeAnswers);
  if (answererCount < FEWEST_PEOPLE_PER_GROUP) {
    return notEnoughAnswers(question);
  }

  const answersByLabel = _.groupBy(attendeeAnswers, toAnswerLabel);
  const countPeopleWhoPicked = (label: string): number =>
    countPeople(answersByLabel[label] ?? []);

  const showableOptions = listShowableOptions(question);
  const shownOptions = showableOptions.filter(
    (option) =>
      countPeopleWhoPicked(option) >= FEWEST_PEOPLE_PER_GROUP,
  );
  const otherAnswers = attendeeAnswers.filter((answer) => {
    const label = toAnswerLabel(answer);
    return label !== OPT_OUT_ANSWER && !shownOptions.includes(label);
  });
  const otherPeopleCount = countPeople(otherAnswers);
  const optOutPeopleCount = countPeopleWhoPicked(OPT_OUT_ANSWER);

  const toOptionsWithEnoughPeople = (
    label: string,
    peopleCount: number,
  ): AudienceBreakdownOption[] =>
    peopleCount >= FEWEST_PEOPLE_PER_GROUP
      ? [toBreakdownOption(label, peopleCount, answererCount)]
      : [];
  const options = [
    ...shownOptions.flatMap((option) =>
      toOptionsWithEnoughPeople(option, countPeopleWhoPicked(option)),
    ),
    ...toOptionsWithEnoughPeople(OTHER_OPTION, otherPeopleCount),
    ...toOptionsWithEnoughPeople(OPT_OUT_ANSWER, optOutPeopleCount),
  ];

  return {
    questionId: question.id,
    text: question.text ?? "",
    multiSelect: question.multiSelect,
    hasEnoughAnswers: true,
    options,
    hasHiddenAnswers:
      isTooFewPeopleToShow(otherPeopleCount) ||
      isTooFewPeopleToShow(optOutPeopleCount),
  };
};

export const calcAudienceBreakdown = (
  questions: DemographicQuestion[],
  answers: DemographicAnswer[],
  attendeeUserIds: string[],
): AudienceBreakdownQuestion[] => {
  const attendees = new Set(attendeeUserIds);
  const attendeeAnswers = answers.filter((answer) =>
    attendees.has(answer.userId),
  );
  const answersByQuestionId = _.groupBy(
    attendeeAnswers,
    (answer: DemographicAnswer) => answer.questionId,
  );
  return questions.map((question) =>
    calcAudienceQuestionBreakdown(
      question,
      answersByQuestionId[question.id] ?? [],
    ),
  );
};

export const loadAudienceBreakdown = async (
  eventId: number,
  userId: string | undefined,
  displayKey: string | undefined,
): Promise<AudienceBreakdownQuestion[]> => {
  const event = await getEventOrThrow(eventId);
  await requireCanDriveEvent(event, userId, displayKey);
  const [questions, presences] = await Promise.all([
    getDemographicQuestionsForEvent(eventId),
    getEventPresences(eventId),
  ]);
  if (questions.length === 0) return [];
  const answers = await getDemographicAnswersForQuestionIds(
    questions.map((question) => question.id),
  );
  return calcAudienceBreakdown(
    questions,
    answers,
    presences.map((presence) => presence.userId),
  );
};
