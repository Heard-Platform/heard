import { DemographicBreakdown } from "./analysis-utils.tsx";
import { DemographicQuestion, DemographicAnswer } from "./types.tsx";
import {
  getDemographicQuestion,
  replaceDemographicAnswers,
} from "./model-utils.ts";
import { RouteError } from "./route-error.ts";
import _ from "lodash";

const ROOM_ANSWERS_ERROR_MESSAGE = "Invalid answers provided";

export const OPT_OUT_ANSWER = "Prefer not to say";

export const hasDuplicateAnswers = (answers: string[]): boolean =>
  new Set(answers).size !== answers.length;

export const isOptOutMixedWithOptions = (
  answers: string[],
): boolean =>
  answers.includes(OPT_OUT_ANSWER) && answers.length > 1;

export const toStoredAnswers = (answers: string[]): string[] => {
  const isSkipped = answers.length === 0;
  return isSkipped ? [OPT_OUT_ANSWER] : answers;
};

const isListedOption = (
  question: DemographicQuestion,
  answer: string,
): boolean => {
  if (answer === OPT_OUT_ANSWER) return true;
  if (!question.options) return true;
  return question.options.includes(answer);
};

export const isValidRoomAnswerList = (
  question: DemographicQuestion,
  answers: string[],
): boolean => {
  if (!question.multiSelect && answers.length > 1) return false;
  if (hasDuplicateAnswers(answers)) return false;
  if (isOptOutMixedWithOptions(answers)) return false;
  if (answers.some((answer) => !isListedOption(question, answer))) return false;
  return true;
};

export const saveRoomDemographicAnswers = async (
  userId: string,
  questionId: number,
  answers: string[],
): Promise<void> => {
  const question = await getDemographicQuestion(questionId);
  if (!question) {
    throw new RouteError("That question doesn't exist", 404);
  }
  if (!isValidRoomAnswerList(question, answers)) {
    throw new RouteError(ROOM_ANSWERS_ERROR_MESSAGE, 400);
  }
  await replaceDemographicAnswers(
    userId,
    questionId,
    toStoredAnswers(answers),
  );
};

export function calcDemographicBreakdown(
  questions: DemographicQuestion[],
  answers: DemographicAnswer[],
): DemographicBreakdown {
  const questionMap = _.keyBy(questions, 'id');
  const answersWithQuestions = answers.map(answer => ({
    ...answer,
    answer: answer.answer ?? OPT_OUT_ANSWER,
    question: questionMap[answer.questionId],
  }));

  type GroupedAnswer = DemographicAnswer & { question: DemographicQuestion };

  const answersGroupedByQuestion = _.groupBy(answersWithQuestions,
    (answer: GroupedAnswer) =>
      answer.question.type === 'custom' ? answer.question.text : answer.question.type
  );

  const breakdown = _.mapValues(answersGroupedByQuestion, (group: GroupedAnswer[]) =>
    _.countBy(group, 'answer')
  );

  return breakdown;
}