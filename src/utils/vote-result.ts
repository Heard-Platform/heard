import type { Statement, VoteType } from "../types";
import { getAllAgrees, getDecisiveVotes, isSwingVote } from "./statement";

export const NEARLY_SPLIT_MAX_PERCENT_GAP = 10;

export type DecisiveVoteSide = "agree" | "disagree";

export type VoteResultKind =
  | "first_vote"
  | "swung_vote"
  | "nearly_split"
  | "with_majority"
  | "in_minority";

export interface VoteResult {
  kind: VoteResultKind;
  voterSide: DecisiveVoteSide;
  majoritySide: DecisiveVoteSide;
  agreePercent: number;
  disagreePercent: number;
  agreePercentBeforeVote: number;
  agreeCount: number;
  disagreeCount: number;
  decisiveVoteCount: number;
}

export const getDecisiveVoteSide = (
  voteType: VoteType,
): DecisiveVoteSide | null => {
  if (voteType === "agree" || voteType === "super_agree") return "agree";
  if (voteType === "disagree") return "disagree";
  return null;
};

const calcAgreePercent = (agreeCount: number, decisiveVoteCount: number) =>
  Math.round((agreeCount / decisiveVoteCount) * 100);

interface VoteToClassify {
  statementBeforeVote: Statement;
  voteType: VoteType;
  voterSide: DecisiveVoteSide;
  majoritySide: DecisiveVoteSide;
  agreePercent: number;
}

const isNearlySplit = (agreePercent: number) =>
  Math.abs(agreePercent - (100 - agreePercent)) <= NEARLY_SPLIT_MAX_PERCENT_GAP;

const classifyVoteResult = ({
  statementBeforeVote,
  voteType,
  voterSide,
  majoritySide,
  agreePercent,
}: VoteToClassify): VoteResultKind => {
  if (getDecisiveVotes(statementBeforeVote) === 0) return "first_vote";
  if (isSwingVote(statementBeforeVote, voteType)) return "swung_vote";
  if (isNearlySplit(agreePercent)) return "nearly_split";
  return voterSide === majoritySide ? "with_majority" : "in_minority";
};

export const calcVoteResult = (
  statementBeforeVote: Statement,
  voteType: VoteType,
): VoteResult | null => {
  const voterSide = getDecisiveVoteSide(voteType);
  if (!voterSide) return null;

  const agreeCountBeforeVote = getAllAgrees(statementBeforeVote);
  const decisiveVoteCountBeforeVote = getDecisiveVotes(statementBeforeVote);

  const agreeCount = agreeCountBeforeVote + (voterSide === "agree" ? 1 : 0);
  const disagreeCount =
    statementBeforeVote.disagrees + (voterSide === "disagree" ? 1 : 0);
  const decisiveVoteCount = agreeCount + disagreeCount;

  const agreePercent = calcAgreePercent(agreeCount, decisiveVoteCount);
  const agreePercentBeforeVote =
    decisiveVoteCountBeforeVote === 0
      ? agreePercent
      : calcAgreePercent(agreeCountBeforeVote, decisiveVoteCountBeforeVote);
  const majoritySide: DecisiveVoteSide =
    agreePercent >= 50 ? "agree" : "disagree";

  return {
    kind: classifyVoteResult({
      statementBeforeVote,
      voteType,
      voterSide,
      majoritySide,
      agreePercent,
    }),
    voterSide,
    majoritySide,
    agreePercent,
    disagreePercent: 100 - agreePercent,
    agreePercentBeforeVote,
    agreeCount,
    disagreeCount,
    decisiveVoteCount,
  };
};

export const getVoterSidePercent = (result: VoteResult): number =>
  result.voterSide === "agree" ? result.agreePercent : result.disagreePercent;

export const getEmphasizedSide = (result: VoteResult): DecisiveVoteSide =>
  result.kind === "nearly_split" ? result.voterSide : result.majoritySide;

export const getVoteResultHeadline = (result: VoteResult): string => {
  switch (result.kind) {
    case "first_vote":
      return "First vote!";
    case "swung_vote":
      return "You swung the vote!";
    case "nearly_split":
      return `Nearly split, ${result.agreePercent} to ${result.disagreePercent}`;
    case "with_majority":
      return `${getVoterSidePercent(result)}% ${result.voterSide} with you`;
    case "in_minority":
      return `You're in the ${getVoterSidePercent(result)}% who ${result.voterSide}`;
  }
};

export const getVoteResultDetail = (result: VoteResult): string => {
  if (result.kind === "swung_vote") {
    const voterSideCount =
      result.voterSide === "agree" ? result.agreeCount : result.disagreeCount;
    const otherSideCount =
      result.voterSide === "agree" ? result.disagreeCount : result.agreeCount;
    return `now ${result.voterSide} ${voterSideCount} to ${otherSideCount}`;
  }
  return `${result.decisiveVoteCount} votes`;
};
