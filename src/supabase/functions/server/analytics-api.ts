import { Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { insertAnalyticsEvent } from "./model-utils.ts";
import { API_URL_PREFIX } from "./constants.tsx";

const app = new Hono();

app.post(
  `${API_URL_PREFIX}/analytics/event`,
  defineRoute<{ event: string; roomId?: string }, {}>(
    {
      event: { type: "string", required: true },
      roomId: { type: "string", required: false },
    },
    async ({ event, roomId }, c) => {
      const userId = c.get("userId") ?? null;
      await insertAnalyticsEvent(event, userId, roomId);
      return {};
    },
    "Failed to track analytics event",
  ),
);

export { app as analyticsApi };
