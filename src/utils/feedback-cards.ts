import { FEEDBACK_STATEMENTS, type FeedbackStatement } from "./constants/feedback-statements";
import { hashString } from "./hash";

export interface VotedFeedback {
  statementKey: string;
  votedAt: number;
}

const isSameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth()
  && a.getDate() === b.getDate();

export const hasVotedToday = (votedFeedback: VotedFeedback[], now: Date) =>
  votedFeedback.some((voted) => isSameLocalDay(new Date(voted.votedAt), now));

export const pickFeedbackStatement = (
  votedFeedback: VotedFeedback[],
  userId: string,
  roomId: string,
  now: Date,
): FeedbackStatement | null => {
  if (hasVotedToday(votedFeedback, now)) return null;

  const votedKeys = new Set(votedFeedback.map((voted) => voted.statementKey));
  const unvoted = FEEDBACK_STATEMENTS.filter((statement) => !votedKeys.has(statement.key));
  if (unvoted.length === 0) return null;

  const currentSet = Math.min(...unvoted.map((statement) => statement.set));
  const candidates = unvoted.filter((statement) => statement.set === currentSet);
  return candidates[Math.abs(hashString(`${userId}:${roomId}`)) % candidates.length];
};
