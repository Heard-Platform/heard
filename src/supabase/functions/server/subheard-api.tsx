import * as kv from "./kv_store.tsx";
import { getUserMemberships } from "./membership-utils.tsx";
import { getActiveRooms } from "./debate-api.tsx";
import { getUserSession } from "./auth-api.tsx";
import { validateSession } from "./auth-utils.ts";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "./constants.tsx";
import { getCommunities, getCommunity, saveCommunity, deleteMembership } from "./kv-utils.tsx";
import { Community } from "./types.tsx";

// @ts-ignore
import { Context, Hono } from "npm:hono";

const app = new Hono();

async function addCountsAndSort(communities: Community[]) {
  const allRooms = await getActiveRooms();
  const rooms = allRooms.filter((r) => r.subHeard);
  
  const roomCounts: { [key: string]: number } = {};
  rooms.forEach((room) => {
    if (room.subHeard) {
      roomCounts[room.subHeard] = (roomCounts[room.subHeard] || 0) + 1;
    }
  });
  
  const withCounts = communities.map((comm) => ({
    ...comm,
    count: roomCounts[comm.name] || 0,
  }));
  
  withCounts.sort((a, b) => b.count - a.count);
  
  return withCounts;
}

app.get("/make-server-f1a393b4/subheards", async (c: any) => {
  try {
    const userId = c.req.query("userId");
    const onlyJoined = c.req.query("onlyJoined") === "true";

    let userMemberships: Set<string> = new Set();
    if (userId) {
      userMemberships = await getUserMemberships(userId);
    }

    let subHeards = await getCommunities();

    subHeards = subHeards.filter((comm) => {
      if (userId && onlyJoined) {
        if (comm.adminId === userId) return true;
        if (userMemberships.has(comm.name)) return true;
        return false;
      }
      
      if (!comm.isPrivate) return true;
      return false;
    });

    const result = await addCountsAndSort(subHeards);

    return c.json({ subHeards: result });
  } catch (error) {
    console.error("Error fetching sub-heards:", error);
    return c.json({ error: "Failed to fetch sub-heards" }, 500);
  }
});

app.get("/make-server-f1a393b4/subheards/explorable", async (c: any) => {
  try {
    const userId = c.get("userId");

    const userMemberships = await getUserMemberships(userId);
    let subHeards = await getCommunities();

    subHeards = subHeards.filter((comm) => {
      if (comm.isPrivate) return false;
      if (comm.adminId === userId) return false;
      if (userMemberships.has(comm.name)) return false;
      return true;
    });

    const result = await addCountsAndSort(subHeards);

    return c.json(result);
  } catch (error) {
    console.error("Error fetching explorable sub-heards:", error);
    return c.json({ error: "Failed to fetch explorable sub-heards" }, 500);
  }
});

// Create a new sub-heard
app.post(
  "/make-server-f1a393b4/subheard/create",
  async (c: any) => {
    try {
      const { community } = await c.req.json();
      const userId = c.get("userId");

      if (!community) {
        return c.json(
          { error: "Community data is required" },
          400,
        );
      }

      const { name, isPrivate, hostOnlyPosting } = community;

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

      const newCommunity = {
        name: normalized,
        createdAt: Date.now(),
        isPrivate: isPrivate || false,
        hostOnlyPosting: hostOnlyPosting || false,
        adminId: userId,
      };

      await saveCommunity(newCommunity);

      return c.json({
        success: true,
        subHeard: {
          ...newCommunity,
          count: 0,
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
// Private sub-heards just need you to know the link
app.post(
  "/make-server-f1a393b4/subheard/:name/join",
  async (c: any) => {
    try {
      const name = c.req.param("name");
      const userId = c.get("userId");

      const community = await getCommunity(name);

      if (!community) {
        return c.json({ error: "Sub-heard not found" }, 404);
      }

      const membershipKey = `subheard_member:${userId}:${name}`;
      
      const existingMembership = await kv.get(membershipKey);
      if (existingMembership) {
        return c.json({
          success: true,
        });
      }

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
      const { settings } = await c.req.json();
      const userId = c.get("userId");

      if (!settings || typeof settings !== "object") {
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

      const updatedCommunity = { ...community, ...settings};

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

app.delete(
  "/make-server-f1a393b4/subheard/:name/leave",
  async (c: any) => {
    try {
      const name = c.req.param("name");
      const userId = c.get("userId");

      const community = await getCommunity(name);

      if (!community) {
        return c.json({ error: "Community not found" }, 404);
      }

      if (community.adminId === userId) {
        return c.json(
          { error: "Admins cannot leave their own community" },
          403,
        );
      }

      await deleteMembership(userId, name);

      return c.json({ success: true });
    } catch (error) {
      console.error("Error leaving sub-heard:", error);
      return c.json({ error: "Failed to leave sub-heard" }, 500);
    }
  },
);

export { app as subheardApi };