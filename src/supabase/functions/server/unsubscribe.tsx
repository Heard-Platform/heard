import { cors } from "npm:hono/cors";
import { getUser, saveUser } from "./kv-utils.tsx";
import { AuthedHono } from "./hono-wrapper.ts";

const authedApp = new AuthedHono();

authedApp.use("*", cors());

authedApp.post("/make-server-f1a393b4/unsubscribe", async (c) => {
  try {
    const { userId } = await c.req.json();

    if (!userId) {
      return c.json({ error: "userId is required" }, 400);
    }

    const user = await getUser(userId);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    user.emailDigestsEnabled = false;
    await saveUser(user);

    console.log(`[unsubscribe] User ${userId} (${user.email}) unsubscribed from email digests`);

    return c.json({
      success: true,
      message: "Successfully unsubscribed from email digests",
    });
  } catch (error) {
    console.log("[unsubscribe] Error:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error processing unsubscribe",
      },
      500,
    );
  }
});

export { authedApp as unsubscribeApi };
