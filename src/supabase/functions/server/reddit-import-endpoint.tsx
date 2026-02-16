import { Hono, Context } from "hono";
import { RedditImportService } from "./reddit-import-service.tsx";
import { verifyAdminKey } from "./endpoint-utils.tsx";


export const app = new Hono();

app.use("/make-server-f1a393b4/reddit/*", verifyAdminKey);

// Endpoint - create Heard conversation from Reddit criteria
app.post(
    "/make-server-f1a393b4/reddit/seed",
    async (c: Context) => {
        const { subredditName, maxPostAgeMins, userId, subHeard } = await c.req.json();

        if (!subredditName || typeof subredditName !== "string") {
            return c.json({ error: "Subreddit name is required" }, 400);
        }

        if (!maxPostAgeMins || typeof maxPostAgeMins !== "number") {
            return c.json({ error: "Maximum post age is required" }, 400);
        }

        if (!userId || typeof userId !== "string") {
            return c.json({ error: "User ID is required" }, 400);
        }

        console.log({ subredditName, maxPostAgeMins, userId, subHeard });

        const redditImportService = new RedditImportService();
        await redditImportService.createHeardConvosFromRedditCriteria({
            subredditName,
            maxPostAgeMins,
        });

        return c.json({
            success: true,
        });
    },
);


// DEBUG below here, creating server for testing purposes
export default app;

// Start server
const port = 3000;
console.log(`Server running on http://localhost:${port}`);

// For Node.js with Hono
import { serve } from '@hono/node-server';
serve({
    fetch: app.fetch,
    port: port,
});