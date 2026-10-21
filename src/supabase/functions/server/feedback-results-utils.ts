import type { AppFeedbackVote, VoteType } from "./types.tsx";
import {
  APP_FEEDBACK_STATEMENT_KEYS,
  type AppFeedbackStatementKey,
  FEEDBACK_CARD_NOTE_SOURCE,
} from "./feedback-utils.ts";

export const FEEDBACK_CARD_SHOWN_EVENT = "feedback_card_shown";

const FOUNDER_CHAT_KEY: AppFeedbackStatementKey = "founder_chat";

export interface AppFeedbackStatementResult {
  statementKey: string;
  agree: number;
  superAgree: number;
  disagree: number;
  pass: number;
  total: number;
}

export interface FounderChatOptIn {
  userId: string;
  email: string | null;
  votedAt: number;
}

export interface FeedbackCardNote {
  id: string;
  userId: string;
  statementKey: string;
  roomId: string | null;
  text: string;
  createdAt: string;
}

export interface AppFeedbackResults {
  statements: AppFeedbackStatementResult[];
  founderOptIns: FounderChatOptIn[];
  notes: FeedbackCardNote[];
  usersShown: number;
  usersVoted: number;
  usersWithNote: number;
}

export const isFounderChatOptIn = (vote: AppFeedbackVote) =>
  vote.statementKey === FOUNDER_CHAT_KEY && (vote.vote === "agree" || vote.vote === "super_agree");

export const buildAppFeedbackResults = ({
  votes,
  notes,
  emailsByUserId,
  shownUserIds,
  developerIds,
}: {
  votes: AppFeedbackVote[];
  notes: FeedbackCardNote[];
  emailsByUserId: Map<string, string | null>;
  shownUserIds: Set<string>;
  developerIds: Set<string>;
}): AppFeedbackResults => {
  const isReal = (userId: string) => !developerIds.has(userId);
  const realVotes = votes.filter((vote) => isReal(vote.userId));
  const realNotes = notes.filter((note) => isReal(note.userId));

  const statements = APP_FEEDBACK_STATEMENT_KEYS.map((statementKey) => {
    const forKey = realVotes.filter((vote) => vote.statementKey === statementKey);
    const count = (type: VoteType) => forKey.filter((vote) => vote.vote === type).length;
    return {
      statementKey,
      agree: count("agree"),
      superAgree: count("super_agree"),
      disagree: count("disagree"),
      pass: count("pass"),
      total: forKey.length,
    };
  });

  const founderOptIns = realVotes
    .filter(isFounderChatOptIn)
    .map(({ userId, votedAt }) => ({ userId, email: emailsByUserId.get(userId) ?? null, votedAt }))
    .sort((a, b) => b.votedAt - a.votedAt);

  return {
    statements,
    founderOptIns,
    notes: [...realNotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    usersShown: [...shownUserIds].filter(isReal).length,
    usersVoted: new Set(realVotes.map((vote) => vote.userId)).size,
    usersWithNote: new Set(realNotes.map((note) => note.userId)).size,
  };
};

export const isFeedbackCardNote = (record: any): record is FeedbackCardNote =>
  record.source === FEEDBACK_CARD_NOTE_SOURCE;
