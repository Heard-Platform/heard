import type { VoteType } from "./types.tsx";

export function isAgreeVote(vote: VoteType | null): boolean {
  return vote === "agree" || vote === "super_agree";
}

export function isDisagreeVote(vote: VoteType | null): boolean {
  return vote === "disagree";
}
