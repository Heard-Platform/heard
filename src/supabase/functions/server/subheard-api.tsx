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
      accessToken?: string;
    }> = [];

    subheardJsons.forEach((sh) => {
      try {
        const data = JSON.parse(sh);
        if (data.name) {
          subHeards.push({
            name: data.name,
            isPrivate: data.isPrivate || false,
            adminId: data.adminId,
            accessToken: data.accessToken,
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
        const isAdmin = userId && data.adminId === userId;
        const count = roomCounts[data.name] || 0;

        return {
          name: data.name,
          count,
          isPrivate: data.isPrivate,
          adminId: data.adminId,
          // Only include access token if user is the admin
          accessToken: isAdmin ? data.accessToken : undefined,
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

// Helper function to generate a random access token
export const generateAccessToken = (): string => {
  // Generate a random 16-character alphanumeric token
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(
      Math.floor(Math.random() * chars.length),
    );
  }
  return token;
};

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

      // Generate access token for private sub-heards
      const accessToken = isPrivate
        ? generateAccessToken()
        : undefined;

      // Store the sub-heard in KV store
      const subHeardKey = `subheard:${normalized}`;
      const subHeardData = {
        name: normalized,
        createdAt: Date.now(),
        isPrivate: isPrivate || false,
        adminId: userId,
        accessToken,
      };

      await kv.set(subHeardKey, JSON.stringify(subHeardData));

      return c.json({
        success: true,
        subHeard: {
          name: normalized,
          count: 0,
          isPrivate: isPrivate || false,
          adminId: userId,
          accessToken,
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
// Only creates membership for private sub-heards
// Public sub-heards don't need memberships
app.post(
  "/make-server-f1a393b4/subheard/:name/join",
  async (c: any) => {
    try {
      const name = c.req.param("name");
      const { userId, accessToken } = await c.req.json();

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

      // For private sub-heards, check if user is admin
      const isAdmin = subHeardData.adminId === userId;

      // Admin doesn't need to validate access token or create membership
      if (isAdmin) {
        return c.json({
          success: true,
          subHeard: {
            name: subHeardData.name,
            isPrivate: true,
          },
        });
      }

      // For non-admin users, validate access token
      if (
        !accessToken ||
        accessToken !== subHeardData.accessToken
      ) {
        return c.json(
          {
            error: "Invalid access token for private sub-heard",
          },
          403,
        );
      }

      // Store membership for private sub-heards (non-admin users)
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

        // Generate access token if making private and doesn't have one
        if (isPrivate && !subHeardData.accessToken) {
          subHeardData.accessToken = generateAccessToken();
        }
        // Remove access token if making public
        if (!isPrivate) {
          subHeardData.accessToken = undefined;
        }
      }

      // Save updated data
      await kv.set(subHeardKey, JSON.stringify(subHeardData));

      return c.json({
        success: true,
        subHeard: {
          name: subHeardData.name,
          isPrivate: subHeardData.isPrivate,
          adminId: subHeardData.adminId,
          accessToken: subHeardData.accessToken,
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