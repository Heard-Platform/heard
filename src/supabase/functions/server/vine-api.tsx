import { Context } from "npm:hono";
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

interface UserPresence {
  userId: string;
  currentRoomIndex: number;
  lastUpdated: number;
}

const PRESENCE_TTL = 10000;
const PRESENCE_CLEANUP_INTERVAL = 30000;

const app = new Hono();

app.post("/make-server-f1a393b4/vine/presence", async (c: Context) => {
  try {
    const { userId, currentRoomIndex } = await c.req.json();

    if (!userId || currentRoomIndex === undefined) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    const presence: UserPresence = {
      userId,
      currentRoomIndex,
      lastUpdated: Date.now(),
    };

    await kv.set(`presence:${userId}`, presence);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating user presence:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-f1a393b4/vine/presences", async (c: Context) => {
  try {
    const presences = await kv.getByPrefix("presence:");
    const now = Date.now();
    
    const activePresences = presences
      .filter((p: UserPresence) => now - p.lastUpdated < PRESENCE_TTL)
      .map((p: UserPresence) => ({
        userId: p.userId,
        currentRoomIndex: p.currentRoomIndex,
        lastUpdated: p.lastUpdated,
      }));

    return c.json({ success: true, data: activePresences });
  } catch (error) {
    console.error("Error getting active presences:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

export async function cleanupStalePresences() {
  try {
    const presences = await kv.getByPrefix("presence:");
    const now = Date.now();
    
    const staleKeys = presences
      .filter((p: UserPresence) => now - p.lastUpdated >= PRESENCE_CLEANUP_INTERVAL)
      .map((p: UserPresence) => `presence:${p.userId}`);

    if (staleKeys.length > 0) {
      await kv.mdel(staleKeys);
      console.log(`Cleaned up ${staleKeys.length} stale presences`);
    }
  } catch (error) {
    console.error("Error cleaning up stale presences:", error);
  }
}

export { app as vineApi };