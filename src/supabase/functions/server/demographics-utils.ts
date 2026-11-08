import { DemographicBreakdown } from "./analysis-utils.tsx";
import { DemographicQuestion, DemographicAnswer } from "./types.tsx";
import {
  getDemographicQuestion,
  replaceDemographicAnswers,
} from "./model-utils.ts";
import { RouteError } from "./route-error.ts";
import _ from "lodash";

const ROOM_ANSWERS_ERROR_MESSAGE = "Invalid answers provided";

export const hasDuplicateAnswers = (answers: string[]): boolean =>
  new Set(answers).size !== answers.length;

export const toStoredAnswers = (
  answers: string[],
): (string | null)[] => {
  const isSkipped = answers.length === 0;
  return isSkipped ? [null] : answers;
};

const isListedOption = (
  question: DemographicQuestion,
  answer: string,
): boolean => {
  if (!question.options) return true;
  return question.options.includes(answer);
};

export const isValidRoomAnswerList = (
  question: DemographicQuestion,
  answers: string[],
): boolean => {
  if (!question.multiSelect && answers.length > 1) return false;
  if (hasDuplicateAnswers(answers)) return false;
  if (answers.some((answer) => !isListedOption(question, answer))) return false;
  return true;
};

export const saveRoomDemographicAnswers = async (
  userId: string,
  questionId: number,
  answers: string[],
): Promise<void> => {
  const question = await getDemographicQuestion(questionId);
  if (!question || question.roomId === null) {
    throw new RouteError("That question isn't part of a post", 404);
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
    answer: answer.answer ?? "Not answered",
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