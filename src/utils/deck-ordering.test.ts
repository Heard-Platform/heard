import { describe, expect, it } from "vitest";
import _ from "lodash";
import type { DeckOrder, VoteRates } from "../types";
import {
  INITIAL_DECK_ORDER_STATE,
  nextDeckOrder,
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
      { stableId: "A", size: 50, voteRates: { divisive: MOSTLY_AGREES, shared: MOSTLY_AGREES, other: MOSTLY_AGREES } },
      { stableId: "B", size: 50, voteRates: { divisive: MOSTLY_DISAGREES, shared: MOSTLY_AGREES, other: MOSTLY_DISAGREES } },
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
  it("moves the most informative card to just after the visible cards", () => {
    expect(
      pullForwardMostInformative(["v1", "v2", "v3", "shared", "divisive"], makeDeckOrder(), [0.5, 0.5]),
    ).toEqual(["v1", "v2", "v3", "divisive", "shared"]);
  });

  it("never moves the visible cards or displaces the consensus card", () => {
    const deckOrder = makeDeckOrder({ consensusStatementId: "shared" });
    expect(
      pullForwardMostInformative(["divisive", "v2", "v3", "shared", "x", "other"], deckOrder, [0.5, 0.5]),
    ).toEqual(["divisive", "v2", "v3", "shared", "other", "x"]);
  });

  it("leaves the order alone when nothing is informative", () => {
    const statementIds = ["v1", "v2", "v3", "x", "y"];
    expect(pullForwardMostInformative(statementIds, makeDeckOrder(), [0.5, 0.5])).toEqual(statementIds);
  });
});

describe("nextDeckOrder", () => {
  it("uses the incoming order unchanged when there is no deck order", () => {
    const state = nextDeckOrder(INITIAL_DECK_ORDER_STATE, ["s1", "s2"], null, {});
    expect(state.statementIds).toEqual(["s1", "s2"]);
  });

  it("starts from the lead order when the deck order is available from the start", () => {
    const deckOrder = makeDeckOrder({ leadStatementIds: ["divisive", "other"] });
    const state = nextDeckOrder(INITIAL_DECK_ORDER_STATE, ["s1", "other", "divisive"], deckOrder, {});
    expect(state.statementIds.slice(0, 2)).toEqual(["divisive", "other"]);
  });

  it("keeps already-visible cards when the deck order arrives after the first render", () => {
    const deckOrder = makeDeckOrder({ leadStatementIds: ["divisive"] });
    const before = nextDeckOrder(INITIAL_DECK_ORDER_STATE, ["s1", "s2", "s3", "s4", "divisive"], null, {});
    const after = nextDeckOrder(before, ["s1", "s2", "s3", "s4", "divisive"], deckOrder, {});
    expect(after.statementIds).toEqual(["s1", "s2", "s3", "divisive", "s4"]);
  });

  it("stays stable when the incoming order is reshuffled by a poll", () => {
    const deckOrder = makeDeckOrder();
    const first = nextDeckOrder(INITIAL_DECK_ORDER_STATE, ["s1", "s2", "s3"], deckOrder, {});
    const polled = nextDeckOrder(first, ["s3", "s2", "s1", "s4"], deckOrder, {});
    expect(polled.statementIds).toEqual(["s1", "s2", "s3", "s4"]);
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
      { statementIds: unvoted, deckOrder, lastAdaptedVoteCount: 0 },
      unvoted,
      deckOrder,
      { divisive: "pass" },
    );
    expect(state.statementIds).toEqual(["v1", "v2", "v3", "other", "shared"]);
    expect(state.lastAdaptedVoteCount).toBe(1);
  });
});

describe("nextDeckOrder walkthrough with three groups", () => {
  const deckOrder: DeckOrder = {
    leadStatementIds: ["c-disagrees", "v2", "v3", "x", "y", "c-disagrees-2", "b-disagrees"],
    consensusStatementId: null,
    clusters: [
      { stableId: "A", size: 30, voteRates: { "c-disagrees": MOSTLY_AGREES, "c-disagrees-2": MOSTLY_AGREES, "b-disagrees": MOSTLY_AGREES } },
      { stableId: "B", size: 30, voteRates: { "c-disagrees": MOSTLY_AGREES, "c-disagrees-2": MOSTLY_AGREES, "b-disagrees": MOSTLY_DISAGREES } },
      { stableId: "C", size: 30, voteRates: { "c-disagrees": MOSTLY_DISAGREES, "c-disagrees-2": MOSTLY_DISAGREES, "b-disagrees": MOSTLY_AGREES } },
    ],
  };
  const allIds = ["c-disagrees", "v2", "v3", "x", "y", "c-disagrees-2", "b-disagrees"];
  const idsAfterFirstVote = allIds.filter((id) => id !== "c-disagrees");

  it("adapts after the first vote, then holds steady until the next vote", () => {
    const opened = nextDeckOrder(INITIAL_DECK_ORDER_STATE, allIds, deckOrder, {});
    expect(opened.statementIds).toEqual(allIds);

    const afterVote = nextDeckOrder(opened, idsAfterFirstVote, deckOrder, { "c-disagrees": "agree" });
    expect(afterVote.statementIds).toEqual(["v2", "v3", "x", "b-disagrees", "y", "c-disagrees-2"]);

    const reshuffledByPoll = _.shuffle(idsAfterFirstVote);
    const afterPoll = nextDeckOrder(afterVote, reshuffledByPoll, deckOrder, { "c-disagrees": "agree" });
    expect(afterPoll.statementIds).toEqual(afterVote.statementIds);
  });

  it("voting against a cluster pulls another cluster's card forward", () => {
    const opened = nextDeckOrder(INITIAL_DECK_ORDER_STATE, allIds, deckOrder, {});
    const afterAgree = nextDeckOrder(opened, idsAfterFirstVote, deckOrder, { "c-disagrees": "agree" });
    expect(afterAgree.statementIds[3]).toBe("b-disagrees");
  });

  it("voting with a cluster pulls another card of that cluster to confirm", () => {
    const opened = nextDeckOrder(INITIAL_DECK_ORDER_STATE, allIds, deckOrder, {});
    const afterDisagree = nextDeckOrder(opened, idsAfterFirstVote, deckOrder, { "c-disagrees": "disagree" });
    expect(afterDisagree.statementIds[3]).toBe("c-disagrees-2");
  });
});
