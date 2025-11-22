import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import {
  getUserSession,
  saveUserSession,
} from "./auth-api.tsx";
import {
  DebateMode,
  DebateRoom,
  generateId,
  saveDebateRoom,
  Statement,
} from "./debate-api.tsx";

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
        seedStatements, // Optional array of seed statement strings
        imageUrl, // Optional cover image URL
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

      // If creating a room in a sub-heard, create it if it doesn't exist or check membership if private
      if (subHeard) {
        const normalizedSubHeard = subHeard
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-");
        const subHeardKey = `subheard:${normalizedSubHeard}`;
        const subHeardData = await kv.get(subHeardKey);

        if (subHeardData) {
          // Sub-heard exists - check if it's private and verify membership
          try {
            const parsedSubHeard = JSON.parse(subHeardData);
            if (parsedSubHeard.isPrivate) {
              // Check if user is admin or member
              const isAdmin = parsedSubHeard.adminId === userId;
              const membershipKey = `subheard_member:${userId}:${normalizedSubHeard}`;
              const isMember = await kv.get(membershipKey);

              if (!isAdmin && !isMember) {
                return c.json(
                  {
                    error:
                      "You must be a member of this private sub-heard to create rooms",
                  },
                  403,
                );
              }
            }
          } catch (error) {
            console.error(
              "Error checking sub-heard membership:",
              error,
            );
          }
        } else {
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
      const debateRoom: DebateRoom = {
        id: roomId,
        topic: topic.substring(0, 500), // Limit topic length
        phase: "round1", // All new rooms start in round1 with rant-first
        subPhase: "posting", // All new rooms start in posting phase
        gameNumber: 1,
        roundStartTime: Date.now(),
        participants: [userId],
        hostId: userId, // Set the creator as the host
        isActive: true,
        createdAt: Date.now(),
        mode: "realtime", // All new rooms are realtime
        rantFirst: true, // All new rooms are rant-first
        subHeard: subHeard
          ? subHeard.trim().toLowerCase().replace(/\s+/g, "-")
          : undefined,
        endTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // Realtime debates end in 1 week
        imageUrl, // Add cover image URL if provided
      };

      await saveDebateRoom(debateRoom);

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
      await saveUserSession(user);

      return c.json(debateRoom);
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