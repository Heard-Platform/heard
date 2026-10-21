import type { AppFeedbackVote, VoteType } from "./types.tsx";

export const APP_FEEDBACK_STATEMENT_KEYS = [
  "founder_chat",
  "ui_confusing",
  "enjoying",
  "slow_load",
  "clear_idea",
  "told_someone",
  "topics_care",
] as const;

export type AppFeedbackStatementKey = typeof APP_FEEDBACK_STATEMENT_KEYS[number];

export const FEEDBACK_CARD_NOTE_SOURCE = "feedback_card";

const VOTE_TYPES: VoteType[] = ["agree", "disagree", "pass", "super_agree"];

export const isAppFeedbackStatementKey = (value: unknown): value is AppFeedbackStatementKey =>
  typeof value === "string" && (APP_FEEDBACK_STATEMENT_KEYS as readonly string[]).includes(value);

export const isVoteType = (value: unknown): value is VoteType =>
  typeof value === "string" && (VOTE_TYPES as string[]).includes(value);

export const reassignAnonymousVotes = (
  anonymousVotes: AppFeedbackVote[],
  targetVotes: AppFeedbackVote[],
  targetUserId: string,
): AppFeedbackVote[] => {
  const targetKeys = new Set(targetVotes.map((vote) => vote.statementKey));
  return anonymousVotes
    .filter((vote) => !targetKeys.has(vote.statementKey))
    .map((vote) => ({ ...vote, userId: targetUserId }));
};
