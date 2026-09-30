import _ from "lodash";
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
  const memberVotes = _.filter(voters, (_vote, userId) => memberIds.has(userId));
  const agrees = memberVotes.filter(isAgreeVote).length;
  const disagrees = memberVotes.filter((vote) => vote === "disagree").length;

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

  const scored = statements.map((statement) => {
    const rates = memberSets.map((members) => calcAgreeRate(statement.voters, members));
    const qualifies = rates.every(
      (r) =>
        r !== null &&
        r.opinionatedVotes >= COMMON_GROUND_MIN_VOTES_PER_CLUSTER &&
        r.agreeRate >= COMMON_GROUND_MIN_AGREE_RATE,
    );
    const minAgreeRate = qualifies ? _.min(rates.map((r) => r!.agreeRate)) ?? null : null;
    return { statement, minAgreeRate };
  });

  return _(scored)
    .filter((s) => s.minAgreeRate !== null)
    .orderBy("minAgreeRate", "desc")
    .map("statement")
    .value();
}
