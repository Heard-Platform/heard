import process from "node:process";
import { describe, it } from "@std/testing/bdd";
import { OpenAiClient } from "./openai-client.ts";
import { AnthropicClient } from "./anthropic-client.ts";
import { GeminiClient } from "./gemini-client.ts";
import { LlmClient } from "./llm-client.ts";
import {
  makeAvailabilityExtractionPrompt,
  parseAvailabilityExtraction,
} from "./availability-prompt-utils.ts";

const REFERENCE_DATE = "2026-04-20";
const RUN_LLM_TESTS = process.env.RUN_AVAILABILITY_LLM_TESTS === "1";

const testRants = [
  {
    label: "specific dates with times",
    text:
      "I can do Saturday the 25th from 2 to 5pm, or Sunday the 26th any time after noon. Nothing earlier in the day Saturday because of my kid's soccer game.",
  },
  {
    label: "relative dates",
    text:
      "This Thursday is out, I have a work thing. Next Wednesday evening works though, say after 7pm. Friday of this week is tentative, depends on whether I can reschedule something.",
  },
  {
    label: "vague ranges",
    text:
      "Honestly I'm free most of next week, just not Monday. Weekends are always better for me than weekdays.",
  },
  {
    label: "unresolvable",
    text:
      "Sometime next month, probably. I'll need to check my calendar. Maybe the weekend after that other thing we talked about.",
  },
  {
    label: "negative only",
    text:
      "I absolutely cannot do Tuesdays or Wednesdays this month. Also no Friday mornings. Anything else is probably fine.",
  },
  {
    label: "mixed specific and vague",
    text:
      "April 30th would be perfect, I'm totally free that day. The first week of May is mostly booked but I might have something open Thursday morning. After that it gets fuzzy.",
  },
  {
    label: "no availability info",
    text:
      "I don't really care when we meet. Whatever works for everyone else works for me.",
  },
];

const providers: Array<{ name: string; make: () => LlmClient }> = [
  { name: "Gemini", make: () => new GeminiClient() },
  { name: "Anthropic", make: () => new AnthropicClient() },
  { name: "OpenAI", make: () => new OpenAiClient() },
];

async function runAvailabilityTest(client: LlmClient, providerName: string) {
  for (const rant of testRants) {
    const prompt = makeAvailabilityExtractionPrompt(rant.text, REFERENCE_DATE);
    const response = await client.completeJson(prompt);
    console.log(`\n=== ${providerName} - ${rant.label} ===`);
    console.log(`Rant: ${rant.text}`);
    console.log(`Result: ${response}`);
    parseAvailabilityExtraction(response, `${providerName}/${rant.label}`);
  }
}

if (RUN_LLM_TESTS) {
  for (const { name, make } of providers) {
    describe(`Availability extraction - ${name}`, () => {
      it("extracts structured availability from scheduling rants", async () => {
        await runAvailabilityTest(make(), name);
      });
    });
  }
}
