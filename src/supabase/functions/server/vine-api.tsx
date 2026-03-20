import { Context } from "npm:hono";
import { Hono } from "npm:hono";
import { UserPresence } from "./types.tsx";
import { getRecentPresences, updatePresence } from "./model-utils.ts";
import { getUser, saveUser } from "./kv-utils.tsx";
import { sanitizeUser } from "./user-utils.ts";

const PRESENCE_TTL = 10000;
const PRESENCE_CLEANUP_INTERVAL = 30000;

const app = new Hono();

app.post("/make-server-f1a393b4/vine/presence", async (c: Context) => {
  try {
    const { userId, currentRoomIndex, avatarAnimal } = await c.req.json();

    if (!userId || currentRoomIndex === undefined) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    await updatePresence(userId, currentRoomIndex, avatarAnimal || "monkey");

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

// Keep in sync with AVATAR_OPTIONS in src/utils/constants/avatars.ts
const VALID_AVATARS = ["monkey", "koala", "rhino", "elephant", "sloth", "panda"];

app.post("/make-server-f1a393b4/vine/avatar", async (c: Context) => {
  try {
    const userId = c.get("userId");
    if (!userId) {
      return c.json({ success: false, error: "Authentication required" }, 401);
    }

    const { avatarAnimal } = await c.req.json();

    if (!avatarAnimal || !VALID_AVATARS.includes(avatarAnimal)) {
      return c.json({ success: false, error: "Invalid avatar animal" }, 400);
    }

    const user = await getUser(userId);
    if (!user) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    if (user.isAnonymous) {
      return c.json({ success: false, error: "Logged-in account required to change avatar" }, 403);
    }

    user.avatarAnimal = avatarAnimal;
    await saveUser(user);

    return c.json({ success: true, data: { user: sanitizeUser(user) } });
  } catch (error) {
    console.error("Error updating avatar:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

export { app as vineApi };