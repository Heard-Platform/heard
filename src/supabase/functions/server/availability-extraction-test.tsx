import process from "node:process";
import { describe, it } from "@std/testing/bdd";
import { assert } from "https://deno.land/std@0.208.0/assert/assert.ts";
import { OpenAiClient } from "./openai-client.ts";
import { AnthropicClient } from "./anthropic-client.ts";
import { GeminiClient } from "./gemini-client.ts";
import { LlmClient } from "./llm-client.ts";
import {
  AVAILABILITY_VALUES,
  AvailabilityExtraction,
  CONFIDENCE_VALUES,
  makeAvailabilityExtractionPrompt,
  parseAvailabilityExtraction,
} from "./availability-prompt-utils.ts";

const REFERENCE_DATE = "2026-04-20";
const RUN_LLM_TESTS = process.env.RUN_AVAILABILITY_LLM_TESTS === "1";
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

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

function assertValidAvailabilityExtraction(response: string, label: string): AvailabilityExtraction {
  let parsed: AvailabilityExtraction;
  try {
    parsed = parseAvailabilityExtraction(response);
  } catch {
    throw new Error(`[${label}] Response is not valid JSON:\n${response}`);
  }
  assert(Array.isArray(parsed.resolved), `[${label}] resolved must be an array`);
  assert(Array.isArray(parsed.ambiguous), `[${label}] ambiguous must be an array`);
  assert(
    typeof parsed.referenceDate === "string" && ISO_DATE_REGEX.test(parsed.referenceDate),
    `[${label}] referenceDate must be YYYY-MM-DD, got "${parsed.referenceDate}"`,
  );
  for (const r of parsed.resolved) {
    assert(ISO_DATE_REGEX.test(r.date), `[${label}] resolved.date must be YYYY-MM-DD, got "${r.date}"`);
    assert(
      (AVAILABILITY_VALUES as readonly string[]).includes(r.availability),
      `[${label}] resolved.availability invalid: "${r.availability}"`,
    );
    assert(
      (CONFIDENCE_VALUES as readonly string[]).includes(r.confidence),
      `[${label}] resolved.confidence invalid: "${r.confidence}"`,
    );
    assert(
      typeof r.sourceQuote === "string" && r.sourceQuote.length > 0,
      `[${label}] resolved.sourceQuote required`,
    );
    if (r.timeRange) {
      assert(
        TIME_REGEX.test(r.timeRange.start) && TIME_REGEX.test(r.timeRange.end),
        `[${label}] timeRange must use HH:mm, got ${JSON.stringify(r.timeRange)}`,
      );
    }
  }
  for (const a of parsed.ambiguous) {
    assert(typeof a.mention === "string" && a.mention.length > 0, `[${label}] ambiguous.mention required`);
    assert(typeof a.reason === "string" && a.reason.length > 0, `[${label}] ambiguous.reason required`);
    assert(
      typeof a.sourceQuote === "string" && a.sourceQuote.length > 0,
      `[${label}] ambiguous.sourceQuote required`,
    );
  }
  return parsed;
}

async function runAvailabilityTest(client: LlmClient, providerName: string) {
  for (const rant of testRants) {
    const prompt = makeAvailabilityExtractionPrompt(rant.text, REFERENCE_DATE);
    const response = await client.completeJson(prompt);
    console.log(`\n=== ${providerName} - ${rant.label} ===`);
    console.log(`Rant: ${rant.text}`);
    console.log(`Result: ${response}`);
    assertValidAvailabilityExtraction(response, `${providerName}/${rant.label}`);
  }
}

if (RUN_LLM_TESTS) {
  describe("Availability extraction - Gemini", () => {
    it("extracts structured availability from scheduling rants", async () => {
      await runAvailabilityTest(new GeminiClient(), "Gemini");
    });
  });

  describe("Availability extraction - Anthropic", () => {
    it("extracts structured availability from scheduling rants", async () => {
      await runAvailabilityTest(new AnthropicClient(), "Anthropic");
    });
  });

  describe("Availability extraction - OpenAI", () => {
    it("extracts structured availability from scheduling rants", async () => {
      await runAvailabilityTest(new OpenAiClient(), "OpenAI");
    });
  });
}
