import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { assertGreater } from "https://deno.land/std@0.224.0/assert/assert_greater.ts";
import { assertLess } from "https://deno.land/std@0.224.0/assert/assert_less.ts";
import { calcDistinguishingScore, calcDistinguishingStatements } from "./cluster-analysis.tsx";
import { Statement, VoteType } from "./types.tsx";

function makeStatement(id: string, voters: Record<string, VoteType>): Statement {
  const counts = { agree: 0, super_agree: 0, disagree: 0, pass: 0 };
  for (const v of Object.values(voters)) counts[v]++;
  return {
    id,
    text: `text-${id}`,
    author: "author",
    agrees: counts.agree,
    disagrees: counts.disagree,
    passes: counts.pass,
    superAgrees: counts.super_agree,
    roomId: "room1",
    timestamp: 0,
    round: 1,
    voters,
  };
}

Deno.test("calcDistinguishingScore - returns 0 when either group has no opinionated votes", () => {
  assertEquals(
    calcDistinguishingScore({ agrees: 0, disagrees: 0, passes: 0 }, { agrees: 10, disagrees: 10, passes: 0 }),
    0,
  );
  assertEquals(
    calcDistinguishingScore({ agrees: 10, disagrees: 10, passes: 0 }, { agrees: 0, disagrees: 0, passes: 0 }),
    0,
  );
});

Deno.test("calcDistinguishingScore - returns 0 when pooled proportion is 0 or 1", () => {
  assertEquals(
    calcDistinguishingScore({ agrees: 0, disagrees: 5, passes: 0 }, { agrees: 0, disagrees: 5, passes: 0 }),
    0,
  );
  assertEquals(
    calcDistinguishingScore({ agrees: 5, disagrees: 0, passes: 0 }, { agrees: 5, disagrees: 0, passes: 0 }),
    0,
  );
});

Deno.test("calcDistinguishingScore - positive when in-cluster agrees more than out-cluster", () => {
  const z = calcDistinguishingScore(
    { agrees: 50, disagrees: 5, passes: 0 },
    { agrees: 5, disagrees: 50, passes: 0 },
  );
  assertGreater(z, 0);
});

Deno.test("calcDistinguishingScore - negative when in-cluster disagrees more than out-cluster", () => {
  const z = calcDistinguishingScore(
    { agrees: 5, disagrees: 50, passes: 0 },
    { agrees: 50, disagrees: 5, passes: 0 },
  );
  assertLess(z, 0);
});

Deno.test(
  "calcDistinguishingScore - same proportional gap scores higher with larger samples",
  () => {
    const small = calcDistinguishingScore(
      { agrees: 8, disagrees: 2, passes: 0 },
      { agrees: 2, disagrees: 8, passes: 0 },
    );

    const large = calcDistinguishingScore(
      { agrees: 80, disagrees: 20, passes: 0 },
      { agrees: 20, disagrees: 80, passes: 0 },
    );
    assertGreater(large, small);
  },
);

Deno.test("calcDistinguishingStatements - ranks distinguishing statements higher even with fewer votes", () => {
  const commonStatementScore = calcDistinguishingScore(
    { agrees: 90, disagrees: 10, passes: 0 },
    { agrees: 170, disagrees: 30, passes: 0 },
  );
  const distinctStatementScore = calcDistinguishingScore(
    { agrees: 60, disagrees: 10, passes: 0 },
    { agrees: 30, disagrees: 140, passes: 0 },
  );

  assertGreater(distinctStatementScore, commonStatementScore);
});

Deno.test("calcDistinguishingStatements - filters out statements below z threshold", () => {
  const inUsers = ["a", "b", "c"];
  const outUsers = ["x", "y", "z"];
  const noisyStatement = makeStatement("noisy", {
    a: "agree",
    b: "agree",
    c: "disagree",
    x: "disagree",
    y: "disagree",
    z: "disagree",
  });
  const result = calcDistinguishingStatements([noisyStatement], inUsers, outUsers);
  assertEquals(result.length, 0);
});

Deno.test("calcDistinguishingStatements - keeps statements above z threshold", () => {
  const inUsers = Array.from({ length: 50 }, (_, i) => `in${i}`);
  const outUsers = Array.from({ length: 50 }, (_, i) => `out${i}`);
  const voters: Record<string, VoteType> = {};
  for (const u of inUsers) voters[u] = "agree";
  for (const u of outUsers) voters[u] = "disagree";
  const statement = makeStatement("strong", voters);
  const result = calcDistinguishingStatements([statement], inUsers, outUsers);
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "strong");
  assertGreater(result[0].distinguishingScore, 0);
});

Deno.test("calcDistinguishingStatements - sorts by absolute score, picks both directions", () => {
  const inUsers = Array.from({ length: 40 }, (_, i) => `in${i}`);
  const outUsers = Array.from({ length: 40 }, (_, i) => `out${i}`);

  const inAgreesStmt: Record<string, VoteType> = {};
  for (const u of inUsers) inAgreesStmt[u] = "agree";
  for (const u of outUsers) inAgreesStmt[u] = "disagree";

  const inDisagreesStmt: Record<string, VoteType> = {};
  for (const u of inUsers) inDisagreesStmt[u] = "disagree";
  for (const u of outUsers) inDisagreesStmt[u] = "agree";

  const result = calcDistinguishingStatements(
    [makeStatement("agrees", inAgreesStmt), makeStatement("disagrees", inDisagreesStmt)],
    inUsers,
    outUsers,
  );

  assertEquals(result.length, 2);
  assertGreater(result[0].distinguishingScore, 0);
  assertLess(result[1].distinguishingScore, 0);
  assertEquals(Math.abs(result[0].distinguishingScore), Math.abs(result[1].distinguishingScore));
});

Deno.test("calcDistinguishingStatements - super_agree counts as agree", () => {
  const inUsers = Array.from({ length: 30 }, (_, i) => `in${i}`);
  const outUsers = Array.from({ length: 30 }, (_, i) => `out${i}`);
  const voters: Record<string, VoteType> = {};
  for (const u of inUsers) voters[u] = "super_agree";
  for (const u of outUsers) voters[u] = "disagree";
  const result = calcDistinguishingStatements([makeStatement("s", voters)], inUsers, outUsers);
  assertEquals(result.length, 1);
  assertEquals(result[0].agreeVotes, 30);
  assertEquals(result[0].disagreeVotes, 0);
});

Deno.test("calcDistinguishingStatements - pass votes don't affect score but count toward totalVotes", () => {
  const inUsers = Array.from({ length: 50 }, (_, i) => `in${i}`);
  const outUsers = Array.from({ length: 50 }, (_, i) => `out${i}`);
  const voters: Record<string, VoteType> = {};
  for (let i = 0; i < 30; i++) voters[`in${i}`] = "agree";
  for (let i = 30; i < 50; i++) voters[`in${i}`] = "pass";
  for (const u of outUsers) voters[u] = "disagree";
  const result = calcDistinguishingStatements([makeStatement("s", voters)], inUsers, outUsers);
  assertEquals(result.length, 1);
  assertEquals(result[0].agreeVotes, 30);
  assertEquals(result[0].disagreeVotes, 0);
  assertEquals(result[0].totalVotes, 50);
});

Deno.test("calcDistinguishingStatements - tie-breaks by total in-cluster votes", () => {
  const inUsers = Array.from({ length: 60 }, (_, i) => `in${i}`);
  const outUsers = Array.from({ length: 60 }, (_, i) => `out${i}`);

  const fewerVotes: Record<string, VoteType> = {};
  for (let i = 0; i < 30; i++) fewerVotes[`in${i}`] = "agree";
  for (let i = 0; i < 30; i++) fewerVotes[`out${i}`] = "disagree";

  const moreVotes: Record<string, VoteType> = {};
  for (let i = 0; i < 60; i++) moreVotes[`in${i}`] = "agree";
  for (let i = 0; i < 60; i++) moreVotes[`out${i}`] = "disagree";

  const result = calcDistinguishingStatements(
    [makeStatement("fewer", fewerVotes), makeStatement("more", moreVotes)],
    inUsers,
    outUsers,
  );

  assertEquals(result[0].id, "more");
  assertEquals(result[1].id, "fewer");
});
