import _ from "lodash";
import { DeckOrder, VoteType } from "../types";
import {
  estimateClusterProbabilities,
  calcVoteInfoValue,
  isStillPlacing,
} from "./cluster-estimation";

export const FIXED_VISIBLE_CARDS = 3;
export const OPENING_CARD_COUNT = 6;

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

export function keepLongOutOfOpening(
  ids: string[],
  longIds: string[],
  openingSlots: number,
): string[] {
  const shortIds = ids.filter((id) => !longIds.includes(id));
  const openingShort = shortIds.slice(0, openingSlots);
  const openingLongFallback = ids
    .filter((id) => longIds.includes(id))
    .slice(0, Math.max(0, openingSlots - openingShort.length));
  const opening = [...openingShort, ...openingLongFallback];
  const rest = ids.filter((id) => !opening.includes(id));
  return [...opening, ...rest];
}

export function pullForwardMostInformative(
  statementIds: string[],
  deckOrder: DeckOrder,
  clusterProbabilities: number[],
  avoidLong: boolean,
): string[] {
  const fixed = _.take(statementIds, FIXED_VISIBLE_CARDS);
  const rest = _.drop(statementIds, FIXED_VISIBLE_CARDS);
  const candidates = rest.filter((id) => id !== deckOrder.consensusStatementId);
  const shortCandidates = candidates.filter((id) => !deckOrder.longStatementIds.includes(id));
  const pickFrom = avoidLong && shortCandidates.length > 0 ? shortCandidates : candidates;
  const best = _(pickFrom)
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

  const votesCast = _.size(userVotes);
  const base = keepLongOutOfOpening(
    putFirst(deckOrder.leadStatementIds, unvotedIds),
    deckOrder.longStatementIds,
    OPENING_CARD_COUNT - votesCast,
  );
  const carried =
    previous.deckOrder === deckOrder
      ? previous.statementIds
      : previous.statementIds
          .filter((id) => unvotedIds.includes(id))
          .slice(0, FIXED_VISIBLE_CARDS);
  let statementIds = putFirst(carried, base);

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
        votesCast + FIXED_VISIBLE_CARDS < OPENING_CARD_COUNT,
      );
    lastAdaptedVoteCount = votesCast;
  }

  return { statementIds, deckOrder, lastAdaptedVoteCount };
}
