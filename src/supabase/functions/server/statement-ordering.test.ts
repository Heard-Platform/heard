import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ClusterIdentity } from "./cluster-identity.ts";
import { VotedStatement } from "./cluster-stance-utils.ts";
import { VoteType } from "./types.tsx";
import {
  assembleCards,
  buildDeckOrder,
  calcVoteRates,
  interleaveDistinguishingStatements,
  interleaveUnique,
} from "./statement-ordering.ts";

function users(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${i}`);
}

function cluster(stableId: string, memberIds: string[]): ClusterIdentity {
  return { stableId, clusterIndex: 0, slot: 0, memberIds, naming: null };
}

function statement(id: string, votesByGroup: [string[], VoteType][]): VotedStatement {
  const voters: Record<string, VoteType> = {};
  for (const [ids, vote] of votesByGroup) {
    for (const userId of ids) voters[userId] = vote;
  }
  return { id, text: `text-${id}`, voters };
}

const a = users("a", 30);
const b = users("b", 20);
const c = users("c", 10);
const clusters = [cluster("A", a), cluster("B", b), cluster("C", c)];

Deno.test("interleaveDistinguishingStatements - round-robins clusters largest first, skipping repeats", () => {
  const statements = [
    statement("a-only", [[a, "agree"], [b, "disagree"], [c, "disagree"]]),
    statement("b-only", [[a, "disagree"], [b, "agree"], [c, "disagree"]]),
    statement("c-only", [[a, "disagree"], [b, "disagree"], [c, "agree"]]),
  ];

  const picked = interleaveDistinguishingStatements(clusters, statements, 6);

  assertEquals(picked.length, 3);
  assertEquals(new Set(picked).size, 3);
  assertEquals(picked[0], "a-only");
});

Deno.test("interleaveUnique - takes one from each list in turn, skipping repeats", () => {
  assertEquals(interleaveUnique([["x", "y"], ["x", "z"]], 6), ["x", "y", "z"]);
});

Deno.test("interleaveUnique - carries on with longer lists once shorter ones run out", () => {
  assertEquals(interleaveUnique([["a1"], ["b1", "b2", "b3"]], 6), ["a1", "b1", "b2", "b3"]);
});

Deno.test("interleaveUnique - stops at the requested count", () => {
  assertEquals(interleaveUnique([["a1", "a2"], ["b1", "b2"]], 3), ["a1", "b1", "a2"]);
});

Deno.test("interleaveDistinguishingStatements - stops at the requested count", () => {
  const statements = Array.from({ length: 5 }, (_, i) =>
    statement(`s${i}`, [[a, "agree"], [b, "disagree"], [c, "disagree"]])
  );
  assertEquals(interleaveDistinguishingStatements(clusters, statements, 2).length, 2);
});

Deno.test("calcVoteRates - Laplace-smoothed agree/disagree/pass rates per statement", () => {
  const statements = [statement("s", [[users("m", 2), "agree"], [["m2"], "super_agree"], [["x"], "disagree"]])];
  assertEquals(calcVoteRates(users("m", 3), statements), { s: [0.667, 0.167, 0.167] });
});

Deno.test("calcVoteRates - statements with no member votes are uniform", () => {
  assertEquals(calcVoteRates(["m0"], [statement("s", [])]), { s: [0.333, 0.333, 0.333] });
});

Deno.test("assembleCards - consensus third", () => {
  assertEquals(assembleCards(["A1", "B1", "C1", "A2"], "X"), ["A1", "B1", "X", "C1", "A2"]);
});

Deno.test("assembleCards - works without consensus or with a short lead", () => {
  assertEquals(assembleCards(["A1", "B1"], null), ["A1", "B1"]);
  assertEquals(assembleCards(["A1"], "X"), ["A1", "X"]);
});

Deno.test("buildDeckOrder - null with fewer than two clusters or nothing distinguishing", () => {
  const shared = [statement("s", [[a, "agree"], [b, "agree"]])];
  assertEquals(buildDeckOrder([cluster("A", a)], shared), null);
  assertEquals(buildDeckOrder([cluster("A", a), cluster("B", b)], shared), null);
});

Deno.test("buildDeckOrder - lead covers each cluster, adds consensus and per-cluster vote rates", () => {
  const statements = [
    statement("a-only", [[a, "agree"], [b, "disagree"]]),
    statement("b-only", [[a, "disagree"], [b, "agree"]]),
    statement("common", [[a, "agree"], [b, "agree"]]),
    statement("new", []),
  ];

  const named: ClusterIdentity = {
    ...cluster("B", b),
    slot: 1,
    naming: { name: "Night Owls", namedAt: 0, stanceSnapshot: [], previousName: null, renameReason: null },
  };
  const deckOrder = buildDeckOrder([cluster("A", a), named], statements)!;

  assertEquals(deckOrder.consensusStatementId, "common");
  assertEquals(deckOrder.leadStatementIds.slice(0, 2).sort(), ["a-only", "b-only"]);
  assertEquals(deckOrder.leadStatementIds[2], "common");
  assertEquals(deckOrder.leadStatementIds.length, 3);
  assertEquals(deckOrder.clusters.map((cl) => [cl.stableId, cl.size]), [["A", 30], ["B", 20]]);
  assertEquals(deckOrder.clusters.map((cl) => [cl.slot, cl.name]), [[0, null], [1, "Night Owls"]]);
  assertEquals(Object.keys(deckOrder.clusters[0].voteRates).length, 4);
});
