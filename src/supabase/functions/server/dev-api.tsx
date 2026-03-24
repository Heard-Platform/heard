import { Context, Hono } from "npm:hono";
import {
  getUserSession,
  saveUserAndEmail,
} from "./auth-api.tsx";
import { saveDebateRoom } from "./debate-api.tsx";
import { DebateRoom } from "./types.tsx";
import { generateId } from "./utils.tsx";
import { API_URL_PREFIX } from "./constants.tsx";
import { getAllDebates } from "./kv-utils.tsx";
import { getAllRealUsers, getDebate } from "./kv-utils.tsx";
import { defineRoute } from "./route-wrapper.tsx";

const app = new Hono();

app.get("/make-server-f1a393b4/dev/email-previews", async (c) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>What You Missed</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background-color: #030213;
          color: #ffffff;
          padding: 32px 24px;
          text-align: center;
        }
        .content {
          padding: 32px 24px;
        }
        .footer {
          padding: 24px;
          text-align: center;
          color: #717182;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">What You Missed</h1>
        </div>
        <div class="content">
          <p>Email content will go here...</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">Heard - Debate App</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return c.html(emailHtml);
});

app.post(
  `${API_URL_PREFIX}/dev/create-anon-enabled-debate`,
  async (c: Context) => {
    try {
      const userId = c.get("userId");

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      const roomId = generateId();
      const anonymousLinkId = generateId();
      
      const debateRoom: DebateRoom = {
        id: roomId,
        topic: "What's the best cat personality?",
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
        endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
        allowAnonymous: true,
        anonymousLinkId,
      };

      await saveDebateRoom(debateRoom);

      user.currentRoomId = roomId;
      await saveUserAndEmail(user);

      const invitePath = `/join/${anonymousLinkId}`;

      return c.json({ 
        room: debateRoom, 
        invitePath,
        message: `Anon-enabled debate created! Share: ${invitePath}`,
      });
    } catch (error) {
      console.error("Error creating anonymous debate:", error);
      return c.json(
        { error: "Failed to create anonymous debate" },
        500,
      );
    }
  },
);

app.get(
  `${API_URL_PREFIX}/dev/anon-debates`,
  async (c: Context) => {
    try {
      const allRooms = await getAllDebates();

      const anonDebates = allRooms
        .filter(
          (room) =>
            room.allowAnonymous === true &&
            room.isTestRoom === true
        )
        .map((room) => ({
          ...room,
          invitePath: `/join/${room.anonymousLinkId}`,
        }))
        .sort((a, b) => b.createdAt - a.createdAt);

      return c.json({ debates: anonDebates });
    } catch (error) {
      console.error("Error fetching anon debates:", error);
      return c.json(
        { error: "Failed to fetch anon debates" },
        500,
      );
    }
  },
);

app.get(
  `${API_URL_PREFIX}/dev/posts`,
  defineRoute(
    {},
    async () => {
      const posts = await getAllDebates();
      
      const sortedPosts = posts
        .sort((a, b) => b.createdAt - a.createdAt)

      return { posts: sortedPosts };
    },
    "Failed to fetch posts"
  )
);

app.get(
  `${API_URL_PREFIX}/dev/flyer-stats`,
  defineRoute(
    {},
    async () => {
      const users = await getAllRealUsers();
      
      const flyerRoomData: Record<string, { topic: string; groups: Record<number, number>; lastUserCreated: number }> = {};
      
      for (const user of users) {
        if (user.flyerId) {
          if (!flyerRoomData[user.flyerId]) {
            const room = await getDebate(user.flyerId);
            flyerRoomData[user.flyerId] = {
              topic: room?.topic || user.flyerId,
              groups: {},
              lastUserCreated: 0
            };
          }
          
          const group = user.flyerGroup || 0;
          if (!flyerRoomData[user.flyerId].groups[group]) {
            flyerRoomData[user.flyerId].groups[group] = 0;
          }
          flyerRoomData[user.flyerId].groups[group]++;
          
          if (user.createdAt && user.createdAt > flyerRoomData[user.flyerId].lastUserCreated) {
            flyerRoomData[user.flyerId].lastUserCreated = user.createdAt;
          }
        }
      }
      
      return { flyerRoomData };
    },
    "Failed to fetch flyer stats"
  )
);

export { app as devApi };