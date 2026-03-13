import { Context } from "npm:hono";
import { getRecentPresences, updatePresence } from "./model-utils.ts";
import { AuthedHono } from "./hono-wrapper.ts";

const PRESENCE_TTL = 10000;
const PRESENCE_CLEANUP_INTERVAL = 30000;

const app = new AuthedHono();

app.post("/make-server-f1a393b4/vine/presence", async (c: Context) => {
  try {
    const { currentRoomIndex } = await c.req.json();
    const userId = c.get("userId");

    if (currentRoomIndex === undefined) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    await updatePresence(userId, currentRoomIndex);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating user presence:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

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