// @ts-ignore
import { Context, Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { getUserSession } from "./auth-api.tsx";
import { normalizeCommunityName } from "./utils.tsx";
import { insert, selectAll } from "./db-utils.ts";
import { getCommunity } from "./kv-utils.tsx";
import type { NewEvent, Event } from "./types.tsx";

const app = new Hono();

app.post(
  "/make-server-f1a393b4/event/create",
  defineRoute(
    {
      name: {
        type: "string",
        required: true,
        validate: (val) => val.trim().length > 0,
        errorMessage: "Event name is required",
      },
      subtitle: {
        type: "string",
        required: false,
      },
      communityName: {
        type: "string",
        required: true,
        validate: (val) => val.trim().length > 0,
        errorMessage: "Community is required",
      },
    },
    async (
      { name, subtitle, communityName }: { name: string; subtitle?: string; communityName: string },
      c: Context,
    ) => {
      const userId = c.get("userId");

      const user = await getUserSession(userId);
      if (!user) throw new Error("User session not found");
      if (user.isAnonymous) throw new Error("Anonymous users cannot create events");

      const normalizedCommunityName = normalizeCommunityName(communityName);

      const community = await getCommunity(normalizedCommunityName);
      if (!community) throw new Error("Community not found");
      if (community.hostOnlyPosting && community.adminId !== userId) {
        throw new Error("Only the community host can create events in this community");
      }

      const event: NewEvent = {
        name: name.trim(),
        subtitle: subtitle?.trim() ?? "",
        communityName: normalizedCommunityName,
        creatorId: userId,
      };

      const result = await insert("events", event);
      if (!result.success) throw new Error(result.error || "Failed to insert event");

      return { event };
    },
    "Failed to create event",
  ),
);

app.get(
  "/make-server-f1a393b4/events",
  defineRoute(
    {},
    async (_params, c: Context) => {
      const community = c.req.query("community");

      const events = await selectAll<Event>(
        "events",
        community ? { communityName: community } : undefined,
      );

      const summaries = events.map((event) => ({
        id: event.id,
        name: event.name,
        subtitle: event.subtitle,
      }));

      return { events: summaries };
    },
    "Failed to fetch events",
  ),
);

export { app as eventApi };
