import type { Statement, VoteType } from "./types.tsx";

export interface AgreeAndDisagreeCounts {
  agreeCount: number;
  disagreeCount: number;
}

const countsAsAgree = (voteType: VoteType | null): boolean =>
  voteType === "agree" || voteType === "super_agree";

const countsAsDisagree = (voteType: VoteType | null): boolean =>
  voteType === "disagree";

const adjustCount = (
  storedCount: number,
  didPreviousVoteCount: boolean,
  doesNewVoteCount: boolean,
): number =>
  Math.max(0, storedCount - Number(didPreviousVoteCount) + Number(doesNewVoteCount));

export const countAgreesAndDisagreesWithNewVote = (
  statement: Pick<Statement, "agrees" | "disagrees">,
  previousVoteType: VoteType | null,
  newVoteType: VoteType,
): AgreeAndDisagreeCounts => ({
  agreeCount: adjustCount(
    statement.agrees,
    countsAsAgree(previousVoteType),
    countsAsAgree(newVoteType),
  ),
  disagreeCount: adjustCount(
    statement.disagrees,
    countsAsDisagree(previousVoteType),
    countsAsDisagree(newVoteType),
  ),
});
