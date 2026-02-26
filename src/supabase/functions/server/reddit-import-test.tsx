import { describe, it } from "jsr:@std/testing/bdd";
import {
  AiPrompt,
  RedditPost,
  RedditScrapeCriteria,
} from "./types.tsx";
import { ONE_HOUR_MIN } from "./time-utils.ts";
import { getRedditPosts } from "./reddit-scraper-utils.ts";
import { assertLessOrEqual } from "https://deno.land/std@0.208.0/assert/assert_less_or_equal.ts";
import { makeTransformPromptFromRedditPost } from "./ai-prompt-utils.ts";
import { assertGreater } from "https://deno.land/std@0.208.0/assert/assert_greater.ts";
import { OpenAiClient } from "./openai-client.ts";
import { getRandomSubreddit } from "./reddit-import-service.ts";

const testCriteria = {
  subredditName: getRandomSubreddit(),
  maxPostAgeMins: 10 * ONE_HOUR_MIN,
  postLimit: 100,
} as RedditScrapeCriteria;

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
      "What’s the biggest red flag of toxicity in your type of workplace culture?",
    selfText: "",
    pubDate: "2026-02-19T23:35:01.000Z",
    subreddit: "askreddit",
  },
  {
    subredditDescription:
      "r/AskReddit is the place to ask and answer thought-provoking questions.",
    title:
      "What’s something you spend on that other people wouldn't understand?",
    selfText: "",
    pubDate: "2026-02-19T23:34:18.000Z",
    subreddit: "askreddit",
  },
] as RedditPost[];

const testPrompt = {
  systemPrompt:
    "Transform raw Reddit post titles and post content into clean conversation topics and response statements that make sense. When writing the conversation topics and response statements, intelligently use writing patterns that indicate the text for each different statement could have been written by a different human. Try to preserve the tone and style of the original Reddit post title and post content.",
  userPrompt:
    "Consider a Reddit post with the following title and content:\n" +
    'Subreddit description: "r/AskReddit is the place to ask and answer thought-provoking questions."\n' +
    'Post title: "If you could fix just one government policy overnight, what would it be?"\n' +
    'Post content: ""\n' +
    "\n" +
    "Please write:\n" +
    "1. A question that serves as a conversation topic, which does not at all contain any suggestions for answers.\n" +
    '2. 3 statements that serve as distinct, meaningful, pointed responses to the conversation topic. These should be concise and to the point, and not include any statements which are "catch-all," they should each represent a distinct opinion regarding the debate question. They should also avoid phrases like "I believe," "In my opinion," "For me," "I prefer," etc. The phrases should be confident, concise responses devoid of common turns of phrase. The different statements should also use varying patterns of speech that indicate they were written by different real people, and not a computer.\n' +
    "\n" +
    "In your response, please write the conversation topic question on the first line, and the response statements on subsequent lines.\n" +
    "Please do not offer ANY output other than the properly formatted conversation topic question and the response statements.\n" +
    'If the Reddit post title and post content would not translate into a good conversation topic, please output only the word "Error" and nothing else.',
} as AiPrompt;

if (true) {
  const aiClient = new OpenAiClient();

  describe("Reddit scraper", () => {
    it("obeys post limit", async () => {
      const posts = await getRedditPosts(testCriteria);
      assertLessOrEqual(posts.length, testCriteria.postLimit);
    });
  });

  describe("Prompt utils", () => {
    it("makes transform prompt", () => {
      const aiPrompt = makeTransformPromptFromRedditPost(testPosts[0]);
      assertGreater(aiPrompt.systemPrompt.length, 0);
      assertGreater(aiPrompt.userPrompt.length, 0);
    });
  });

  describe("AI client", () => {
    it("receives completion from LLM", async () => {
      const aiResponse = await aiClient.complete(testPrompt);
      assertGreater(aiResponse.length, 0);
    });
  });

  describe("Reddit importer at-large", () => {
    it("gets reddit posts and transforms them", async () => {
      const posts = await getRedditPosts(testCriteria);
      const randomIndex = Math.floor(Math.random() * posts.length);
      const aiPrompt = makeTransformPromptFromRedditPost(
        posts[randomIndex],
      );
      const aiResponse = await aiClient.complete(aiPrompt);
      console.log(aiResponse);
      assertGreater(aiResponse.length, 0);
    });
  });
}