import * as kv from "./kv_store.tsx";
import {
  getUserSession,
  saveUserAndEmail,
} from "./auth-api.tsx";
import { generateId, saveDebateRoom } from "./debate-api.tsx";
import type {
  Community, Statement
} from "./types.tsx";
import { ONE_WEEK_MS } from "./time-utils.ts";
import { getCommunity, saveCommunity } from "./kv-utils.tsx";
import { createNewRoomData } from "./room-utils.ts";
import { AuthedHono } from "./hono-wrapper.ts";

const authedApp = new AuthedHono();

// Create debate room
authedApp.post(
  "/make-server-f1a393b4/room/create",
  async (c: any) => {
    try {
      const {
        topic,
        userId,
        subHeard: communityName,
        seedStatements,
        imageUrl,
        youtubeUrl,
        allowAnonymous,
        debateLength,
      } = await c.req.json();

      if (!topic || topic.length < 10) {
        return c.json(
          { error: "Topic must be at least 10 characters" },
          400,
        );
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
        normalizedCommunityName = communityName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-");
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
          if (community.hostOnlyPosting && community.adminId !== userId) {
            return c.json(
              { error: "Only the community host can create debates in this community" },
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
        participants: [userId],
        hostId: userId,
        subHeard: normalizedCommunityName || undefined,
        endTime: Date.now() + debateLengthMs,
        imageUrl,
        youtubeUrl,
        allowAnonymous: !!allowAnonymous,
      });

      await saveDebateRoom(debateRoom);

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
          await kv.set(
            `statement:${roomId}:${statement.id}`,
            JSON.stringify(statement),
          );
        }

        console.log(`Created ${statements.length} seed statements for room ${roomId}`);
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

export { authedApp as roomApi };