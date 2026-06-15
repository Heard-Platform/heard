import process from "node:process";
import { describe, it } from "jsr:@std/testing/bdd";
import { assert } from "https://deno.land/std@0.208.0/assert/assert.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/assert_equals.ts";
import { assertGreater } from "https://deno.land/std@0.208.0/assert/assert_greater.ts";
import {
  LLM_ERROR_SENTINEL,
  makeGGWashSelectionPrompt,
  makeTransformPromptFromGGWashArticle,
  parseSelectionResponse,
} from "./ggwash-prompt-utils.ts";
import { extractFirstImageUrl, isRoundupTitle } from "./ggwash-scraper-utils.ts";
import { parseTransform } from "./ggwash-import-service.ts";
import { GGWashArticle } from "./types.tsx";
import { LlmProvider } from "./llm-provider.ts";
import { getRandomPersona } from "./personas.tsx";

process.env.NODE_ENV = "test";

const sampleArticles: GGWashArticle[] = [
  {
    title: "Waymo's robotaxis are coming to DC streets",
    body:
      "Driverless cars from Waymo will begin operating in the District next year, raising questions about safety, jobs, and curb space in DC neighborhoods.",
    url: "https://ggwash.org/view/1/waymo-dc",
    guid: "https://ggwash.org/view/1/waymo-dc",
    imageUrl: "https://ggwash.org/images/made/waymo.jpg",
    publishedAt: 1781000000000,
  },
  {
    title: "Introducing Jewel Lester, GGWash's Maryland Policy Intern",
    body:
      "We are excited to welcome Jewel Lester to the team as our new Maryland policy intern for the summer.",
    url: "https://ggwash.org/view/2/intro-intern",
    guid: "https://ggwash.org/view/2/intro-intern",
    publishedAt: 1781000001000,
  },
];

describe("GGWash selection prompt", () => {
  it("numbers articles 0-based with title and snippet", () => {
    const { userPrompt } = makeGGWashSelectionPrompt(sampleArticles);
    assert(userPrompt.includes("0. " + sampleArticles[0].title));
    assert(userPrompt.includes("1. " + sampleArticles[1].title));
    assert(userPrompt.includes("Waymo will begin operating"));
  });

  it("instructs JSON output and DC-only / benign exclusions", () => {
    const { userPrompt } = makeGGWashSelectionPrompt(sampleArticles);
    assert(userPrompt.includes('{"ranked":'));
    assert(userPrompt.includes("District of Columbia"));
    assert(/Virginia/i.test(userPrompt) && /Maryland/i.test(userPrompt));
    assert(/Breakfast links/i.test(userPrompt));
  });
});

describe("parseSelectionResponse", () => {
  it("parses a clean object", () => {
    assertEquals(parseSelectionResponse('{"ranked":[2,0,1]}', 3), [2, 0, 1]);
  });
  it("strips markdown fences", () => {
    assertEquals(
      parseSelectionResponse('```json\n{"ranked":[1]}\n```', 3),
      [1],
    );
  });
  it("clamps out-of-range and dedupes", () => {
    assertEquals(parseSelectionResponse('{"ranked":[5,1,1,-1,0]}', 3), [1, 0]);
  });
  it("returns [] for malformed JSON", () => {
    assertEquals(parseSelectionResponse("not json at all", 3), []);
  });
  it("returns [] when ranked is missing or not an array", () => {
    assertEquals(parseSelectionResponse('{"foo":1}', 3), []);
    assertEquals(parseSelectionResponse('{"ranked":"nope"}', 3), []);
    assertEquals(parseSelectionResponse('{"ranked":[]}', 3), []);
  });
});

describe("GGWash transform prompt", () => {
  it("includes the article and allows direct/timely framings", () => {
    const persona = getRandomPersona();
    const prompt = makeTransformPromptFromGGWashArticle(
      sampleArticles[0],
      "gemini",
      persona,
    );
    assert(prompt.userPrompt.includes(sampleArticles[0].title));
    assert(prompt.userPrompt.includes(sampleArticles[0].body));
    assert(prompt.userPrompt.includes("does NOT need to be evergreen"));
  });

  it("adds critical reminders for gemini and anthropic only", () => {
    const persona = getRandomPersona();
    const providers: LlmProvider[] = ["openai", "anthropic", "gemini"];
    for (const provider of providers) {
      const prompt = makeTransformPromptFromGGWashArticle(
        sampleArticles[0],
        provider,
        persona,
      );
      const hasReminders = prompt.userPrompt.includes("CRITICAL REMINDERS");
      assertEquals(hasReminders, provider !== "openai");
    }
  });
});

describe("parseTransform", () => {
  it("parses a topic plus 3 statements", () => {
    const parsed = parseTransform(
      "What do you make of robotaxis in DC?\nThey will make streets safer\nThey will kill driving jobs\nI dont trust the technology yet",
    );
    assert(parsed !== null);
    assertEquals(parsed!.topic, "What do you make of robotaxis in DC?");
    assertEquals(parsed!.statements.length, 3);
  });
  it("rejects the Error sentinel", () => {
    assertEquals(parseTransform(LLM_ERROR_SENTINEL), null);
  });
  it("rejects an empty topic or wrong statement count", () => {
    assertEquals(parseTransform("Just a topic with no responses"), null);
    assertEquals(
      parseTransform("Topic\nonly one statement that is too few"),
      null,
    );
  });
  it("forces a single ? on the topic and strips trailing punctuation from responses", () => {
    const parsed = parseTransform(
      "What about DC bikes\nGreat for quick trips!\nToo many on sidewalks.\nNot safe enough yet",
    );
    assert(parsed !== null);
    assertEquals(parsed!.topic, "What about DC bikes?");
    assertEquals(parsed!.statements, [
      "Great for quick trips",
      "Too many on sidewalks",
      "Not safe enough yet",
    ]);
  });
  it("does not double the question mark when the topic already ends with one", () => {
    assertEquals(parseTransform("Is DC ready?\na\nb")!.topic, "Is DC ready?");
  });
});

describe("isRoundupTitle", () => {
  it("matches the Breakfast links prefix case-insensitively", () => {
    assertEquals(isRoundupTitle("Breakfast links: DC Council moves on budget"), true);
    assertEquals(isRoundupTitle("  breakfast LINKS: whatever"), true);
  });
  it("does not match normal articles", () => {
    assertEquals(isRoundupTitle("Ward 7 deserves a better Pennsylvania Avenue"), false);
  });
});

describe("extractFirstImageUrl", () => {
  it("pulls the first absolute img src", () => {
    assertEquals(
      extractFirstImageUrl(
        '<figure><img src="https://ggwash.org/images/made/a.jpg" /></figure><p>x</p>',
      ),
      "https://ggwash.org/images/made/a.jpg",
    );
  });
  it("returns undefined when there is no usable image", () => {
    assertEquals(extractFirstImageUrl("<p>no image here</p>"), undefined);
    assertEquals(extractFirstImageUrl('<img src="/relative/path.jpg" />'), undefined);
  });
  it("encodes spaces in the image url", () => {
    assertEquals(
      extractFirstImageUrl('<img src="https://ggwash.org/a b 800.png" />'),
      "https://ggwash.org/a%20b%20800.png",
    );
  });
});

// Networked checks against the live feed + LLM. Gated so the default test run
// stays offline and free. Enable with RUN_GGWASH_LLM_TESTS=1.
if (process.env.RUN_GGWASH_LLM_TESTS === "1") {
  describe("GGWash end-to-end (live feed + LLM)", () => {
    it("fetches, selects, and transforms", async () => {
      const { fetchGGWashArticles } = await import("./ggwash-scraper-utils.ts");
      const { createLlmClient } = await import("./llm-provider.ts");
      const articles = await fetchGGWashArticles();
      assertGreater(articles.length, 0, "expected at least one article");

      const client = createLlmClient();
      const ranked = parseSelectionResponse(
        await client.completeJson(makeGGWashSelectionPrompt(articles), {
          endpoint: "test:ggwash-select",
        }),
        articles.length,
      );
      console.log("\n=== ranked indices ===\n", ranked);

      if (ranked.length > 0) {
        const response = await client.complete(
          makeTransformPromptFromGGWashArticle(articles[ranked[0]], "gemini"),
          { endpoint: "test:ggwash-transform" },
        );
        console.log("\n=== transform ===\n" + response);
      }
    });
  });
}
