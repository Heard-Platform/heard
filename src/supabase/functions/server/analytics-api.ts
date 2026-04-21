import { Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { insertAnalyticsEvent } from "./model-utils.ts";
import { API_URL_PREFIX } from "./constants.tsx";

const app = new Hono();

app.post(
  `${API_URL_PREFIX}/analytics/event`,
  defineRoute<{ type: string; roomId?: string }, void>(
    {
      type: { type: "string", required: true },
      roomId: { type: "string", required: false },
    },
    async ({ type, roomId }, c) => {
      const userId = c.get("userId");
      await insertAnalyticsEvent({ type, userId, roomId });
    },
    "Failed to track analytics event",
  ),
);

export { app as analyticsApi };
