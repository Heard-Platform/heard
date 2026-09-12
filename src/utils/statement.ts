import type { Statement, VoteType } from "../types";

export const getAllAgrees = (statement: Statement): number =>
  statement.agrees + statement.superAgrees;

export const getDecisiveVotes = (statement: Statement): number =>
  getAllAgrees(statement) + statement.disagrees;

export interface SwingPercents {
  beforeAgreePercent: number;
  afterAgreePercent: number;
}

export const isSwingVote = (
  statement: Statement,
  voteType: VoteType,
): boolean => {
  const votes = getDecisiveVotes(statement);
  const beforeAgrees = getAllAgrees(statement);
  const beforeScore = beforeAgrees - statement.disagrees;

  const change = voteType === "agree" || voteType === "super_agree" ? 1
   : voteType === "disagree" ? -1 : 0

  const afterScore = beforeScore + change;

  return votes >= 2 && (afterScore != 0 && Math.sign(afterScore) != Math.sign(beforeScore));
};

export const calcSwingBeforeAndAfter = (
  statement: Statement,
  voteType: VoteType,
): SwingPercents => {
  const beforeAgrees = getAllAgrees(statement);
  const beforeDecisive = getDecisiveVotes(statement);

  const afterAgrees =
    beforeAgrees + (voteType === "agree" || voteType === "super_agree" ? 1 : 0);
  const afterDisagrees = statement.disagrees + (voteType === "disagree" ? 1 : 0);
  const afterDecisive = afterAgrees + afterDisagrees;

  return {
    beforeAgreePercent: (beforeAgrees / beforeDecisive) * 100,
    afterAgreePercent: (afterAgrees / afterDecisive) * 100,
  };
};
