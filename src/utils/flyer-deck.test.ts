import { describe, expect, it } from "vitest";
import type { DeckOrder, Statement, VoteType } from "../types";
import { flyerCandidates, toMinimapClusters } from "./flyer-deck";

function statement(id: string, voters: Record<string, VoteType> = {}): Statement {
  return {
    id,
    text: `text-${id}`,
    author: "author",
    roomId: "room",
    timestamp: 0,
    agrees: 0,
    disagrees: 0,
    passes: 0,
    superAgrees: 0,
    voters,
    round: 1,
  };
}

const ids = (statements: Statement[]) => statements.map((s) => s.id);

describe("flyerCandidates", () => {
  it("leaves out the flyer statement and statements the user already voted on", () => {
    const statements = [statement("flyer"), statement("s1"), statement("s2", { me: "agree" }), statement("s3")];
    expect(ids(flyerCandidates(statements, "flyer", "me"))).toEqual(["s1", "s3"]);
  });
});

describe("toMinimapClusters", () => {
  it("is empty without a deck order", () => {
    expect(toMinimapClusters(null)).toEqual([]);
  });

  it("keeps identity, slot, name and size", () => {
    const deckOrder: DeckOrder = {
      leadStatementIds: [],
      consensusStatementId: null,
      clusters: [{ stableId: "a", slot: 2, name: "Night Owls", size: 12, voteRates: {} }],
    };
    expect(toMinimapClusters(deckOrder)).toEqual([{ stableId: "a", slot: 2, name: "Night Owls", size: 12 }]);
  });
});
