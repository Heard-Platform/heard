import _ from "lodash";
import { DeckOrder, VoteType } from "../types";
import {
  estimateClusterProbabilities,
  calcVoteInfoValue,
  isStillPlacing,
} from "./cluster-estimation";

export const READABLE_CARD_COUNT = 2;
export const CONSENSUS_SLOT = 1;

export interface DeckOrderState {
  statementIds: string[];
  lastAdaptedVoteCount: number;
  startVoteCount: number | null;
}

export const INITIAL_DECK_ORDER_STATE: DeckOrderState = {
  statementIds: [],
  lastAdaptedVoteCount: 0,
  startVoteCount: null,
};

export function putFirst(firstIds: string[], ids: string[]): string[] {
  const first = firstIds.filter((id) => ids.includes(id));
  const rest = ids.filter((id) => !first.includes(id));
  return [...first, ...rest];
}

export function pullForwardMostInformative(
  statementIds: string[],
  deckOrder: DeckOrder,
  clusterProbabilities: number[],
): string[] {
  const fixed = _.take(statementIds, READABLE_CARD_COUNT);
  const rest = _.drop(statementIds, READABLE_CARD_COUNT);
  const best = _(rest)
    .reject((id) => id === deckOrder.consensusStatementId)
    .map((id) => ({
      id,
      infoValue: calcVoteInfoValue(deckOrder, clusterProbabilities, id),
    }))
    .maxBy("infoValue");
  if (!best || best.infoValue <= 0) return statementIds;

  return [...fixed, best.id, ..._.without(rest, best.id)];
}

export function placeConsensus(
  statementIds: string[],
  consensusId: string | null,
  targetIndex: number,
): string[] {
  if (!consensusId || !statementIds.includes(consensusId)) return statementIds;

  const rest = _.without(statementIds, consensusId);
  const slot = _.clamp(targetIndex, 0, rest.length);
  return [..._.take(rest, slot), consensusId, ..._.drop(rest, slot)];
}

export function nextDeckOrder(
  previous: DeckOrderState,
  unvotedIds: string[],
  deckOrder: DeckOrder | null,
  userVotes: Record<string, VoteType>,
): DeckOrderState {
  if (!deckOrder) return { ...previous, statementIds: unvotedIds };

  let statementIds = putFirst(previous.statementIds, putFirst(deckOrder.leadStatementIds, unvotedIds));

  const votesCast = _.size(userVotes);
  const startVoteCount = previous.startVoteCount ?? votesCast;
  let lastAdaptedVoteCount = previous.lastAdaptedVoteCount;
  if (votesCast > lastAdaptedVoteCount) {
    const clusterProbabilities = estimateClusterProbabilities(
      deckOrder,
      userVotes,
    );
    if (isStillPlacing(clusterProbabilities, votesCast))
      statementIds = pullForwardMostInformative(
        statementIds,
        deckOrder,
        clusterProbabilities,
      );
    lastAdaptedVoteCount = votesCast;
  }

  const consensusTarget = CONSENSUS_SLOT - (votesCast - startVoteCount);
  statementIds = placeConsensus(statementIds, deckOrder.consensusStatementId, consensusTarget);

  return { statementIds, lastAdaptedVoteCount, startVoteCount };
}
