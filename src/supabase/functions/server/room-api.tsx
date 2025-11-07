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
} from "./debate-api.tsx";

const app = new Hono();

// Create debate room
app.post(
  "/make-server-f1a393b4/room/create",
  async (c: any) => {
    try {
      const {
        topic,
        description,
        userId,
        mode = "host-controlled",
        rantFirst = false,
        subHeard,
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

      // If creating a room in a private sub-heard, check membership
      if (subHeard) {
        const normalizedSubHeard = subHeard
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-");
        const subHeardKey = `subheard:${normalizedSubHeard}`;
        const subHeardData = await kv.get(subHeardKey);

        if (subHeardData) {
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
        }
      }

      const roomId = generateId();
      const debateRoom: DebateRoom = {
        id: roomId,
        topic: topic.substring(0, 500), // Limit topic length
        description: description
          ? description.substring(0, 2000)
          : undefined, // Optional description with limit
        phase: rantFirst ? "round1" : "lobby", // Rant-first rooms start in round1
        subPhase: rantFirst ? "posting" : undefined, // Rant-first rooms start in posting phase
        gameNumber: 1,
        roundStartTime: Date.now(),
        participants: [userId],
        hostId: userId, // Set the creator as the host
        isActive: true,
        createdAt: Date.now(),
        mode: mode as DebateMode,
        rantFirst: rantFirst,
        subHeard: subHeard
          ? subHeard.trim().toLowerCase().replace(/\s+/g, "-")
          : undefined,
        endTime:
          mode === "realtime"
            ? Date.now() + 7 * 24 * 60 * 60 * 1000
            : undefined, // Realtime debates end in 1 week
      };

      await saveDebateRoom(debateRoom);

      // Update user's current room
      user.currentRoomId = roomId;
      await saveUserSession(user);

      return c.json({ room: debateRoom });
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