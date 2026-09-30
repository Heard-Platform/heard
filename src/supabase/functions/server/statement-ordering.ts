import _ from "lodash";
import { ClusterIdentity } from "./cluster-identity.ts";
import { calcAnyDistinguishingStatements } from "./cluster-analysis.tsx";
import { isAgreeVote, rankCommonGround, VotedStatement } from "./cluster-stance-utils.ts";

export const LEAD_DISTINGUISHING_COUNT = 6;
export const CONSENSUS_LEAD_INDEX = 2;

export type VoteRates = [agree: number, disagree: number, pass: number];

export interface DeckOrderCluster {
  stableId: string;
  slot: number;
  name: string | null;
  size: number;
  voteRates: Record<string, VoteRates>;
}

export interface DeckOrder {
  leadStatementIds: string[];
  consensusStatementId: string | null;
  clusters: DeckOrderCluster[];
}

export function interleaveDistinguishingStatements(
  identities: ClusterIdentity[],
  statements: VotedStatement[],
  count: number,
): string[] {
  const bySize = _.orderBy(identities, (c) => c.memberIds.length, "desc");
  const rankedPerCluster = bySize.map((cluster) => {
    const others = identities
      .filter((c) => c.stableId !== cluster.stableId)
      .flatMap((c) => c.memberIds);
    return calcAnyDistinguishingStatements(statements, cluster.memberIds, others).map((s) => s.id);
  });

  return interleaveUnique(rankedPerCluster, count);
}

export function interleaveUnique(lists: string[][], count: number): string[] {
  return _(lists).unzip().flatten().compact().uniq().take(count).value();
}

export function calcVoteRates(
  memberIds: string[],
  statements: VotedStatement[],
): Record<string, VoteRates> {
  const members = new Set(memberIds);
  const rates: Record<string, VoteRates> = {};
  for (const statement of statements) {
    let agrees = 0;
    let disagrees = 0;
    let passes = 0;
    for (const [userId, vote] of Object.entries(statement.voters)) {
      if (!members.has(userId)) continue;
      if (isAgreeVote(vote)) agrees++;
      else if (vote === "disagree") disagrees++;
      else passes++;
    }
    const total = agrees + disagrees + passes + 3;
    rates[statement.id] = [
      _.round((agrees + 1) / total, 3),
      _.round((disagrees + 1) / total, 3),
      _.round((passes + 1) / total, 3),
    ];
  }
  return rates;
}

export function assembleCards(distinguishingIds: string[], consensusId: string | null): string[] {
  const lead = distinguishingIds.filter((id) => id !== consensusId);
  if (consensusId) {
    lead.splice(CONSENSUS_LEAD_INDEX, 0, consensusId);
  }
  return lead;
}

export function buildDeckOrder(
  identities: ClusterIdentity[],
  statements: VotedStatement[],
): DeckOrder | null {
  if (identities.length < 2) return null;

  const distinguishingIds = interleaveDistinguishingStatements(
    identities,
    statements,
    LEAD_DISTINGUISHING_COUNT,
  );
  if (distinguishingIds.length === 0) return null;

  const consensusStatementId =
    rankCommonGround(identities, statements).find((s) => !distinguishingIds.includes(s.id))?.id ?? null;

  return {
    leadStatementIds: assembleCards(distinguishingIds, consensusStatementId),
    consensusStatementId,
    clusters: identities.map((cluster) => ({
      stableId: cluster.stableId,
      slot: cluster.slot,
      name: cluster.naming?.name ?? null,
      size: cluster.memberIds.length,
      voteRates: calcVoteRates(cluster.memberIds, statements),
    })),
  };
}
