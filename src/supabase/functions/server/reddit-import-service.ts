import { getRedditPosts } from "./reddit-scraper-utils.ts";
import { makeTransformPromptFromRedditPost } from "./ai-prompt-utils.ts";
import { EnrichmentService } from "./enrichment-service.ts";
import { RedditPost } from "./types.tsx";
import { createRoom } from "./kv-utils.tsx";
import { createNewRoomData } from "./room-utils.ts";
import { ONE_WEEK_MIN, ONE_WEEK_MS } from "./time-utils.ts";
import { generateId } from "./utils.tsx";
import { saveStatement } from "./kv-utils.tsx";

export const subredditsToHerds = {
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

export class RedditImporter extends EnrichmentService {
  async createPostFromRedditPost(
    redditPost: RedditPost,
  ): Promise<boolean> {
    const aiPrompts = makeTransformPromptFromRedditPost(redditPost);

    const aiResponse = await this.aiClient.complete({
      systemPrompt: aiPrompts.systemPrompt,
      userPrompt: aiPrompts.userPrompt,
    });

    if (aiResponse.trim() === "Error") {
      console.log(`Error creating Heard convo from Reddit post:
Post title: ${redditPost.title}
Post self-text: ${redditPost.selfText}
---------------------------------------------`);
      return false;
    }

    const lines = aiResponse.split("\n");
    const trimmedLines = lines.map((str: string) => str.trim());
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
    console.log(msg);

    const newPost = createNewRoomData({
      id: generateId(),
      topic: conversationTopic,
      participants: [],
      hostId: "enrichment-service",
      subHeard: "test",
      endTime: Date.now() + ONE_WEEK_MS,
    });
    await createRoom(newPost);

    stmtTexts.forEach(async (stmtText) => {
      await saveStatement({
        id: generateId(),
        text: stmtText,
        author: "enrichment-service",
        agrees: 0,
        disagrees: 0,
        passes: 0,
        superAgrees: 0,
        roomId: newPost.id,
        timestamp: Date.now(),
        round: 1,
        voters: {},
      });
    });

    return true;
  }

  async createPostsFromSubreddit(criteria: {
    subredditName: string;
    maxPostAgeMins: number;
  }): Promise<boolean> {
    const posts = await getRedditPosts(criteria);

    let succeeded = true;
    for (const postData of posts) {
      const r = await this.createPostFromRedditPost(postData);
      if (!r) succeeded = false;
    }
    return succeeded;
  }
}
