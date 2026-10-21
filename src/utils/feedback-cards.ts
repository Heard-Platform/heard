import { FEEDBACK_STATEMENTS, type FeedbackStatement } from "./constants/feedback-statements";
import { hashString } from "./hash";

export interface FeedbackAnswer {
  statementKey: string;
  votedAt: number;
}

const isSameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth()
  && a.getDate() === b.getDate();

export const hasAnsweredToday = (answers: FeedbackAnswer[], now: Date) =>
  answers.some((answer) => isSameLocalDay(new Date(answer.votedAt), now));

export const pickFeedbackStatement = (
  answers: FeedbackAnswer[],
  userId: string,
  roomId: string,
  now: Date,
): FeedbackStatement | null => {
  if (hasAnsweredToday(answers, now)) return null;

  const answeredKeys = new Set(answers.map((answer) => answer.statementKey));
  const unanswered = FEEDBACK_STATEMENTS.filter((statement) => !answeredKeys.has(statement.key));
  if (unanswered.length === 0) return null;

  const currentSet = Math.min(...unanswered.map((statement) => statement.set));
  const candidates = unanswered.filter((statement) => statement.set === currentSet);
  return candidates[Math.abs(hashString(`${userId}:${roomId}`)) % candidates.length];
};
