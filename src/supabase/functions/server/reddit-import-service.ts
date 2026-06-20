import { getRedditPosts } from "./reddit-scraper-utils.ts";
import { makeTransformPromptFromRedditPost } from "./ai-prompt-utils.ts";
import { EnrichmentService } from "./enrichment-service.ts";
import { RedditPost, RedditScrapeCriteria } from "./types.tsx";
import { ONE_HOUR_MIN } from "./time-utils.ts";

const REDDIT_IMPORT_ENDPOINT = "reddit-import";

export const subredditsToHerds: { [key: string]: string } = {
  "ChangeMyView": "change-my-mind",
  "UnpopularOpinion": "spicy-opinions",
  "washingtondc": "washington-dc",
  "bayarea": "bay-area",
  "moviereviews": "movie-reviews",
  "technology": "technology",
  "music": "music",
  "cooking": "cooking",
  "hygiene": "hygiene",
  "Advice": "advice",
  "politics": "politics",
  "nova": "nova",
  "newyorkcity": "new-york-city",
  "entertainment": "entertainment",
  "todayilearned": "learning",
};

export function getRandomSubreddit(): string {
  const keys = Object.keys(subredditsToHerds);
  return keys[Math.floor(Math.random() * keys.length)];
}

export class RedditImporter extends EnrichmentService {
  protected author = "reddit-importer";
  async createPostFromRedditPost(
    redditPost: RedditPost,
  ): Promise<boolean> {
    const aiPrompt = makeTransformPromptFromRedditPost(redditPost, this.provider);

    const aiResponse = await this.aiClient.complete(aiPrompt, {
      endpoint: REDDIT_IMPORT_ENDPOINT,
    });

    if (aiResponse.trim() === "Error") {
      console.error(`Error creating Heard convo from Reddit post:
Post title: ${redditPost.title}
Post self-text: ${redditPost.selfText}
---------------------------------------------`);
      return false;
    }

    const lines = aiResponse.split("\n");
    const cleanedLines = lines.filter(s => s.trim() !== '');
    const trimmedLines = cleanedLines.map((str: string) => str.trim());
    const conversationTopic = trimmedLines[0];
    const stmtTexts = trimmedLines.slice(1);

    let msg = "Heard convo successfully created from Reddit post:";
    msg += `\nReddit post title: ${redditPost.title}`;
    msg += `\nReddit post self-text: ${redditPost.selfText}`;
    msg += `\nHeard conversation topic: ${conversationTopic}`;
    stmtTexts.forEach((stmt, index) => {
      msg += `\nHeard response statement ${index + 1}: ${stmt}`;
    });
    msg += `\n---------------------------------------------`;
    console.debug(msg);

    const subHeard = subredditsToHerds[redditPost.subreddit] || "test";
    await this.publishRoom(conversationTopic, stmtTexts, { subHeard });

    return true;
  }

  async createPostsFromSubreddit(
    criteria: RedditScrapeCriteria,
  ): Promise<boolean> {
    const posts = await getRedditPosts(criteria);

    let succeeded = true;
    for (const post of posts) {
      const r = await this.createPostFromRedditPost(post);
      if (!r) succeeded = false;
    }
    return succeeded;
  }

  async runOnce() {
    const subredditNames = Object.keys(subredditsToHerds);
    const randomIndex = Math.floor(
      Math.random() * subredditNames.length,
    );
    const randomSubredditName = subredditNames[randomIndex];

    await this.createPostsFromSubreddit({
      subredditName: randomSubredditName,
      maxPostAgeMins: ONE_HOUR_MIN,
      postLimit: 1,
    });
  }
}
