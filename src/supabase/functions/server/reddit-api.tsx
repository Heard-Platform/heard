// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Middleware to verify admin key
const verifyAdminKey = async (c: any, next: any) => {
  const adminKey = c.req.header("X-Admin-Key");
  const validKey = Deno.env.get("DEV_ADMIN_KEY");

  if (!adminKey || !validKey || adminKey !== validKey) {
    return c.json(
      { error: "Unauthorized - Invalid admin key" },
      401,
    );
  }

  await next();
};

// Apply middleware to all reddit routes
app.use("/make-server-f1a393b4/reddit/*", verifyAdminKey);

// Create test room from Reddit post
app.post(
  "/make-server-f1a393b4/reddit/seed",
  async (c) => {
    try {
      const { redditUrl, userId, subHeard } = await c.req.json();

      if (!redditUrl || typeof redditUrl !== "string") {
        return c.json({ error: "Reddit URL is required" }, 400);
      }

      if (!userId || typeof userId !== "string") {
        return c.json({ error: "User ID is required" }, 400);
      }

      // Extract post ID from Reddit URL
      // Supports formats like:
      // https://www.reddit.com/r/subreddit/comments/POST_ID/title/
      // https://reddit.com/r/subreddit/comments/POST_ID/
      const postIdMatch = redditUrl.match(/\/comments\/([a-z0-9]+)/i);
      if (!postIdMatch) {
        return c.json({ error: "Invalid Reddit URL format" }, 400);
      }

      const postId = postIdMatch[1];
      console.log(`Fetching Reddit post: ${postId}`);

      // Get Reddit API credentials
      const redditClientId = Deno.env.get("REDDIT_CLIENT_ID");
      const redditClientSecret = Deno.env.get("REDDIT_CLIENT_SECRET");

      if (!redditClientId || !redditClientSecret) {
        return c.json(
          { error: "Reddit API credentials not configured. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET environment variables." },
          500,
        );
      }

      // Get OAuth access token from Reddit
      console.log("Authenticating with Reddit API...");
      const authString = btoa(`${redditClientId}:${redditClientSecret}`);
      const tokenResponse = await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Heard:dev:v1.0 (by /u/heard_dev)",
        },
        body: "grant_type=client_credentials",
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Reddit OAuth error:", tokenResponse.status, errorText);
        return c.json(
          { error: `Reddit authentication failed: ${tokenResponse.status}` },
          500,
        );
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      console.log("Successfully authenticated with Reddit API");

      // Fetch post data using OAuth
      const redditApiUrl = `https://oauth.reddit.com/comments/${postId}`;
      const redditResponse = await fetch(redditApiUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "User-Agent": "Heard:dev:v1.0 (by /u/heard_dev)",
        },
      });

      if (!redditResponse.ok) {
        const errorText = await redditResponse.text();
        console.error("Reddit API error:", redditResponse.status, errorText);
        return c.json(
          { error: `Reddit API error: ${redditResponse.status}` },
          500,
        );
      }

      const redditData = await redditResponse.json();
      console.log("Reddit data fetched successfully");

      // Parse post and comments
      const postData = redditData[0]?.data?.children?.[0]?.data;
      const commentsData = redditData[1]?.data?.children || [];

      if (!postData) {
        return c.json({ error: "Could not parse Reddit post" }, 500);
      }

      const topic = postData.title;
      const selfText = postData.selftext || "";

      console.log(`Topic: ${topic}`);
      console.log(`Found ${commentsData.length} top-level comments`);

      // Get the OpenAI API key for processing comments
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiApiKey) {
        return c.json({ error: "OpenAI API key not configured" }, 500);
      }

      // Import the saveDebateRoom function from debate-api
      const debateApiModule = await import("./debate-api.tsx");
      
      // Create the debate room using the proper function
      const roomId = crypto.randomUUID();
      const room = {
        id: roomId,
        topic,
        createdAt: Date.now(),
        participants: [userId],
        hostId: userId,
        phase: "lobby" as const,
        subPhase: "posting" as const,
        mode: "realtime" as const,
        rantFirst: true,
        isActive: true,
        subHeard: subHeard || null,
        gameNumber: 1,
        roundStartTime: Date.now(),
      };

      // Save the room
      await debateApiModule.saveDebateRoom(room);
      console.log(`Created room ${roomId} for topic: ${topic}`);

      // Filter out invalid comments first
      const validComments = commentsData.filter((commentWrapper: any) => {
        const comment = commentWrapper.data;
        return (
          comment &&
          comment.body !== "[deleted]" &&
          comment.body !== "[removed]" &&
          comment.author !== "AutoModerator" &&
          comment.body &&
          comment.body.length >= 20
        );
      });

      console.log(`Found ${validComments.length} valid comments out of ${commentsData.length} total`);

      // Randomly select up to 10 comments
      const selectedComments = [];
      const maxComments = Math.min(10, validComments.length);
      const selectedIndices = new Set();
      
      while (selectedIndices.size < maxComments) {
        const randomIndex = Math.floor(Math.random() * validComments.length);
        selectedIndices.add(randomIndex);
      }

      for (const index of selectedIndices) {
        selectedComments.push(validComments[index]);
      }

      console.log(`Randomly selected ${selectedComments.length} comments to process`);

      // Process selected comments and save them (will be stored as rants in DB)
      const processedComments = [];
      let processedCount = 0;
      
      for (const commentWrapper of selectedComments) {
        const comment = commentWrapper.data;

        const commentId = crypto.randomUUID();
        const commentData = {
          id: commentId,
          text: comment.body.substring(0, 500), // Limit length
          author: `u/${comment.author}`,
          timestamp: Date.now() + processedCount,
          roomId: roomId,
        };

        processedComments.push(commentData);
        // Save to DB as "rant" since that's our storage format
        await kv.set(`rant:${roomId}:${commentId}`, JSON.stringify(commentData));
        processedCount++;

        console.log(`Saved comment from ${commentData.author} (${commentData.text.length} chars)`);
      }

      console.log(`Saved ${processedComments.length} comments, now processing with AI...`);

      // Process each comment through AI to create statements
      const statements = [];
      for (const processedComment of processedComments) {
        try {
          // Generate statements from this comment using AI
          const result = await generateStatementsFromRedditComment(
            processedComment,
            topic,
            openaiApiKey,
          );

          // Create statement objects
          const baseTimestamp = Date.now();
          for (let i = 0; i < result.statements.length; i++) {
            const statementId = crypto.randomUUID();
            const statement = {
              id: statementId,
              text: result.statements[i],
              author: processedComment.author,
              agrees: 0,
              disagrees: 0,
              passes: 0,
              superAgrees: 0,
              roomId: roomId,
              timestamp: baseTimestamp + statements.length,
              round: 1,
              voters: {},
            };
            statements.push(statement);
            await kv.set(
              `statement:${roomId}:${statementId}`,
              JSON.stringify(statement),
            );
          }
          console.log(`Created ${result.statements.length} statements from ${processedComment.author}`);
        } catch (error) {
          console.error(`Error processing comment from ${processedComment.author}:`, error);
          // Continue with other comments even if one fails
        }
      }

      console.log(`Created ${statements.length} total statements`);

      return c.json({
        success: true,
        room: {
          id: roomId,
          topic,
          commentCount: processedComments.length,
          statementCount: statements.length,
        },
      });
    } catch (error) {
      console.error("Error creating Reddit seed room:", error);
      return c.json(
        { error: `Failed to create Reddit seed room: ${error.message}` },
        500,
      );
    }
  },
);

// Helper function to generate statements from a Reddit comment
async function generateStatementsFromRedditComment(
  comment: any,
  topic: string,
  apiKey: string,
): Promise<{ statements: string[] }> {
  const truncatedText = comment.text.substring(0, 400);

  const prompt = `Topic: "${topic}"
Author: ${comment.author}
Comment: ${truncatedText}

Generate 2-4 debate statements based on this person's comment.

STRICT Rules:
- Use the author's actual words and phrases whenever possible
- Do NOT add interpretations, implications, or extra meaning
- Do NOT extrapolate beyond what they explicitly said
- Stay faithful to their tone (casual, formal, emotional, etc.)
- Only create statements for arguments they actually made
- Keep their specific examples and concerns intact
- If they used simple language, keep it simple
- If they were emotional, preserve that emotion

Return only the statements, one per line. Don't include any explanations, extra text, or prefixes.`;

  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a faithful content editor. Transform raw comments into clean debate statements while preserving the author's exact words, tone, and meaning. Do not add interpretations or extrapolate beyond what was actually said.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  // Split by newlines and filter out empty lines
  const statements = content
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0 && !line.startsWith("//"));

  return { statements };
}

export { app as redditApi };
