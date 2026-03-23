import { Context } from "npm:hono";
import { Hono } from "npm:hono";
import { getRecentPresences, updatePresence } from "./model-utils.ts";
import { getUser } from "./kv-utils.tsx";

const app = new Hono();

app.post("/make-server-f1a393b4/vine/presence", async (c: Context) => {
  try {
    const { userId, currentRoomIndex } = await c.req.json();

    if (!userId || currentRoomIndex === undefined) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    const user = (await getUser(userId))!;

    await updatePresence(userId, currentRoomIndex, user.avatarAnimal || "monkey");

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