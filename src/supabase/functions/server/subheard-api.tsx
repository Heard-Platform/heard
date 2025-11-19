// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getUserMemberships } from "./membership-utils.tsx";
import { getActiveRooms } from "./debate-api.tsx";

const app = new Hono();

app.get("/make-server-f1a393b4/subheards", async (c: any) => {
  try {
    const userId = c.req.query("userId"); // Optional: if provided, show private sub-heards where user is admin or member

    // Get all active rooms using helper function
    const allRooms = await getActiveRooms();
    const rooms = allRooms.filter((r) => r.subHeard);

    const roomCounts: { [key: string]: number } = {};
    rooms.forEach((room) => {
      if (room.subHeard) {
        roomCounts[room.subHeard] =
          (roomCounts[room.subHeard] || 0) + 1;
      }
    });

    let userMemberships: Set<string> = new Set();
    if (userId) {
      userMemberships = await getUserMemberships(userId);
    }

    const subheardJsons = await kv.getByPrefix("subheard:");

    let subHeards: Array<{
      name: string;
      isPrivate: boolean;
      adminId?: string;
    }> = [];

    subheardJsons.forEach((sh) => {
      try {
        const data = JSON.parse(sh);
        if (data.name) {
          subHeards.push({
            name: data.name,
            isPrivate: data.isPrivate || false,
            adminId: data.adminId,
          });
        }
      } catch (error) {
        console.error("Error parsing sub-heard:", sh, error);
      }
    });

    subHeards = subHeards
      // Filter out private sub-heards unless user is admin or member
      .filter((data) => {
        if (!data.isPrivate) return true; // Show if not private
        // Show if user is admin of this sub-heard
        if (userId && data.adminId === userId) return true;
        // Show if user is a member
        if (userId && userMemberships.has(data.name))
          return true;
        return false;
      })
      .map((data) => {
        const count = roomCounts[data.name] || 0;

        return {
          name: data.name,
          count,
          isPrivate: data.isPrivate,
          adminId: data.adminId,
        };
      });

    subHeards.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    return c.json({ subHeards });
  } catch (error) {
    console.error("Error fetching sub-heards:", error);
    return c.json({ error: "Failed to fetch sub-heards" }, 500);
  }
});

// Create a new sub-heard
app.post(
  "/make-server-f1a393b4/subheard/create",
  async (c: any) => {
    try {
      const { name, isPrivate, userId } = await c.req.json();

      if (!name || typeof name !== "string") {
        return c.json(
          { error: "Sub-heard name is required" },
          400,
        );
      }

      if (!userId || typeof userId !== "string") {
        return c.json({ error: "User ID is required" }, 400);
      }

      // Normalize the name (lowercase, replace spaces with hyphens)
      const normalized = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

      if (normalized.length < 2) {
        return c.json(
          {
            error:
              "Sub-heard name must be at least 2 characters",
          },
          400,
        );
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
        },
      });
    } catch (error) {
      console.error("Error creating sub-heard:", error);
      return c.json(
        { error: "Failed to create sub-heard" },
        500,
      );
    }
  },
);

// Join a sub-heard (become a member) - idempotent
// Auto-join on visit - no access token validation needed
// Private sub-heards just need you to know the link
app.post(
  "/make-server-f1a393b4/subheard/:name/join",
  async (c: any) => {
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

      // For public sub-heards, just return success (no membership needed)
      if (!subHeardData.isPrivate) {
        return c.json({
          success: true,
          subHeard: {
            name: subHeardData.name,
            isPrivate: false,
          },
        });
      }

      // For private sub-heards, auto-join by creating membership
      // No access token validation - if you have the link, you can join
      const membershipKey = `subheard_member:${userId}:${name}`;
      const membershipData = {
        userId,
        subHeard: name,
        joinedAt: Date.now(),
      };
      await kv.set(
        membershipKey,
        JSON.stringify(membershipData),
      );

      return c.json({
        success: true,
        subHeard: {
          name: subHeardData.name,
          isPrivate: true,
        },
      });
    } catch (error) {
      console.error("Error joining sub-heard:", error);
      return c.json({ error: "Failed to join sub-heard" }, 500);
    }
  },
);

// Update sub-heard settings (admin only)
app.patch(
  "/make-server-f1a393b4/subheard/:name/settings",
  async (c: any) => {
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
        return c.json(
          {
            error:
              "Only the admin can modify sub-heard settings",
          },
          403,
        );
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
        },
      });
    } catch (error) {
      console.error(
        "Error updating sub-heard settings:",
        error,
      );
      return c.json(
        { error: "Failed to update sub-heard settings" },
        500,
      );
    }
  },
);

export { app as subheardApi };