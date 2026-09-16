import { Context, Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { insertAnalyticsEvent } from "./model-utils.ts";
import { getFrontendUrl } from "./utils.tsx";

const app = new Hono();

app.use("*", cors());

app.get("/make-server-f1a393b4/email/click", async (c: Context) => {
  const userId = c.req.query("userId");
  const roomId = c.req.query("roomId");
  const eventType = c.req.query("eventType");
  const destination = roomId
    ? `${getFrontendUrl()}/room/${roomId}`
    : getFrontendUrl();

  if (userId && eventType) {
    try {
      await insertAnalyticsEvent({
        type: eventType,
        userId,
        roomId,
      });
    } catch (error) {
      console.error("[email-click-tracker] Failed to log click:", error);
    }
  }

  return c.redirect(destination, 302);
});

export { app as emailClickTrackerApi };
