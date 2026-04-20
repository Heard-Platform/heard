import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { grade, makeLlmGraderPrompt } from "./llm-grader.ts";
import type { LlmClient } from "./llm-client.ts";

function mockClient(responses: string[]): LlmClient {
  let i = 0;
  return {
    complete: () => Promise.resolve(responses[i++] ?? ""),
    completeJson: () => Promise.resolve(responses[i++] ?? ""),
  };
}

const VALID = JSON.stringify({ score: 85, reasoning: "Close match." });

// --- makeLlmGraderPrompt ---

Deno.test("makeLlmGraderPrompt embeds expected and actual in user prompt", () => {
  const { userPrompt } = makeLlmGraderPrompt({ expected: "apple", actual: "orange" });
  assertStringIncludes(userPrompt, "apple");
  assertStringIncludes(userPrompt, "orange");
});

Deno.test("makeLlmGraderPrompt includes context when provided", () => {
  const { userPrompt } = makeLlmGraderPrompt({ expected: "a", actual: "b", context: "fruit comparison" });
  assertStringIncludes(userPrompt, "fruit comparison");
});

Deno.test("makeLlmGraderPrompt omits context label when not provided", () => {
  const { userPrompt } = makeLlmGraderPrompt({ expected: "a", actual: "b" });
  assertEquals(userPrompt.includes("Context:"), false);
});

// --- grade ---

Deno.test("grade parses valid response into score and reasoning", async () => {
  const result = await grade({ expected: "a", actual: "b" }, mockClient([VALID]));
  assertEquals(result.score, 85);
  assertEquals(result.reasoning, "Close match.");
});

Deno.test("grade rounds float score to nearest integer", async () => {
  const response = JSON.stringify({ score: 84.6, reasoning: "." });
  const result = await grade({ expected: "a", actual: "b" }, mockClient([response]));
  assertEquals(result.score, 85);
});

Deno.test("grade clamps score to 0-100 range", async () => {
  const over = await grade({ expected: "a", actual: "b" }, mockClient([JSON.stringify({ score: 120, reasoning: "." })]));
  const under = await grade({ expected: "a", actual: "b" }, mockClient([JSON.stringify({ score: -5, reasoning: "." })]));
  assertEquals(over.score, 100);
  assertEquals(under.score, 0);
});

Deno.test("grade retries once on parse failure and returns second response", async () => {
  const result = await grade({ expected: "a", actual: "b" }, mockClient(["not json", VALID]));
  assertEquals(result.score, 85);
});

Deno.test("grade throws after two consecutive parse failures", async () => {
  await assertRejects(
    () => grade({ expected: "a", actual: "b" }, mockClient(["bad", "also bad"])),
    Error,
    "failed to parse",
  );
});

Deno.test("grade handles JSON wrapped in markdown fences", async () => {
  const fenced = "```json\n" + VALID + "\n```";
  const result = await grade({ expected: "a", actual: "b" }, mockClient([fenced]));
  assertEquals(result.score, 85);
});

Deno.test("grade throws on malformed response shape", async () => {
  const missingReasoning = JSON.stringify({ score: 75 });
  await assertRejects(
    () => grade({ expected: "a", actual: "b" }, mockClient([missingReasoning, missingReasoning])),
    Error,
    "unexpected response shape",
  );
});
