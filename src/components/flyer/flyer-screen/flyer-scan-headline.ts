import type { FlyerVote } from "../FlyerVoteIntroCard";

const MAJORITY_PERCENT = 55;
const MINORITY_PERCENT = 45;

interface StandingInput {
  vote: FlyerVote;
  agreePercent: number;
  areResultsTomorrow: boolean;
}

export function getStandingHeadline({ vote, agreePercent, areResultsTomorrow }: StandingInput): string {
  const sidePercent = vote === "agree" ? agreePercent : 100 - agreePercent;

  if (sidePercent >= MAJORITY_PERCENT) return `You're with ${sidePercent}% of DC right now. Will it hold?`;
  if (sidePercent < MINORITY_PERCENT) return "You're in the minority right now. Will DC come around?";
  return `Too close to call. Find out ${areResultsTomorrow ? "tomorrow" : "tonight"} at 7pm.`;
}
