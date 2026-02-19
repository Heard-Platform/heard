import { Context, Hono } from "npm:hono";
import { RedditImporter } from "./reddit-import-service.ts";
import { verifyAdminKey } from "./admin-api.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { RedditScrapeCriteria } from "./types.tsx";


export const app = new Hono();

app.use("/make-server-f1a393b4/reddit/*", verifyAdminKey);

app.post(
  "/make-server-f1a393b4/reddit/seed",
  defineRoute(
    {
      subredditName: { type: "string", required: true },
      maxPostAgeMins: { type: "number", required: true },
      userId: { type: "string", required: true },
      subHeard: { type: "boolean", required: false },
    },
    async (params: Omit<RedditScrapeCriteria, "postLimit"> & {
      userId: string;
      subHeard?: boolean;
    }) => {
      const redditImportService = new RedditImporter();
      await redditImportService.createPostsFromSubreddit({
        subredditName: params.subredditName,
        maxPostAgeMins: params.maxPostAgeMins,
        postLimit: 1,
      });
    },
    "Failed to seed from Reddit",
  ),
);

export { app as redditApi };