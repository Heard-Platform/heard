import { getUserMemberships } from "./membership-utils.tsx";
import { normalizeCommunityName } from "./utils.tsx";
import { getActiveRooms } from "./debate-api.tsx";
import { getUserSession } from "./auth-api.tsx";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "./constants.tsx";
import { getCommunities, getCommunity, saveCommunity, deleteMembership, getMembership, saveMembership, saveModInvite, getModInvite, deleteModInvite } from "./kv-utils.tsx";
import { Community, CommunityMembership } from "./types.tsx";
import { ONE_DAY_MS } from "./time-utils.ts";
import { insertAnalyticsEvent } from "./model-utils.ts";
import { defineRoute } from "./route-wrapper.tsx";
import { performSubHeardRename } from "./subheard-rename-utils.tsx";

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

app.get("/make-server-f1a393b4/subheards", async (c: Context) => {
  try {
    const userId = c.get("userId");
    const onlyJoined = c.req.query("onlyJoined") === "true";

    let userMemberships: Set<string> = new Set();
    userMemberships = await getUserMemberships(userId);

    let subHeards = await getCommunities();

    subHeards = subHeards.filter((comm) => {
      if (onlyJoined) {
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

app.get("/make-server-f1a393b4/subheards/explorable", async (c: Context) => {
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
  async (c: Context) => {
    try {
      const userId = c.get("userId");
      const { community } = await c.req.json();

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

      const normalized = normalizeCommunityName(name);

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
// Auto-join on visit - no access token validation needed
// Private sub-heards just need you to know the link
app.post(
  "/make-server-f1a393b4/subheard/:name/join",
  async (c: Context) => {
    try {
      const userId = c.get("userId");
      const name = c.req.param("name") as string;

      const community = await getCommunity(name);

      if (!community) {
        return c.json({ error: "Sub-heard not found" }, 404);
      }

      const existingMembership = await getMembership(userId, name);
      if (existingMembership) {
        return c.json({
          success: true,
        });
      }

      const newMembership: CommunityMembership = {
        userId,
        subHeard: name,
        joinedAt: Date.now(),
      };
      await saveMembership(newMembership);

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
      const userId = c.get("userId");
      const name = c.req.param("name") as string;
      const { settings } = await c.req.json();

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

      const isModerator =
        community.adminId === userId ||
        !!community.modIds?.includes(userId);

      if (!isModerator) {
        return c.json({ error: "Only moderators can modify sub-heard settings" }, 403);
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
  async (c: Context) => {
    try {
      const userId = c.get("userId");
      const name = c.req.param("name") as string;

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

// Remove all moderators (admin only)
app.delete(
  "/make-server-f1a393b4/subheard/:name/mods",
  defineRoute(
    {},
    async (_params, c) => {
      const userId = c.get("userId");
      const name = c.req.param("name") as string;

      const community = await getCommunity(name);
      if (!community) throw new Error("Community not found");

      const user = await getUserSession(userId);
      if (!user?.isDeveloper && community.adminId !== userId) {
        throw new Error("Only the admin can remove moderators");
      }

      await saveCommunity({ ...community, modIds: [] });

      return {};
    },
    "Failed to remove moderators",
  ),
);

app.patch(
  "/make-server-f1a393b4/subheard/:name/rename",
  defineRoute(
    { newName: { type: "string", required: true } },
    async ({ newName }: { newName: string }, c) => {
      const userId = c.get("userId");
      const name = c.req.param("name") as string;

      const community = await getCommunity(name);
      if (!community) throw new Error("Community not found");

      const user = await getUserSession(userId);
      if (!user?.isDeveloper && community.adminId !== userId) {
        throw new Error("Only the admin can rename this community");
      }

      return performSubHeardRename(name, newName);
    },
    "Failed to rename sub-heard",
  ),
);

// Create a mod invite link (admin only)
app.post(
  "/make-server-f1a393b4/subheard/:name/mod-invite",
  defineRoute(
    {},
    async (_params, c) => {
      const userId = c.get("userId");
      const name = c.req.param("name") as string;

      const community = await getCommunity(name);
      if (!community) throw new Error("Community not found");

      const user = await getUserSession(userId);
      if (!user?.isDeveloper && community.adminId !== userId) {
        throw new Error("Only the admin can create mod invites");
      }

      const token = crypto.randomUUID();
      await saveModInvite(token, {
        subHeardName: name,
        createdBy: userId,
        expiresAt: Date.now() + ONE_DAY_MS,
      });

      return { token };
    },
    "Failed to create mod invite",
  ),
);

// Accept a mod invite
app.post(
  "/make-server-f1a393b4/subheard/:name/mod-invite/accept",
  defineRoute(
    { token: { type: "string", required: true } },
    async ({ token }: { token: string }, c) => {
      const userId = c.get("userId");
      const name = c.req.param("name") as string;

      const user = await getUserSession(userId);
      if (!user) throw new Error("User not found");
      if (user.isAnonymous) throw new Error(ANONYMOUS_ACTION_NOT_ALLOWED_ERROR);

      const invite = await getModInvite(token);
      if (!invite) throw new Error("Invalid or expired invite link");
      if (invite.subHeardName !== name) throw new Error("Invite does not match this community");

      if (Date.now() > invite.expiresAt) {
        await deleteModInvite(token);
        throw new Error("Invite link has expired");
      }

      await deleteModInvite(token);

      const community = await getCommunity(name);
      if (!community) throw new Error("Community not found");
      if (community.adminId === userId) return {};

      const modIds = community.modIds ?? [];
      if (!modIds.includes(userId)) {
        modIds.push(userId);
        await saveCommunity({ ...community, modIds });
      }

      await insertAnalyticsEvent({ type: "mod_invite_accepted", userId, roomId: name });

      return {};
    },
    "Failed to accept mod invite",
  ),
);

export { app as subheardApi };