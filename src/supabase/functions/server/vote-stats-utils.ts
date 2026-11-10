import type { Vote, VoteType } from "./types.tsx";

export const calculateVoteStats = (
  votes: Pick<Vote, "userId" | "voteType">[],
): {
  agrees: number;
  disagrees: number;
  passes: number;
  superAgrees: number;
  voters: { [userId: string]: VoteType };
} => {
  const voters: { [userId: string]: VoteType } = {};
  let agrees = 0;
  let disagrees = 0;
  let passes = 0;
  let superAgrees = 0;

  votes.forEach((vote) => {
    voters[vote.userId] = vote.voteType;
    if (vote.voteType === "agree") {
      agrees++;
    } else if (vote.voteType === "disagree") {
      disagrees++;
    } else if (vote.voteType === "pass") {
      passes++;
    } else if (vote.voteType === "super_agree") {
      superAgrees++;
      // Count super agrees also as regular agrees for now
      agrees++;
    }
  });

  return { agrees, disagrees, passes, superAgrees, voters };
};
