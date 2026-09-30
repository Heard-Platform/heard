import { describe, expect, it } from "vitest";
import _ from "lodash";
import type { DeckOrder, VoteRates } from "../types";
import {
  INITIAL_DECK_ORDER_STATE,
  nextDeckOrder,
  placeConsensus,
  pullForwardMostInformative,
  putFirst,
} from "./deck-ordering";

const MOSTLY_AGREES: VoteRates = [0.9, 0.05, 0.05];
const MOSTLY_DISAGREES: VoteRates = [0.05, 0.9, 0.05];

function makeDeckOrder(overrides: Partial<DeckOrder> = {}): DeckOrder {
  return {
    leadStatementIds: [],
    consensusStatementId: null,
    clusters: [
      { stableId: "A", slot: 0, name: null, size: 50, voteRates: { divisive: MOSTLY_AGREES, shared: MOSTLY_AGREES, other: MOSTLY_AGREES } },
      { stableId: "B", slot: 1, name: null, size: 50, voteRates: { divisive: MOSTLY_DISAGREES, shared: MOSTLY_AGREES, other: MOSTLY_DISAGREES } },
    ],
    ...overrides,
  };
}

describe("putFirst", () => {
  it("puts the given ids first, in their order, then the rest in their original order", () => {
    expect(putFirst(["s3", "voted", "s1"], ["s1", "s2", "s3", "s4"])).toEqual(["s3", "s1", "s2", "s4"]);
  });

  it("drops first ids that are no longer present and appends new ones", () => {
    expect(putFirst(["s2", "s1", "s3"], ["s1", "s3", "s4"])).toEqual(["s1", "s3", "s4"]);
  });
});

describe("pullForwardMostInformative", () => {
  it("moves the most informative card to just after the two readable cards", () => {
    expect(
      pullForwardMostInformative(["v1", "v2", "v3", "shared", "divisive"], makeDeckOrder(), [0.5, 0.5]),
    ).toEqual(["v1", "v2", "divisive", "v3", "shared"]);
  });

  it("never moves the readable cards and never picks the consensus card", () => {
    const deckOrder = makeDeckOrder({ consensusStatementId: "divisive" });
    expect(
      pullForwardMostInformative(["v1", "v2", "x", "divisive", "other"], deckOrder, [0.5, 0.5]),
    ).toEqual(["v1", "v2", "other", "x", "divisive"]);
  });

  it("leaves the order alone when nothing is informative", () => {
    const statementIds = ["v1", "v2", "v3", "x", "y"];
    expect(pullForwardMostInformative(statementIds, makeDeckOrder(), [0.5, 0.5])).toEqual(statementIds);
  });
});

describe("placeConsensus", () => {
  it("puts the consensus card exactly at its slot, from behind or ahead", () => {
    expect(placeConsensus(["a", "b", "c", "cons", "d"], "cons", 2)).toEqual(["a", "b", "cons", "c", "d"]);
    expect(placeConsensus(["cons", "a", "b", "c"], "cons", 2)).toEqual(["a", "b", "cons", "c"]);
  });

  it("keeps the slot within the deck", () => {
    expect(placeConsensus(["a", "cons"], "cons", 5)).toEqual(["a", "cons"]);
    expect(placeConsensus(["a", "cons"], "cons", -1)).toEqual(["cons", "a"]);
  });

  it("does nothing without a consensus card, or once it's been voted", () => {
    expect(placeConsensus(["a", "b", "c"], null, 0)).toEqual(["a", "b", "c"]);
    expect(placeConsensus(["a", "b", "c"], "cons", 0)).toEqual(["a", "b", "c"]);
  });
});

describe("nextDeckOrder", () => {
  it("uses the incoming order unchanged when there is no deck order", () => {
    const state = nextDeckOrder(INITIAL_DECK_ORDER_STATE, ["s1", "s2"], null, {});
    expect(state.statementIds).toEqual(["s1", "s2"]);
  });

  it("starts from the lead order", () => {
    const deckOrder = makeDeckOrder({ leadStatementIds: ["divisive", "other"] });
    const state = nextDeckOrder(INITIAL_DECK_ORDER_STATE, ["s1", "other", "divisive"], deckOrder, {});
    expect(state.statementIds.slice(0, 2)).toEqual(["divisive", "other"]);
  });

  it("keeps its order between renders", () => {
    const deckOrder = makeDeckOrder();
    const first = nextDeckOrder(INITIAL_DECK_ORDER_STATE, ["s1", "s2", "s3"], deckOrder, {});
    const again = nextDeckOrder(first, ["s3", "s2", "s1"], deckOrder, {});
    expect(again.statementIds).toEqual(["s1", "s2", "s3"]);
  });

  it("does not adapt before the user has voted", () => {
    const deckOrder = makeDeckOrder({ leadStatementIds: ["v1", "v2", "v3", "shared", "other"] });
    const state = nextDeckOrder(INITIAL_DECK_ORDER_STATE, ["v1", "v2", "v3", "shared", "other"], deckOrder, {});
    expect(state.statementIds).toEqual(["v1", "v2", "v3", "shared", "other"]);
    expect(state.lastAdaptedVoteCount).toBe(0);
  });

  it("adapts once per new vote while still placing the user", () => {
    const deckOrder = makeDeckOrder();
    const unvoted = ["v1", "v2", "v3", "shared", "other"];
    const state = nextDeckOrder(
      { statementIds: unvoted, lastAdaptedVoteCount: 0, startVoteCount: 0 },
      unvoted,
      deckOrder,
      { divisive: "pass" },
    );
    expect(state.statementIds).toEqual(["v1", "v2", "other", "v3", "shared"]);
    expect(state.lastAdaptedVoteCount).toBe(1);
  });
});

describe("nextDeckOrder walkthrough with three groups", () => {
  const deckOrder: DeckOrder = {
    leadStatementIds: ["c-disagrees", "v2", "v3", "x", "y", "c-disagrees-2", "b-disagrees"],
    consensusStatementId: null,
    clusters: [
      { stableId: "A", slot: 0, name: null, size: 30, voteRates: { "c-disagrees": MOSTLY_AGREES, "c-disagrees-2": MOSTLY_AGREES, "b-disagrees": MOSTLY_AGREES } },
      { stableId: "B", slot: 1, name: null, size: 30, voteRates: { "c-disagrees": MOSTLY_AGREES, "c-disagrees-2": MOSTLY_AGREES, "b-disagrees": MOSTLY_DISAGREES } },
      { stableId: "C", slot: 2, name: null, size: 30, voteRates: { "c-disagrees": MOSTLY_DISAGREES, "c-disagrees-2": MOSTLY_DISAGREES, "b-disagrees": MOSTLY_AGREES } },
    ],
  };
  const allIds = ["c-disagrees", "v2", "v3", "x", "y", "c-disagrees-2", "b-disagrees"];
  const idsAfterFirstVote = allIds.filter((id) => id !== "c-disagrees");

  it("adapts after the first vote, then holds steady until the next vote", () => {
    const opened = nextDeckOrder(INITIAL_DECK_ORDER_STATE, allIds, deckOrder, {});
    expect(opened.statementIds).toEqual(allIds);

    const afterVote = nextDeckOrder(opened, idsAfterFirstVote, deckOrder, { "c-disagrees": "agree" });
    expect(afterVote.statementIds).toEqual(["v2", "v3", "b-disagrees", "x", "y", "c-disagrees-2"]);

    const rerendered = nextDeckOrder(afterVote, _.shuffle(idsAfterFirstVote), deckOrder, { "c-disagrees": "agree" });
    expect(rerendered.statementIds).toEqual(afterVote.statementIds);
  });

  it("voting against a cluster pulls another cluster's card forward", () => {
    const opened = nextDeckOrder(INITIAL_DECK_ORDER_STATE, allIds, deckOrder, {});
    const afterAgree = nextDeckOrder(opened, idsAfterFirstVote, deckOrder, { "c-disagrees": "agree" });
    expect(afterAgree.statementIds[2]).toBe("b-disagrees");
  });

  it("voting with a cluster pulls another card of that cluster to confirm", () => {
    const opened = nextDeckOrder(INITIAL_DECK_ORDER_STATE, allIds, deckOrder, {});
    const afterDisagree = nextDeckOrder(opened, idsAfterFirstVote, deckOrder, { "c-disagrees": "disagree" });
    expect(afterDisagree.statementIds[2]).toBe("c-disagrees-2");
  });
});

describe("nextDeckOrder consensus placement", () => {
  const deckOrder = makeDeckOrder({
    leadStatementIds: ["v1", "v2", "shared", "x", "y"],
    consensusStatementId: "shared",
  });
  const allIds = ["v1", "v2", "shared", "x", "y", "divisive", "other"];

  it("locks the consensus card to its slot while cards are pulled forward around it", () => {
    const opened = nextDeckOrder(INITIAL_DECK_ORDER_STATE, allIds, deckOrder, { flyer: "agree" });
    expect(opened.statementIds.slice(0, 2)).toEqual(["v1", "shared"]);

    const afterVote = nextDeckOrder(opened, _.without(allIds, "v1"), deckOrder, { flyer: "agree", v1: "agree" });
    expect(afterVote.statementIds[0]).toBe("shared");
  });
});
