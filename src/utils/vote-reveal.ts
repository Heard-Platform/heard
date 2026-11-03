import type { Statement, VoteType, SimpleVoteType } from "../types";
import { getVoteEvent, type VoteEvent } from "./vote-result";
import { toSimpleVote } from "./votes";

export const ANONYMOUS_CURRENT_VOTER_ID = "current-voter";

export const VOTE_REVEAL_SIDES: SimpleVoteType[] = ["disagree", "pass", "agree"];

export interface VoterVote {
  voterId: string;
  vote: SimpleVoteType;
}

export interface VoteReveal {
  statement: Statement;
  voterVotes: VoterVote[];
  currentVoterId: string;
  voteEvent: VoteEvent | null;
}

export const countVoterVotes = (voterVotes: VoterVote[]): Record<SimpleVoteType, number> => {
  const voteCounts: Record<SimpleVoteType, number> = { disagree: 0, pass: 0, agree: 0 };
  for (const { vote } of voterVotes) voteCounts[vote]++;
  return voteCounts;
};

const simpleVotesAfterVote = (
  statementBeforeVote: Statement,
  voteType: VoteType,
  currentVoterId: string,
): VoterVote[] => {
  const votersAfterVote = { ...statementBeforeVote.voters, [currentVoterId]: voteType };
  return Object.keys(votersAfterVote).map((voterId) => ({ voterId, vote: toSimpleVote(votersAfterVote[voterId]) }));
};

export const buildVoteReveal = (
  statementBeforeVote: Statement,
  voteType: VoteType,
  voterId: string | undefined,
): VoteReveal => {
  const currentVoterId = voterId ?? ANONYMOUS_CURRENT_VOTER_ID;
  return {
    statement: statementBeforeVote,
    voterVotes: simpleVotesAfterVote(statementBeforeVote, voteType, currentVoterId),
    currentVoterId,
    voteEvent: getVoteEvent(statementBeforeVote, voteType, voterId),
  };
};

const proportionalSlotCounts = (
  voteCounts: Record<SimpleVoteType, number>,
  totalVoteCount: number,
  slotCount: number,
): Record<SimpleVoteType, number> => {
  const exactShares = VOTE_REVEAL_SIDES.map((side) => ({
    side,
    exactShare: (voteCounts[side] / totalVoteCount) * slotCount,
  }));
  const slotCounts: Record<SimpleVoteType, number> = { disagree: 0, pass: 0, agree: 0 };
  for (const { side, exactShare } of exactShares) slotCounts[side] = Math.floor(exactShare);
  const leftoverSlotCount = slotCount - VOTE_REVEAL_SIDES.reduce((sum, side) => sum + slotCounts[side], 0);
  [...exactShares]
    .sort((a, b) => (b.exactShare % 1) - (a.exactShare % 1))
    .slice(0, leftoverSlotCount)
    .forEach(({ side }) => slotCounts[side]++);
  return slotCounts;
};

export const sampleVotesForCrowd = (
  voterVotes: VoterVote[],
  maxAnimalCount: number,
  currentVoterId: string,
): VoterVote[] => {
  if (voterVotes.length <= maxAnimalCount) return voterVotes;
  const currentVoterVotes = voterVotes.filter(({ voterId }) => voterId === currentVoterId);
  const otherVoterVotes = voterVotes.filter(({ voterId }) => voterId !== currentVoterId);
  const slotCounts = proportionalSlotCounts(
    countVoterVotes(otherVoterVotes),
    otherVoterVotes.length,
    maxAnimalCount - currentVoterVotes.length,
  );
  const sampledOtherVoterVotes = VOTE_REVEAL_SIDES.flatMap((side) =>
    otherVoterVotes.filter(({ vote }) => vote === side).slice(0, slotCounts[side]),
  );
  return [...sampledOtherVoterVotes, ...currentVoterVotes];
};
