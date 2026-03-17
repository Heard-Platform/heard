import { describe, it } from "jsr:@std/testing/bdd";
import { ONE_HOUR_MIN } from "./time-utils.ts";
import { getRedditPosts } from "./reddit-scraper-utils.ts";
import { assertLessOrEqual } from "https://deno.land/std@0.208.0/assert/assert_less_or_equal.ts";
import { makeTransformPromptFromRedditPost } from "./ai-prompt-utils.ts";
import { assertGreater } from "https://deno.land/std@0.208.0/assert/assert_greater.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/assert_equals.ts";
import { assert } from "https://deno.land/std@0.208.0/assert/assert.ts";
import { LlmProvider } from "./llm-provider.ts";
import { getRandomSubreddit } from "./reddit-import-service.ts";
import { OpenAiClient } from "./openai-client.ts";
import { AnthropicClient } from "./anthropic-client.ts";
import { GeminiClient } from "./gemini-client.ts";

const testCriteria = {
  subredditName: getRandomSubreddit(),
  maxPostAgeMins: 20 * ONE_HOUR_MIN,
  postLimit: 100,
};

const testPosts = [
  {
    subredditDescription:
      "r/AskReddit is the place to ask and answer thought-provoking questions.",
    title:
      "If you could fix just one government policy overnight, what would it be?",
    selfText: "",
    pubDate: "2026-02-19T23:36:59.000Z",
    subreddit: "askreddit",
  },
  {
    subredditDescription:
      "r/AskReddit is the place to ask and answer thought-provoking questions.",
    title:
      "What's the biggest red flag of toxicity in your type of workplace culture?",
    selfText: "",
    pubDate: "2026-02-19T23:35:01.000Z",
    subreddit: "askreddit",
  },
  {
    subredditDescription:
      "r/AskReddit is the place to ask and answer thought-provoking questions.",
    title:
      "What's something you spend on that other people wouldn't understand?",
    selfText: "",
    pubDate: "2026-02-19T23:34:18.000Z",
    subreddit: "askreddit",
  },
];

function assertValidResponse(response: string) {
  const trimmed = response.trim();
  if (trimmed === "Error") return;

  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
  assertGreater(lines.length, 0, "Response must have at least a topic line");

  const responseCount = lines.length - 1;
  assert(
    responseCount >= 2 && responseCount <= 3,
    `Expected 2-3 response statements, got ${responseCount}`,
  );
}

if (true) {
  describe("Prompt construction", () => {
    it("includes post data in prompt for all providers", () => {
      const providers: LlmProvider[] = ["openai", "anthropic", "gemini"];
      for (const provider of providers) {
        const prompt = makeTransformPromptFromRedditPost(testPosts[0], provider);
        assert(
          prompt.userPrompt.includes(testPosts[0].title),
          `${provider} prompt should include post title`,
        );
        assert(
          prompt.userPrompt.includes(testPosts[0].subredditDescription),
          `${provider} prompt should include subreddit description`,
        );
        assertGreater(prompt.systemPrompt.length, 0);
      }
    });

    it("adds extra instructions for gemini only", () => {
      const geminiPrompt = makeTransformPromptFromRedditPost(testPosts[0], "gemini");
      const openaiPrompt = makeTransformPromptFromRedditPost(testPosts[0], "openai");
      const anthropicPrompt = makeTransformPromptFromRedditPost(testPosts[0], "anthropic");

      assert(
        geminiPrompt.userPrompt.includes("CRITICAL REMINDERS"),
        "Gemini prompt should include critical reminders section",
      );
      assertEquals(
        openaiPrompt.userPrompt.includes("CRITICAL REMINDERS"),
        false,
        "OpenAI prompt should not include critical reminders section",
      );
      assertEquals(
        anthropicPrompt.userPrompt.includes("CRITICAL REMINDERS"),
        false,
        "Anthropic prompt should not include critical reminders section",
      );
    });
  });

  describe("Reddit scraper", () => {
    it("obeys post limit", async () => {
      const posts = await getRedditPosts(testCriteria);
      assertLessOrEqual(posts.length, testCriteria.postLimit);
    });
  });

  describe("OpenAI completion", () => {
    it("returns a valid response", async () => {
      const client = new OpenAiClient();
      const prompt = makeTransformPromptFromRedditPost(testPosts[0], "openai");
      const response = await client.complete(prompt);
      console.log("\n=== OpenAI ===\n" + response);
      assertValidResponse(response);
    });
  });

  describe("Anthropic completion", () => {
    it("returns a valid response", async () => {
      const client = new AnthropicClient();
      const prompt = makeTransformPromptFromRedditPost(testPosts[0], "anthropic");
      const response = await client.complete(prompt);
      console.log("\n=== Anthropic ===\n" + response);
      assertValidResponse(response);
    });
  });

  describe("Gemini completion", () => {
    it("returns a valid response", async () => {
      const client = new GeminiClient();
      const prompt = makeTransformPromptFromRedditPost(testPosts[0], "gemini");
      const response = await client.complete(prompt);
      console.log("\n=== Gemini ===\n" + response);
      assertValidResponse(response);
    });
  });

  describe("Reddit import end-to-end", () => {
    it("scrapes a post and transforms it", async () => {
      const posts = await getRedditPosts(testCriteria);
      assertGreater(posts.length, 0, "Should find at least one post");
      const randomIndex = Math.floor(Math.random() * posts.length);
      const prompt = makeTransformPromptFromRedditPost(posts[randomIndex], "gemini");
      const client = new OpenAiClient();
      const response = await client.complete(prompt);
      console.log("\n=== End-to-end ===\n" + response);
      assertValidResponse(response);
    });
  });

}
