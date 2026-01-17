import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import {
  getUserSession,
  saveUserAndEmail,
} from "./auth-api.tsx";
import { generateId, saveDebateRoom } from "./debate-api.tsx";
import type {
  DebateRoom,
  Statement
} from "./types.tsx";
import { ONE_WEEK_MS } from "./time-utils.ts";

const app = new Hono();

// Create debate room
app.post(
  "/make-server-f1a393b4/room/create",
  async (c: any) => {
    try {
      const {
        topic,
        userId,
        subHeard,
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

      // If creating a room in a sub-heard, create it if it doesn't exist or check membership if private
      if (subHeard) {
        const normalizedSubHeard = subHeard
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-");
        const subHeardKey = `subheard:${normalizedSubHeard}`;
        const subHeardData = await kv.get(subHeardKey);

        if (!subHeardData) {
          // Sub-heard doesn't exist - create it as a public sub-heard with this user as admin
          console.log(
            `Creating new public sub-heard: ${normalizedSubHeard}`,
          );
          const newSubHeardData = {
            name: normalizedSubHeard,
            createdAt: Date.now(),
            isPrivate: false,
            adminId: userId,
          };
          await kv.set(
            subHeardKey,
            JSON.stringify(newSubHeardData),
          );
        }
      }

      const roomId = generateId();
      const debateLengthMs = debateLength
        ? debateLength * 60 * 1000
        : ONE_WEEK_MS; // CN-1 (BC)

      const debateRoom: DebateRoom = {
        id: roomId,
        topic: topic.substring(0, 500),
        phase: "round1",
        subPhase: "posting",
        gameNumber: 1,
        roundStartTime: Date.now(),
        participants: [userId],
        hostId: userId,
        isActive: true,
        createdAt: Date.now(),
        mode: "realtime",
        rantFirst: true,
        subHeard: subHeard
          ? subHeard.trim().toLowerCase().replace(/\s+/g, "-")
          : undefined,
        endTime: Date.now() + debateLengthMs,
        imageUrl,
        youtubeUrl,
        allowAnonymous: !!allowAnonymous,
      };

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

export { app as roomApi };