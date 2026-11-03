import type { Statement, VoteType, SimpleVoteType } from "../types";
import { getDecisiveVotes, isSwingVote } from "./statement";

const NEARLY_SPLIT_MAX_PERCENT_GAP = 10;

export type VoteEventType = "first_vote" | "swung_vote";

export interface VoteEvent {
  type: VoteEventType;
  headline: string;
}

export interface CrowdVerdict {
  headline: string;
  leadingSide: SimpleVoteType | null;
}

const VOTE_EVENT_HEADLINES: Record<
  VoteEventType,
  string
> = {
  first_vote: "First vote!",
  swung_vote: "You swung the vote!",
};

const isDecisiveVote = (voteType: VoteType): boolean =>
  voteType !== "pass";

const calcAgreePercent = (
  agreeCount: number,
  decisiveVoteCount: number,
) => Math.round((agreeCount / decisiveVoteCount) * 100);

const isNearlySplit = (agreePercent: number) =>
  Math.abs(agreePercent - (100 - agreePercent)) <=
  NEARLY_SPLIT_MAX_PERCENT_GAP;

const authorHasVotedDecisively = (statement: Statement): boolean => {
  const authorVoteType = statement.voters?.[statement.author];
  return !!authorVoteType && isDecisiveVote(authorVoteType);
};

const isFirstNonAuthorVote = (statement: Statement): boolean => {
  const count = getDecisiveVotes(statement);
  if (count === 0) return true;
  if (count === 1 && authorHasVotedDecisively(statement)) return true;
  return false;
};

const getEventType = (
  statementBeforeVote: Statement,
  voteType: VoteType,
): VoteEventType | null => {
  if (isFirstNonAuthorVote(statementBeforeVote)) return "first_vote";
  if (isSwingVote(statementBeforeVote, voteType)) return "swung_vote";
  return null;
};

export const getVoteEvent = (
  statementBeforeVote: Statement,
  voteType: VoteType,
  voterId: string | undefined,
): VoteEvent | null => {
  if (
    voterId === statementBeforeVote.author ||
    !isDecisiveVote(voteType)
  )
    return null;

  const type = getEventType(statementBeforeVote, voteType);
  return type
    ? { type, headline: VOTE_EVENT_HEADLINES[type] }
    : null;
};

export const getCrowdVerdict = (
  voteCounts: Record<SimpleVoteType, number>,
): CrowdVerdict => {
  const { agree, disagree, pass } = voteCounts;
  const totalVoteCount = agree + disagree + pass;
  const decisiveVoteCount = agree + disagree;

  if (decisiveVoteCount === 0 || pass > totalVoteCount / 2) {
    return { headline: "Most passed", leadingSide: "pass" };
  }
  if (pass === 0 && disagree === 0)
    return { headline: "Everyone agrees", leadingSide: "agree" };

  if (pass === 0 && agree === 0)
    return {
      headline: "Everyone disagrees",
      leadingSide: "disagree",
    };

  const agreePercent = calcAgreePercent(agree, decisiveVoteCount);
  if (isNearlySplit(agreePercent))
    return { headline: "Split down the middle", leadingSide: null };

  return agreePercent > 50
    ? { headline: "Most agree", leadingSide: "agree" }
    : { headline: "Most disagree", leadingSide: "disagree" };
};
