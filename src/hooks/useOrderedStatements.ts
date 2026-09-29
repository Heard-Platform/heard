import { useMemo, useRef } from "react";
import { DeckOrder, Statement, VoteType } from "../types";
import { INITIAL_DECK_ORDER_STATE, nextDeckOrder } from "../utils/deck-ordering";

export function useOrderedStatements(
  unvotedStatements: Statement[],
  deckOrder: DeckOrder | null,
  userVotes: Record<string, VoteType>,
): Statement[] {
  const stateRef = useRef(INITIAL_DECK_ORDER_STATE);

  return useMemo(() => {
    const byId = new Map(unvotedStatements.map((s) => [s.id, s]));
    const next = nextDeckOrder(stateRef.current, [...byId.keys()], deckOrder, userVotes);
    stateRef.current = next;
    return next.statementIds.map((id) => byId.get(id)!);
  }, [unvotedStatements, deckOrder, userVotes]);
}
