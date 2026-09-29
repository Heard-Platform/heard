import { VoteType } from "./types.tsx";
import { ClusterIdentity } from "./cluster-identity.ts";

export const COMMON_GROUND_MIN_AGREE_RATE = 0.6;
export const COMMON_GROUND_MIN_VOTES_PER_CLUSTER = 3;

export interface VotedStatement {
  id: string;
  text: string;
  voters: Record<string, VoteType>;
}

export function isAgreeVote(vote: VoteType): boolean {
  return vote === "agree" || vote === "super_agree";
}

export function calcAgreeRate(
  voters: Record<string, VoteType>,
  memberIds: Set<string>,
): { agreeRate: number; opinionatedVotes: number } | null {
  let agrees = 0;
  let disagrees = 0;
  for (const [userId, vote] of Object.entries(voters)) {
    if (!memberIds.has(userId)) continue;
    if (isAgreeVote(vote)) agrees++;
    else if (vote === "disagree") disagrees++;
  }
  const opinionatedVotes = agrees + disagrees;
  if (opinionatedVotes === 0) return null;
  return { agreeRate: agrees / opinionatedVotes, opinionatedVotes };
}

export function rankCommonGround<T extends VotedStatement>(
  clusters: ClusterIdentity[],
  statements: T[],
): T[] {
  if (clusters.length < 2) return [];
  const memberSets = clusters.map((c) => new Set(c.memberIds));

  return statements
    .map((statement) => {
      const rates = memberSets.map((members) => calcAgreeRate(statement.voters, members));
      const qualifies = rates.every(
        (r) =>
          r !== null &&
          r.opinionatedVotes >= COMMON_GROUND_MIN_VOTES_PER_CLUSTER &&
          r.agreeRate >= COMMON_GROUND_MIN_AGREE_RATE,
      );
      const minRate = qualifies ? Math.min(...rates.map((r) => r!.agreeRate)) : -1;
      return { statement, minRate };
    })
    .filter((s) => s.minRate >= 0)
    .sort((a, b) => b.minRate - a.minRate)
    .map((s) => s.statement);
}
