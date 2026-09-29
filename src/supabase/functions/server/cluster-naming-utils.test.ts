import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ClusterIdentity } from "./cluster-identity.ts";
import { VoteType } from "./types.tsx";
import {
  buildNamingInputs,
  ClusterNamingInput,
  findCommonGround,
  hasStanceDrifted,
  isEligibleForNaming,
  makeClusterNamingPrompt,
  NamingStatement,
  parseClusterNamingResponse,
  parseClusterRenameResponse,
  validateName,
} from "./cluster-naming-utils.ts";

function users(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${i}`);
}

function cluster(stableId: string, memberIds: string[]): ClusterIdentity {
  return { stableId, clusterIndex: 0, slot: 0, memberIds, naming: null };
}

function statement(id: string, votesByGroup: [string[], VoteType][]): NamingStatement {
  const voters: Record<string, VoteType> = {};
  for (const [ids, vote] of votesByGroup) {
    for (const id of ids) voters[id] = vote;
  }
  return { id, text: `text-${id}`, voters };
}

const groupA = users("a", 30);
const groupB = users("b", 30);

Deno.test("validateName - accepts 2-3 words within 16 characters", () => {
  assertEquals(validateName("Hit the Brakes"), { ok: true, value: "Hit the Brakes" });
  assertEquals(validateName("  Show   Me Data "), { ok: true, value: "Show Me Data" });
});

Deno.test("validateName - rejects wrong word counts, long names and non-strings", () => {
  assertEquals(validateName("Brakes").ok, false);
  assertEquals(validateName("Slow It Right Down").ok, false);
  assertEquals(validateName("Extraordinarily Cautious").ok, false);
  assertEquals(validateName(42).ok, false);
});

Deno.test("buildNamingInputs - captures both directions with the cluster's agree rate", () => {
  const statements = [
    statement("pro", [[groupA, "agree"], [groupB, "disagree"]]),
    statement("shared", [[groupA, "agree"], [groupB, "agree"]]),
  ];

  const [a, b] = buildNamingInputs([cluster("A", groupA), cluster("B", groupB)], statements);

  assertEquals(a.size, 30);
  assertEquals(a.statements, [{ id: "pro", text: "text-pro", direction: "agrees", agreeRate: 1 }]);
  assertEquals(b.statements, [{ id: "pro", text: "text-pro", direction: "disagrees", agreeRate: 0 }]);
});

Deno.test("isEligibleForNaming - needs enough members and at least one distinguishing statement", () => {
  const stance = { id: "s", text: "t", direction: "agrees" as const, agreeRate: 1 };
  const base: ClusterNamingInput = { stableId: "x", size: 5, statements: [stance] };

  assertEquals(isEligibleForNaming(base), true);
  assertEquals(isEligibleForNaming({ ...base, size: 4 }), false);
  assertEquals(isEligibleForNaming({ ...base, statements: [] }), false);
});

Deno.test("findCommonGround - only statements every cluster agrees with, strongest first", () => {
  const statements = [
    statement("unanimous", [[groupA, "agree"], [groupB, "agree"]]),
    statement("split", [[groupA, "agree"], [groupB, "disagree"]]),
    statement("mostly", [[groupA, "agree"], [groupB.slice(0, 20), "agree"], [groupB.slice(20), "disagree"]]),
  ];

  assertEquals(
    findCommonGround([cluster("A", groupA), cluster("B", groupB)], statements),
    ["text-unanimous", "text-mostly"],
  );
});

Deno.test("findCommonGround - needs at least two clusters", () => {
  const statements = [statement("s", [[groupA, "agree"]])];
  assertEquals(findCommonGround([cluster("A", groupA)], statements), []);
});

Deno.test("hasStanceDrifted - unchanged stance is not drift", () => {
  const statements = [
    statement("s1", [[groupA, "agree"]]),
    statement("s2", [[groupA, "disagree"]]),
  ];
  const snapshot = [
    { statementId: "s1", agreeRate: 0.9 },
    { statementId: "s2", agreeRate: 0.1 },
  ];

  assertEquals(hasStanceDrifted(snapshot, groupA, statements), false);
});

Deno.test("hasStanceDrifted - flipping on half the snapshot statements is drift", () => {
  const statements = [
    statement("s1", [[groupA, "disagree"]]),
    statement("s2", [[groupA, "disagree"]]),
  ];
  const snapshot = [
    { statementId: "s1", agreeRate: 0.9 },
    { statementId: "s2", agreeRate: 0.1 },
  ];

  assertEquals(hasStanceDrifted(snapshot, groupA, statements), true);
});

Deno.test("hasStanceDrifted - small moves within the threshold are not drift", () => {
  const statements = [
    statement("s1", [[groupA.slice(0, 22), "agree"], [groupA.slice(22), "disagree"]]),
  ];

  assertEquals(hasStanceDrifted([{ statementId: "s1", agreeRate: 0.9 }], groupA, statements), false);
});

Deno.test("hasStanceDrifted - missing statements count as drifted", () => {
  const snapshot = [
    { statementId: "gone1", agreeRate: 0.9 },
    { statementId: "gone2", agreeRate: 0.9 },
  ];
  assertEquals(hasStanceDrifted(snapshot, groupA, []), true);
});

Deno.test("makeClusterNamingPrompt - lists groups by letter with taken names and common ground", () => {
  const input: ClusterNamingInput = {
    stableId: "x",
    size: 12,
    statements: [{ id: "s", text: "Build more bike lanes", direction: "agrees", agreeRate: 0.9 }],
  };

  const prompt = makeClusterNamingPrompt("Transit", [input], ["Hit the Brakes"], ["Safety matters"]);

  assertEquals(prompt.userPrompt.includes(`Group A (12 people):`), true);
  assertEquals(prompt.userPrompt.includes(`agrees much more than others: "Build more bike lanes"`), true);
  assertEquals(prompt.userPrompt.includes("- Hit the Brakes"), true);
  assertEquals(prompt.userPrompt.includes(`"Safety matters"`), true);
});

Deno.test("parseClusterNamingResponse - maps groups back in order and strips fences", () => {
  const raw = '```json\n{"names": [{"group": "B", "name": "Hit the Brakes"}, {"group": "A", "name": "Full Speed Ahead"}]}\n```';
  assertEquals(parseClusterNamingResponse(raw, 2, []), {
    ok: true,
    value: ["Full Speed Ahead", "Hit the Brakes"],
  });
});

Deno.test("parseClusterNamingResponse - rejects missing groups, duplicates and taken names", () => {
  assertEquals(parseClusterNamingResponse('{"names": [{"group": "A", "name": "Go Go Go"}]}', 2, []).ok, false);
  assertEquals(
    parseClusterNamingResponse('{"names": [{"group": "A", "name": "Go Go"}, {"group": "B", "name": "go go"}]}', 2, []).ok,
    false,
  );
  assertEquals(parseClusterNamingResponse('{"names": [{"group": "A", "name": "Hit the Brakes"}]}', 1, ["Hit the Brakes"]).ok, false);
  assertEquals(parseClusterNamingResponse("not json", 1, []).ok, false);
});

Deno.test("parseClusterRenameResponse - keep, valid rename, and rejected renames", () => {
  assertEquals(parseClusterRenameResponse('{"decision": "keep"}', []), { ok: true, value: { decision: "keep" } });
  assertEquals(
    parseClusterRenameResponse('{"decision": "rename", "reason": "Now opposes new lanes", "name": "Hold the Line"}', []),
    { ok: true, value: { decision: "rename", name: "Hold the Line", reason: "Now opposes new lanes" } },
  );
  assertEquals(parseClusterRenameResponse('{"decision": "rename", "name": "Hold the Line"}', []).ok, false);
  assertEquals(
    parseClusterRenameResponse('{"decision": "rename", "reason": "x", "name": "Hold the Line"}', ["hold the line"]).ok,
    false,
  );
  assertEquals(parseClusterRenameResponse('{"decision": "maybe"}', []).ok, false);
});
