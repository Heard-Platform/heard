// @ts-ignore
import { Context, Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { getUserSession } from "./auth-api.tsx";
import { normalizeCommunityName } from "./utils.tsx";
import { getAllRecords, insert, selectAll } from "./db-utils.ts";
import { getAllDebates, getCommunity, getStatementsForRoom, getUser, getVotesForUser } from "./kv-utils.tsx";
import type { NewEvent, Event, CommunityMembership } from "./types.tsx";

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
        communityName: event.communityName,
      }));

      return { events: summaries };
    },
    "Failed to fetch events",
  ),
);

app.get(
  "/make-server-f1a393b4/event/:eventId",
  defineRoute(
    {
      eventId: { type: "string", required: true },
    },
    async ({ eventId }: { eventId: string }, c: Context) => {
      const userId = c.get("userId");

      const [eventRows] = await selectAll<Event>("events", { id: eventId });
      if (!eventRows) throw new Error("Event not found");

      const [allRooms, userVotes, allMemberships] = await Promise.all([
        getAllDebates(),
        getVotesForUser(userId),
        getAllRecords<CommunityMembership>("subheard_member:"),
      ]);

      const votedStatementIds = new Set(userVotes.map((v) => v.statementId));
      const totalMembers = allMemberships.filter(
        (m) => m.subHeard === eventRows.communityName,
      ).length;

      const now = Date.now();
      const eventRooms = allRooms.filter((r) => r.eventId === eventId);

      const enrichedRooms = await Promise.all(
        eventRooms.map(async (room) => {
          const [statements, participantUsers] = await Promise.all([
            getStatementsForRoom(room.id),
            Promise.all(room.participants.slice(0, 4).map((pid) => getUser(pid))),
          ]);

          const unvotedCount = statements.filter(
            (s) => !votedStatementIds.has(s.id),
          ).length;
          const userHasVoted = statements.some((s) => votedStatementIds.has(s.id));
          const isCompleted = !room.isActive || (room.endTime != null && room.endTime < now);

          const status = isCompleted
            ? "completed"
            : unvotedCount > 0 || statements.length === 0
              ? "needs_input"
              : "caught_up";

          const participantAvatars = participantUsers
            .filter(Boolean)
            .map((u) => u!.avatarAnimal ?? "koala");

          return {
            id: room.id,
            topic: room.topic,
            description: room.description,
            emoji: room.emoji,
            participants: room.participants,
            createdAt: room.createdAt,
            endTime: room.endTime,
            status,
            userHasVoted,
            newStatementCount: unvotedCount,
            participantAvatars,
          };
        }),
      );

      return {
        event: {
          id: eventRows.id,
          name: eventRows.name,
          subtitle: eventRows.subtitle,
          communityName: eventRows.communityName,
          totalMembers,
          rooms: enrichedRooms,
        },
      };
    },
    "Failed to fetch event",
  ),
);

export { app as eventApi };
