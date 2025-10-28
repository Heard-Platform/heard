// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getUserMemberships } from "./membership-utils.tsx";

const app = new Hono();

// Get all unique sub-heards from active rooms and created sub-heards
app.get("/make-server-f1a393b4/subheards", async (c) => {
  try {
    const userId = c.req.query("userId"); // Optional: if provided, show private sub-heards where user is admin or member

    // Get active rooms with sub-heards
    const activeRooms = await kv.getByPrefix("active_room:");
    const rooms = activeRooms
      .map((r) => {
        try {
          return JSON.parse(r);
        } catch (error) {
          console.error("Error parsing active room:", r, error);
          return null;
        }
      })
      .filter((r) => r !== null && r.subHeard);

    // Get unique sub-heards with room counts
    const subHeardCounts: { [key: string]: number } = {};
    rooms.forEach((room) => {
      if (room.subHeard) {
        subHeardCounts[room.subHeard] = (subHeardCounts[room.subHeard] || 0) + 1;
      }
    });

    // Get created sub-heards (those without rooms will have count 0)
    const createdSubHeards = await kv.getByPrefix("subheard:");
    const subHeardData: { [name: string]: { isPrivate: boolean; adminId?: string } } = {};
    
    createdSubHeards.forEach((sh) => {
      try {
        const data = JSON.parse(sh);
        if (data.name) {
          // Store metadata for each sub-heard
          subHeardData[data.name] = {
            isPrivate: data.isPrivate || false,
            adminId: data.adminId,
          };
          
          if (!subHeardCounts[data.name]) {
            subHeardCounts[data.name] = 0;
          }
        }
      } catch (error) {
        console.error("Error parsing sub-heard:", sh, error);
      }
    });

    // Get user's memberships if userId is provided
    let userMemberships: Set<string> = new Set();
    if (userId) {
      userMemberships = await getUserMemberships(userId);
    }

    const subHeards = Object.entries(subHeardCounts)
      // Filter out private sub-heards unless user is admin or member
      .filter(([name]) => {
        const data = subHeardData[name];
        if (!data) return true; // Show if no data (shouldn't happen)
        if (!data.isPrivate) return true; // Show if not private
        // Show if user is admin of this sub-heard
        if (userId && data.adminId === userId) return true;
        // Show if user is a member
        if (userId && userMemberships.has(name)) return true;
        return false;
      })
      .map(([name, count]) => ({
        name,
        count,
        isPrivate: subHeardData[name]?.isPrivate || false,
        adminId: subHeardData[name]?.adminId,
      }));

    // Sort by count descending, then alphabetically
    subHeards.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });

    return c.json({ subHeards });
  } catch (error) {
    console.error("Error fetching sub-heards:", error);
    return c.json(
      { error: "Failed to fetch sub-heards" },
      500,
    );
  }
});

// Create a new sub-heard
app.post("/make-server-f1a393b4/subheard/create", async (c) => {
  try {
    const { name, isPrivate, userId } = await c.req.json();

    if (!name || typeof name !== "string") {
      return c.json({ error: "Sub-heard name is required" }, 400);
    }

    if (!userId || typeof userId !== "string") {
      return c.json({ error: "User ID is required" }, 400);
    }

    // Normalize the name (lowercase, replace spaces with hyphens)
    const normalized = name.trim().toLowerCase().replace(/\s+/g, '-');

    if (normalized.length < 2) {
      return c.json({ error: "Sub-heard name must be at least 2 characters" }, 400);
    }

    // Store the sub-heard in KV store
    const subHeardKey = `subheard:${normalized}`;
    const subHeardData = {
      name: normalized,
      createdAt: Date.now(),
      isPrivate: isPrivate || false,
      adminId: userId,
    };

    await kv.set(subHeardKey, JSON.stringify(subHeardData));

    return c.json({ 
      success: true, 
      subHeard: {
        name: normalized,
        count: 0,
        isPrivate: isPrivate || false,
        adminId: userId,
      }
    });
  } catch (error) {
    console.error("Error creating sub-heard:", error);
    return c.json(
      { error: "Failed to create sub-heard" },
      500,
    );
  }
});

// Join a sub-heard (become a member) - idempotent
app.post("/make-server-f1a393b4/subheard/:name/join", async (c) => {
  try {
    const name = c.req.param("name");
    const { userId } = await c.req.json();

    if (!userId || typeof userId !== "string") {
      return c.json({ error: "User ID is required" }, 400);
    }

    // Check if sub-heard exists
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

    // If user is admin, they don't need explicit membership
    const isAdmin = subHeardData.adminId === userId;
    
    if (!isAdmin) {
      // Store membership (idempotent - will overwrite if already exists)
      const membershipKey = `subheard_member:${userId}:${name}`;
      const membershipData = {
        userId,
        subHeard: name,
        joinedAt: Date.now(),
      };
      await kv.set(membershipKey, JSON.stringify(membershipData));
    }

    return c.json({ 
      success: true,
      subHeard: {
        name: subHeardData.name,
        isPrivate: subHeardData.isPrivate,
      }
    });
  } catch (error) {
    console.error("Error joining sub-heard:", error);
    return c.json(
      { error: "Failed to join sub-heard" },
      500,
    );
  }
});

// Update sub-heard settings (admin only)
app.patch("/make-server-f1a393b4/subheard/:name/settings", async (c) => {
  try {
    const name = c.req.param("name");
    const { userId, isPrivate } = await c.req.json();

    if (!userId || typeof userId !== "string") {
      return c.json({ error: "User ID is required" }, 400);
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

    // Verify user is admin
    if (subHeardData.adminId !== userId) {
      return c.json({ error: "Only the admin can modify sub-heard settings" }, 403);
    }

    // Update settings
    if (typeof isPrivate === "boolean") {
      subHeardData.isPrivate = isPrivate;
    }

    // Save updated data
    await kv.set(subHeardKey, JSON.stringify(subHeardData));

    return c.json({ 
      success: true, 
      subHeard: {
        name: subHeardData.name,
        isPrivate: subHeardData.isPrivate,
        adminId: subHeardData.adminId,
      }
    });
  } catch (error) {
    console.error("Error updating sub-heard settings:", error);
    return c.json(
      { error: "Failed to update sub-heard settings" },
      500,
    );
  }
});

export { app as subheardApi };
