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
  LONG_STATEMENT_CHARS,
  rankExplorationStatements,
  shortFirst,
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

Deno.test("rankExplorationStatements - under-voted statements, fewest votes first, excluding picked ones", () => {
  const statements = [
    statement("popular", [[users("p", 10), "agree"]]),
    statement("few", [[users("f", 3), "agree"]]),
    statement("none", []),
    statement("picked", []),
  ];
  assertEquals(rankExplorationStatements(statements, ["picked"]), ["none", "few"]);
});

Deno.test("assembleCards - consensus third, exploration every fourth card", () => {
  assertEquals(
    assembleCards(["A1", "B1", "C1", "A2", "B2", "C2"], "X", ["E1", "E2", "E3"]),
    ["A1", "B1", "X", "E1", "C1", "A2", "B2", "E2", "C2"],
  );
});

Deno.test("assembleCards - works without consensus or exploration candidates", () => {
  assertEquals(assembleCards(["A1", "B1"], null, []), ["A1", "B1"]);
  assertEquals(assembleCards(["A1"], "X", []), ["A1", "X"]);
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

  const deckOrder = buildDeckOrder([cluster("A", a), cluster("B", b)], statements)!;

  assertEquals(deckOrder.consensusStatementId, "common");
  assertEquals(deckOrder.leadStatementIds.slice(0, 2).sort(), ["a-only", "b-only"]);
  assertEquals(deckOrder.leadStatementIds[2], "common");
  assertEquals(deckOrder.leadStatementIds[3], "new");
  assertEquals(deckOrder.clusters.map((cl) => [cl.stableId, cl.size]), [["A", 30], ["B", 20]]);
  assertEquals(Object.keys(deckOrder.clusters[0].voteRates).length, 4);
});

const LONG_TEXT = "x".repeat(LONG_STATEMENT_CHARS + 1);

function long(votedStatement: VotedStatement): VotedStatement {
  return { ...votedStatement, text: LONG_TEXT };
}

Deno.test("shortFirst - keeps ranking order but moves long statements after short ones", () => {
  const ranked = [long(statement("l1", [])), statement("s1", []), long(statement("l2", [])), statement("s2", [])];
  assertEquals(shortFirst(ranked).map((s) => s.id), ["s1", "s2", "l1", "l2"]);
});

Deno.test("interleaveDistinguishingStatements - prefers a short statement over an equally distinguishing long one", () => {
  const statements = [
    long(statement("long", [[a, "agree"], [b, "disagree"]])),
    statement("short", [[a, "agree"], [b, "disagree"]]),
  ];
  assertEquals(interleaveDistinguishingStatements([cluster("A", a), cluster("B", b)], statements, 1), ["short"]);
});

Deno.test("interleaveDistinguishingStatements - falls back to long statements when there are no short ones", () => {
  const statements = [long(statement("long", [[a, "agree"], [b, "disagree"]]))];
  assertEquals(interleaveDistinguishingStatements([cluster("A", a), cluster("B", b)], statements, 1), ["long"]);
});

Deno.test("rankExplorationStatements - short under-voted statements come before long ones", () => {
  const statements = [long(statement("long-none", [])), statement("short-few", [[users("f", 3), "agree"]])];
  assertEquals(rankExplorationStatements(statements, []), ["short-few", "long-none"]);
});

Deno.test("buildDeckOrder - lists the long statements", () => {
  const statements = [
    statement("a-only", [[a, "agree"], [b, "disagree"]]),
    long(statement("wordy", [[a, "agree"], [b, "agree"]])),
  ];
  assertEquals(buildDeckOrder([cluster("A", a), cluster("B", b)], statements)!.longStatementIds, ["wordy"]);
});
