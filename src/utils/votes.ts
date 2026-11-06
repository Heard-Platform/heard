import type { Statement, VoteType, SimpleVoteType } from "../types";
import type { FlyerVote } from "../components/flyer/FlyerVoteIntroCard";

export const getTotalVotes = (statement: Statement): number =>
  (statement.agrees ?? 0) +
  (statement.disagrees ?? 0) +
  (statement.passes ?? 0) +
  (statement.superAgrees ?? 0);

export const getRoomVoteCount = (statements: Statement[]): number =>
  statements.reduce((total, s) => total + getTotalVotes(s), 0);

export const toSimpleVote = (voteType: VoteType): SimpleVoteType =>
  voteType === "super_agree" ? "agree" : voteType;

export const isFlyerVote = (
  voteType: VoteType,
): voteType is FlyerVote =>
  voteType === "agree" || voteType === "disagree";
