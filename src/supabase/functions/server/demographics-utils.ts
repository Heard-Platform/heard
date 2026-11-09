import { DemographicBreakdown } from "./analysis-utils.tsx";
import {
  DebateRoom,
  DemographicAnswer,
  DemographicQuestion,
  RoomDemographicQuestion,
} from "./types.tsx";
import {
  getAnsweredDemographicQuestionIds,
  getDemographicQuestion,
  getDemographicQuestionsForEvents,
  getDemographicQuestionsForRooms,
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

const findQuestionsForRoom = (
  room: DebateRoom,
  roomQuestionsByRoomId: Record<string, RoomDemographicQuestion[]>,
  eventQuestionsByEventId: Record<string, DemographicQuestion[]>,
): DemographicQuestion[] => {
  const eventQuestions = room.eventId
    ? eventQuestionsByEventId[room.eventId] ?? []
    : [];
  if (eventQuestions.length > 0) return eventQuestions;
  return roomQuestionsByRoomId[room.id] ?? [];
};

export const buildUnansweredQuestionsByRoomId = (
  rooms: DebateRoom[],
  roomQuestions: RoomDemographicQuestion[],
  eventQuestions: DemographicQuestion[],
  answeredQuestionIds: number[],
): Record<string, DemographicQuestion[]> => {
  const roomQuestionsByRoomId = _.groupBy(roomQuestions, "roomId");
  const eventQuestionsByEventId = _.groupBy(
    eventQuestions,
    "eventId",
  );
  const answeredQuestionIdSet = new Set(answeredQuestionIds);
  const unansweredQuestionsByRoomId: Record<
    string,
    DemographicQuestion[]
  > = {};
  for (const room of rooms) {
    const questions = findQuestionsForRoom(
      room,
      roomQuestionsByRoomId,
      eventQuestionsByEventId,
    );
    unansweredQuestionsByRoomId[room.id] = questions.filter(
      (question) => !answeredQuestionIdSet.has(question.id),
    );
  }
  return unansweredQuestionsByRoomId;
};

const collectEventIds = (rooms: DebateRoom[]): number[] => {
  const eventIds = rooms
    .map((room) => room.eventId)
    .filter(
      (eventId): eventId is number => typeof eventId === "number",
    );
  return [...new Set(eventIds)];
};

export const loadUnansweredQuestionsByRoomId = async (
  rooms: DebateRoom[],
  userId: string | undefined,
): Promise<Record<string, DemographicQuestion[]>> => {
  const [roomQuestions, eventQuestions, answeredQuestionIds] =
    await Promise.all([
      getDemographicQuestionsForRooms(rooms.map((room) => room.id)),
      getDemographicQuestionsForEvents(collectEventIds(rooms)),
      userId ? getAnsweredDemographicQuestionIds(userId) : [],
    ]);
  return buildUnansweredQuestionsByRoomId(
    rooms,
    roomQuestions,
    eventQuestions,
    answeredQuestionIds,
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