import { Context, Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import {
  getUserSession,
  saveUserAndEmail,
} from "./auth-api.tsx";
import { generateId, getDebateRoom, saveDebateRoom } from "./debate-api.tsx";
import { normalizeCommunityName } from "./utils.tsx";
import type {
  Community, DemographicQuestion,
  Statement
} from "./types.tsx";
import { ONE_WEEK_MS } from "./time-utils.ts";
import {
  deleteCohostInvite,
  getCommunity,
  getCohostInvite,
  saveCommunity,
  saveStatement,
} from "./kv-utils.tsx";
import { createNewRoomData } from "./room-utils.ts";
import { insertAnalyticsEvent, insertDemographicQuestion, recordRoomEngagement, saveRoomView } from "./model-utils.ts";


const app = new Hono();

// Create debate room
app.post(
  "/make-server-f1a393b4/room/create",
  async (c: Context) => {
    try {
      const userId = c.get("userId");
      const {
        topic,
        description,
        subHeard: communityName,
        seedStatements,
        cover,
        allowAnonymous,
        debateLength,
        demographicQuestions,
        eventId,
      } = await c.req.json();

      const imageUrl = cover?.type === "image" ? cover.url : undefined;
      const youtubeUrl = cover?.type === "youtube" ? cover.url : undefined;

      if (!topic || topic.length < 10) {
        return c.json(
          { error: "Topic must be at least 10 characters" },
          400,
        );
      }

      if (Array.isArray(demographicQuestions)) {
        const invalidCustomQuestion = demographicQuestions.find(
          (q: DemographicQuestion) =>
            q.type === "custom" &&
            (!q.text?.trim() || (q.options ?? []).filter((o) => o.trim() !== "").length < 2),
        );
        if (invalidCustomQuestion) {
          return c.json(
            { error: "Custom demographic questions require text and at least 2 answer options" },
            400,
          );
        }
      }

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      if (user.isAnonymous) {
        return c.json(
          { error: "Anonymous users cannot create debates" },
          403,
        );
      }

      let normalizedCommunityName = "";
      // If creating a room in a sub-heard, create it if it doesn't exist or check membership if private
      if (communityName) {
        normalizedCommunityName = normalizeCommunityName(communityName);
        const community = await getCommunity(normalizedCommunityName);

        if (!community) {
          const newCommunity: Community = {
            name: normalizedCommunityName,
            isPrivate: false,
            adminId: userId,
            hostOnlyPosting: false,
          };
          await saveCommunity(newCommunity);
        } else {
          const isModerator = community.adminId === userId || !!community.modIds?.includes(userId);
          if (community.hostOnlyPosting && !isModerator) {
            return c.json(
              { error: "Only moderators can create debates in this community" },
              403,
            );
          }
        }
      }

      const roomId = generateId();
      const debateLengthMs = debateLength
        ? debateLength * 60 * 1000
        : ONE_WEEK_MS; // CN-1 (BC)

      const debateRoom = createNewRoomData({
        id: roomId,
        topic: topic.substring(0, 500),
        description: description?.substring(0, 500) || undefined,
        participants: [userId],
        hostId: userId,
        subHeard: normalizedCommunityName || undefined,
        endTime: Date.now() + debateLengthMs,
        imageUrl,
        youtubeUrl,
        allowAnonymous: !!allowAnonymous,
        eventId: eventId || undefined,
      });

      await saveDebateRoom(debateRoom);
      await recordRoomEngagement(userId, roomId);

      user.score += 100;

      // Create seed statements if provided (optional, for backwards compatibility)
      if (seedStatements && Array.isArray(seedStatements) && seedStatements.length > 0) {
        const statements: Statement[] = seedStatements.map((text: string) => ({
          id: generateId(),
          text: text.substring(0, 1000), // Limit statement length
          author: userId,
          agrees: 0,
          disagrees: 0,
          passes: 0,
          superAgrees: 0,
          roomId: roomId,
          timestamp: Date.now(),
          round: 1, // Seed statements are for round 1
          voters: {},
        }));

        // Save each statement individually
        for (const statement of statements) {
          await saveStatement(statement);
        }

        console.log(`Created ${statements.length} seed statements for room ${roomId}`);
      }

      // Save demographic questions if provided
      if (demographicQuestions && Array.isArray(demographicQuestions) && demographicQuestions.length > 0) {
        await Promise.all(
          demographicQuestions.map((question: DemographicQuestion) =>
            insertDemographicQuestion({
              id: question.id,
              roomId,
              type: question.type,
              text: question.text,
              options: question.options?.filter(
                (o: string) => o.trim() !== "",
              ),
            }),
          ),
        );
      }

      // Update user's current room
      user.currentRoomId = roomId;
      await saveUserAndEmail(user);

      return c.json({ ...debateRoom, userScore: user.score });
    } catch (error) {
      console.error("Error creating debate room:", error);
      return c.json(
        { error: "Failed to create debate room" },
        500,
      );
    }
  },
);

app.post(
  "/make-server-f1a393b4/rooms/:roomId/seen",
  defineRoute(
    {},
    async (_params, c: Context) => {
      const userId = c.get("userId");
      if (!userId) throw new Error("Not authenticated");
      const roomId = c.req.param("roomId");
      if (!roomId) throw new Error("Room ID is required");

      await saveRoomView({
        userId,
        roomId,
        lastSeenAt: Date.now(),
      });

      return {};
    },
    "Failed to mark room as seen",
  ),
);

app.post(
  "/make-server-f1a393b4/room/:roomId/cohost-invite/accept",
  defineRoute(
    {
      roomId: { type: "string", required: true },
      token: { type: "string", required: true },
    },
    async ({ roomId, token }: { roomId: string; token: string }, c: Context) => {
      const userId = c.get("userId");
      if (!userId) throw new Error("Not authenticated");

      const user = await getUserSession(userId);
      if (user?.isAnonymous) {
        throw new Error("Anonymous users cannot become co-hosts. Create an account first.");
      }

      const invite = await getCohostInvite(token);
      if (!invite || invite.roomId !== roomId) {
        throw new Error("Invalid or expired invite link");
      }

      if (Date.now() > invite.expiresAt) {
        await deleteCohostInvite(token);
        throw new Error("This invite link has expired");
      }

      await deleteCohostInvite(token);

      const room = await getDebateRoom(roomId);
      if (!room) throw new Error("Room not found");

      if (room.hostId === userId) {
        throw new Error("You're already the host of this room");
      }

      const cohostIds = new Set(room.cohostIds ?? []);
      cohostIds.add(userId);
      await saveDebateRoom({ ...room, cohostIds: Array.from(cohostIds) });
      await insertAnalyticsEvent({ type: "cohost_invite_accepted", userId, roomId });

      return {};
    },
    "Failed to accept co-host invite",
  ),
);

app.delete(
  "/make-server-f1a393b4/room/:roomId/cohosts",
  defineRoute(
    {},
    async (_params, c: Context) => {
      const userId = c.get("userId");
      const roomId = c.req.param("roomId") as string;

      const room = await getDebateRoom(roomId);
      if (!room) throw new Error("Room not found");
      if (room.hostId !== userId) throw new Error("Only the host can remove cohosts");

      await saveDebateRoom({ ...room, cohostIds: [] });

      return {};
    },
    "Failed to remove cohosts",
  ),
);

export { app as roomApi };