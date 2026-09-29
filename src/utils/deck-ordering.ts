import _ from "lodash";
import { DeckOrder, VoteType } from "../types";
import {
  estimateClusterProbabilities,
  calcVoteInfoValue,
  isStillPlacing,
} from "./cluster-estimation";

export const FIXED_VISIBLE_CARDS = 3;

export interface DeckOrderState {
  statementIds: string[];
  deckOrder: DeckOrder | null;
  lastAdaptedVoteCount: number;
}

export const INITIAL_DECK_ORDER_STATE: DeckOrderState = {
  statementIds: [],
  deckOrder: null,
  lastAdaptedVoteCount: 0,
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
  const fixed = _.take(statementIds, FIXED_VISIBLE_CARDS);
  const rest = _.drop(statementIds, FIXED_VISIBLE_CARDS);
  const best = _(rest)
    .reject((id) => id === deckOrder.consensusStatementId)
    .map((id) => ({
      id,
      infoValue: calcVoteInfoValue(deckOrder, clusterProbabilities, id),
    }))
    .maxBy("infoValue");
  if (!best || best.infoValue <= 0) return statementIds;

  const remaining = _.without(rest, best.id);
  const insertAt =
    remaining[0] === deckOrder.consensusStatementId ? 1 : 0;
  remaining.splice(insertAt, 0, best.id);
  return [...fixed, ...remaining];
}

export function nextDeckOrder(
  previous: DeckOrderState,
  unvotedIds: string[],
  deckOrder: DeckOrder | null,
  userVotes: Record<string, VoteType>,
): DeckOrderState {
  if (!deckOrder)
    return {
      statementIds: unvotedIds,
      deckOrder,
      lastAdaptedVoteCount: previous.lastAdaptedVoteCount,
    };

  const base = putFirst(deckOrder.leadStatementIds, unvotedIds);
  const carried =
    previous.deckOrder === deckOrder
      ? previous.statementIds
      : previous.statementIds
          .filter((id) => unvotedIds.includes(id))
          .slice(0, FIXED_VISIBLE_CARDS);
  let statementIds = putFirst(carried, base);

  const votesCast = _.size(userVotes);
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

  return { statementIds, deckOrder, lastAdaptedVoteCount };
}
