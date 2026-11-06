import type { SimpleVoteType, VoteType } from "./types.tsx";

export const toSimpleVote = (voteType: VoteType): SimpleVoteType =>
  voteType === "super_agree" ? "agree" : voteType;

export function isAgreeVote(vote: VoteType | null): boolean {
  return vote === "agree" || vote === "super_agree";
}

export function isDisagreeVote(vote: VoteType | null): boolean {
  return vote === "disagree";
}
