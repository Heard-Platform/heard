import type { Statement, Vote, VoteType } from "./types.tsx";

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

type VoteCounts = Pick<
  Statement,
  "agrees" | "disagrees" | "passes" | "superAgrees"
>;

const changeVoteCounts = (
  counts: VoteCounts,
  voteType: VoteType,
  change: 1 | -1,
): VoteCounts => {
  let { agrees, disagrees, passes, superAgrees } = counts;
  switch (voteType) {
    case "agree":
      agrees += change;
      break;
    case "disagree":
      disagrees += change;
      break;
    case "pass":
      passes += change;
      break;
    case "super_agree":
      agrees += change;
      superAgrees += change;
      break;
  }
  return { agrees, disagrees, passes, superAgrees };
};

export const applyVoteToStatement = (
  statement: Statement,
  userId: string,
  previousVoteType: VoteType | null,
  newVoteType: VoteType,
): Statement => {
  const countsWithoutPreviousVote = previousVoteType
    ? changeVoteCounts(statement, previousVoteType, -1)
    : statement;
  const counts = changeVoteCounts(
    countsWithoutPreviousVote,
    newVoteType,
    1,
  );
  return {
    ...statement,
    ...counts,
    voters: { ...statement.voters, [userId]: newVoteType },
  };
};

