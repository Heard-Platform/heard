import { Context } from "npm:hono";
import { UserPresence } from "./types.tsx";
import { getRecentPresences, updatePresence } from "./model-utils.ts";
import { AuthedHono } from "./hono-wrapper.ts";
import { AuthType, defineRoute } from "./route-wrapper.tsx";

const PRESENCE_TTL = 10000;
const PRESENCE_CLEANUP_INTERVAL = 30000;

const app = new AuthedHono();

app.post(
  "/make-server-f1a393b4/vine/presence",
  defineRoute(
    {
      currentRoomIndex: {
        type: "number",
        required: true,
      },
    },
    async ({ currentRoomIndex }: { currentRoomIndex: number }, userId) => {
      userId = userId as string;

      if (currentRoomIndex === undefined) {
        return { success: false, error: "Missing required fields" };
      }

      const presence: UserPresence = {
        userId,
        currentRoomIndex,
        lastUpdated: Date.now(),
      };

      await updatePresence(userId, currentRoomIndex);

      return { success: true };
    },
    "Failed to update presence",
    AuthType.USER
  )
);


app.get("/make-server-f1a393b4/vine/presences", async (c: Context) => {
  try {
    const presences = await getRecentPresences();
    return c.json({ success: true, data: presences });
  } catch (error) {
    console.error("Error getting active presences:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

export { app as vineApi };