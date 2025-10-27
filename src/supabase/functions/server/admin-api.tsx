// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Middleware to verify admin key
const verifyAdminKey = async (c: any, next: any) => {
  const adminKey = c.req.header("X-Admin-Key");
  const validKey = Deno.env.get("DEV_ADMIN_KEY");

  if (!adminKey || !validKey || adminKey !== validKey) {
    return c.json({ error: "Unauthorized - Invalid admin key" }, 401);
  }

  await next();
};

// Apply middleware to all admin routes
app.use("/make-server-f1a393b4/admin/*", verifyAdminKey);

// Get all users
app.get("/make-server-f1a393b4/admin/users", async (c) => {
  try {
    const userKeys = await kv.getByPrefix("user:");
    
    const users = userKeys
      .map((userData) => {
        try {
          // Check if it's already an object or needs parsing
          const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
          
          return {
            userId: user.id,
            name: user.nickname || user.name || "Unknown",
            lastSeen: user.lastActive || 0,
          };
        } catch (error) {
          return null;
        }
      })
      .filter((user) => user !== null);

    // Sort by most recent activity
    users.sort((a, b) => b.lastSeen - a.lastSeen);

    return c.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Get all subheards (including private ones)
app.get("/make-server-f1a393b4/admin/subheards", async (c) => {
  try {
    const createdSubHeards = await kv.getByPrefix("subheard:");
    
    const subHeards = createdSubHeards
      .map((sh) => {
        try {
          // Check if it's already an object or needs parsing
          if (typeof sh === 'string') {
            return JSON.parse(sh);
          } else {
            return sh;
          }
        } catch (error) {
          return null;
        }
      })
      .filter((sh) => sh !== null);

    // Sort by creation date
    subHeards.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return c.json({ subHeards });
  } catch (error) {
    console.error("Error fetching sub-heards:", error);
    return c.json({ error: "Failed to fetch sub-heards" }, 500);
  }
});

// Update subheard admin
app.patch("/make-server-f1a393b4/admin/subheard/:name/admin", async (c) => {
  try {
    const name = c.req.param("name");
    const { newAdminId } = await c.req.json();

    if (!newAdminId || typeof newAdminId !== "string") {
      return c.json({ error: "New admin user ID is required" }, 400);
    }

    // Get existing sub-heard data
    const subHeardKey = `subheard:${name}`;
    const existingData = await kv.get(subHeardKey);

    if (!existingData) {
      return c.json({ error: "Sub-heard not found" }, 404);
    }

    let subHeardData;
    try {
      subHeardData = JSON.parse(existingData);
    } catch (error) {
      console.error("Error parsing sub-heard data:", error);
      return c.json({ error: "Invalid sub-heard data" }, 500);
    }

    // Update admin
    const oldAdminId = subHeardData.adminId;
    subHeardData.adminId = newAdminId;
    subHeardData.adminUpdatedAt = Date.now();

    // Save updated data
    await kv.set(subHeardKey, JSON.stringify(subHeardData));

    return c.json({
      success: true,
      subHeard: {
        name: subHeardData.name,
        isPrivate: subHeardData.isPrivate,
        adminId: subHeardData.adminId,
        oldAdminId,
      },
    });
  } catch (error) {
    console.error("Error updating sub-heard admin:", error);
    return c.json({ error: "Failed to update sub-heard admin" }, 500);
  }
});

export { app as adminApi };
