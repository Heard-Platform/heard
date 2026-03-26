import { describe, it } from "jsr:@std/testing/bdd";
import { assert } from "https://deno.land/std@0.208.0/assert/assert.ts";
import { assertGreater } from "https://deno.land/std@0.208.0/assert/assert_greater.ts";
import { OpenAiClient } from "./openai-client.ts";
import { AnthropicClient } from "./anthropic-client.ts";
import { GeminiClient } from "./gemini-client.ts";
import { LlmClient } from "./llm-client.ts";
import { makeRantExtractionPrompt, stripMarkdownFences } from "./rant-prompt-utils.ts";

const testRants = [
  {
    label: "public transit",
    text: "I am so sick of our city's public transit system. The buses are always late, the trains break down constantly, and they just raised fares AGAIN. Meanwhile they're spending millions on a new stadium nobody asked for. We need to invest in infrastructure that actually helps working people get to their jobs on time. Other cities have figured this out, why can't we?",
  },
  {
    label: "remote work",
    text: "My company just announced everyone has to come back to the office 5 days a week starting next month. This is ridiculous. I've been more productive at home for the last three years, my team hits every deadline, and now they want me to waste 2 hours a day commuting just so some middle manager can watch me sit at a desk. The whole return-to-office push is about control, not productivity.",
  },
  {
    label: "tipping culture",
    text: "Why does every single place ask for a tip now? I ordered a coffee at a counter, nobody brought it to me, nobody checked on me, and the tablet flips around asking for 20%. Tipping used to be for sit-down service. Now it's guilt-tripping at every checkout. Employers should just pay their workers properly instead of making customers subsidize wages on top of already high prices.",
  },
];

function assertValidRantExtraction(response: string, label: string) {
  let parsed: { topic: string; statements: string[] };
  try {
    parsed = JSON.parse(stripMarkdownFences(response));
  } catch {
    throw new Error(`[${label}] Response is not valid JSON:\n${response}`);
  }

  assert(
    typeof parsed.topic === "string" && parsed.topic.length > 0,
    `[${label}] topic must be a non-empty string`,
  );
  assert(
    Array.isArray(parsed.statements),
    `[${label}] statements must be an array`,
  );
  assertGreater(
    parsed.statements.length,
    1,
    `[${label}] Expected at least 2 statements, got ${parsed.statements.length}`,
  );
  for (const stmt of parsed.statements) {
    assert(
      typeof stmt === "string" && stmt.length > 0,
      `[${label}] Each statement must be a non-empty string`,
    );
  }
}

async function runRantTest(client: LlmClient, providerName: string) {
  for (const rant of testRants) {
    const prompt = makeRantExtractionPrompt(rant.text);
    const response = await client.completeJson(prompt);
    console.log(`\n=== ${providerName} - ${rant.label} ===`);
    console.log(`Rant: ${rant.text}`);
    console.log(`Result: ${response}`);
    assertValidRantExtraction(response, `${providerName}/${rant.label}`);
  }
}

if (false) {
  describe("Rant extraction - OpenAI", () => {
    it("extracts valid topics and statements from rants", async () => {
      await runRantTest(new OpenAiClient(), "OpenAI");
    });
  });

  describe("Rant extraction - Anthropic", () => {
    it("extracts valid topics and statements from rants", async () => {
      await runRantTest(new AnthropicClient(), "Anthropic");
    });
  });

  describe("Rant extraction - Gemini", () => {
    it("extracts valid topics and statements from rants", async () => {
      await runRantTest(new GeminiClient(), "Gemini");
    });
  });
}
