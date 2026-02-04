import * as kv from "./kv_store.tsx";
import { getUserMemberships } from "./membership-utils.tsx";
import { getActiveRooms } from "./debate-api.tsx";
import { getUserSession } from "./auth-api.tsx";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "./constants.tsx";
import { getCommunities, getCommunity, saveCommunity } from "./kv-utils.tsx";
import { Community } from "./types.tsx";

// @ts-ignore
import { Context, Hono } from "npm:hono";

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

    let subHeards = await getCommunities();

    subHeards = subHeards
      .filter((comm) => {
        if (!comm.isPrivate) return true;
        if (userId && comm.adminId === userId) return true;
        if (userId && userMemberships.has(comm.name))
          return true;
        return false;
      })
      .map((comm) => {
        const count = roomCounts[comm.name] || 0;

        return {
          ...comm,
          count,
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

      const user = await getUserSession(userId);
      if (!user) {
        return c.json({ error: "User session not found" }, 404);
      }

      if (user.isAnonymous) {
        return c.json(
          {
            error: ANONYMOUS_ACTION_NOT_ALLOWED_ERROR,
            message: "Anonymous users cannot create communities",
          },
          403,
        );
      }

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
  async (c: Context) => {
    try {
      const name = c.req.param("name");
      const { userId, update } = await c.req.json();

      if (!userId || typeof userId !== "string") {
        return c.json({ error: "User ID is required" }, 400);
      }

      if (!update || typeof update !== "object") {
        return c.json(
          { error: "Update data is required" },
          400,
        );
      }

      const community = await getCommunity(name);

      if (!community) {
        return c.json({ error: "Community not found" }, 404);
      }

      // Verify user is admin
      if (community.adminId !== userId) {
        return c.json(
          {
            error:
              "Only the admin can modify sub-heard settings",
          },
          403,
        );
      }

      const updatedCommunity = { ...community, ...update};

      await saveCommunity(updatedCommunity);

      return c.json<{ success: boolean; subHeard: Community }>(
        {
          success: true,
          subHeard: updatedCommunity,
        },
      );
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