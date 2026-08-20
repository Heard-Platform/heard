import { sanitizeUser } from "./user-utils.ts";
import { getActiveRooms } from "./debate-api.tsx";
import {
  getAllRealDebates,
  getAllRealUsers,
  getAllStatements,
  getAllVotes,
  getAllSubHeards,
  getByPrefixParsed,
  getDebate,
  getUser,
  saveDebate, deletePhone,
  getCommunity,
  saveCommunity,
  getAllActivityRecords,
  getVotesForUser,
  getUserActivityRecords,
  saveUser,
  saveNewsletterSentUsers,
} from "./kv-utils.tsx";
import { DebateRoom, Rant, Statement, User } from "./types.tsx";
import { migrateAllUsersToSupabase } from "./migrate-users-to-supabase.tsx";
import { getNewsletterByEdition, getNewsletterRecipients } from "./newsletter-utils.ts";
import { getFlyerEmails } from "./model-utils.ts";
import { buildActiveDaysMap } from "./stats-utils.ts";
import { performSubHeardRename } from "./subheard-rename-utils.tsx";

// @ts-ignore
import { Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";

const app = new Hono();

export const verifyAdminKey = async (c: any, next: any) => {
  const adminKey = c.req.header("X-Admin-Key");
  const validKey = Deno.env.get("DEV_ADMIN_KEY");

  if (!adminKey || !validKey || adminKey !== validKey) {
    return c.json(
      { error: "Unauthorized - Invalid admin key" },
      401,
    );
  }

  await next();
};

app.use("/make-server-f1a393b4/admin/*", verifyAdminKey);

// Get all users
app.get("/make-server-f1a393b4/admin/users", async (c) => {
  try {
    const [rawUsers, allVotes, allStatements] = await Promise.all([
      getAllRealUsers(),
      getAllVotes(),
      getAllStatements(),
    ]);
    const activeDaysMap = buildActiveDaysMap(allVotes, allStatements);
    const activeDayCounts: Record<string, number> = {};
    for (const [userId, days] of activeDaysMap) {
      activeDayCounts[userId] = days.size;
    }
    const users = rawUsers.map(sanitizeUser).sort((a: any, b: any) => b.lastActive - a.lastActive);
    return c.json({ users, activeDayCounts });
  } catch (error) {
    console.error("Error fetching all users for admin:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

app.get("/make-server-f1a393b4/admin/newsletter-eligible-count", async (c) => {
  try {
    const edition = c.req.query("edition") || "1";
    const { eligibleUsers, alreadySent } =
      await getNewsletterRecipients(parseInt(edition), false, "");
    
    return c.json({ 
      eligible: eligibleUsers.length,
      alreadySent: alreadySent.length,
    });
  } catch (error) {
    console.error("Error fetching newsletter eligible count:", error);
    return c.json({ error: "Failed to fetch count" }, 500);
  }
});

// Get all subheards (including private ones)
app.get("/make-server-f1a393b4/admin/subheards", async (c) => {
  try {
    const subHeards = await getAllSubHeards();
    subHeards.sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
    );
    return c.json({ subHeards });
  } catch (error) {
    console.error("Error fetching sub-heards:", error);
    return c.json({ error: "Failed to fetch sub-heards" }, 500);
  }
});

// Update subheard admin
app.patch(
  "/make-server-f1a393b4/admin/subheard/:name/admin",
  async (c) => {
    try {
      const name = c.req.param("name");
      const { newAdminId } = await c.req.json();

      if (!newAdminId || typeof newAdminId !== "string") {
        return c.json(
          { error: "New admin user ID is required" },
          400,
        );
      }

      // Get existing sub-heard data
      const subHeardKey = `subheard:${name}`;
      const subheard = await getCommunity(name);

      if (!subheard) {
        return c.json({ error: "Sub-heard not found" }, 404);
      }

      // Update admin
      const oldAdminId = subheard.adminId;
      subheard.adminId = newAdminId;

      // Save updated data
      await saveCommunity(subheard);

      return c.json({
        success: true,
        subHeard: {
          ...subheard,
          oldAdminId,
        },
      });
    } catch (error) {
      console.error("Error updating sub-heard admin:", error);
      return c.json(
        { error: "Failed to update sub-heard admin" },
        500,
      );
    }
  },
);

// Update subheard
app.patch(
  "/make-server-f1a393b4/admin/subheard/:name/update",
  async (c) => {
    try {
      const name = c.req.param("name");
      const { update } = await c.req.json();

      if (!update || typeof update !== "object") {
        return c.json(
          { error: "update object is required" },
          400,
        );
      }

      const community = await getCommunity(name);

      if (!community) {
        return c.json({ error: "Community not found" }, 404);
      }

      Object.assign(community, update);
      await saveCommunity(community);

      return c.json({
        success: true,
        subHeard: community,
      });
    } catch (error) {
      console.error(
        "Error updating community:",
        error,
      );
      return c.json(
        { error: "Failed to update community" },
        500,
      );
    }
  },
);

// Rename a sub-heard (updates sub-heard, memberships, and active rooms)
app.patch(
  "/make-server-f1a393b4/admin/subheard/:name/rename",
  async (c) => {
    try {
      const oldName = c.req.param("name");
      const { newName } = await c.req.json();

      if (!newName || typeof newName !== "string") {
        return c.json({ error: "New sub-heard name is required" }, 400);
      }

      const result = await performSubHeardRename(oldName, newName);

      return c.json({
        success: true,
        oldName,
        newName: result.newName,
        updatedMemberships: result.updatedMemberships,
        updatedRooms: result.updatedRooms,
      });
    } catch (error) {
      console.error("Error renaming sub-heard:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "Failed to rename sub-heard" },
        500,
      );
    }
  },
);

// Get all debates (rooms) with their active status
app.get("/make-server-f1a393b4/admin/debates", async (c) => {
  try {
    const debates = await getActiveRooms();
    debates.sort((a, b) => b.createdAt - a.createdAt);
    return c.json({ debates });
  } catch (error) {
    console.error("Error fetching debates:", error);
    return c.json({ error: "Failed to fetch debates" }, 500);
  }
});

// Toggle debate active status
app.patch(
  "/make-server-f1a393b4/admin/debate/:id/toggle-active",
  async (c) => {
    try {
      const debateId = c.req.param("id");

      const debate = await getDebate(debateId);

      if (!debate) {
        return c.json({ error: "Debate not found" }, 404);
      }

      debate.isActive = !debate.isActive;

      await saveDebate(debate);

      return c.json({
        success: true,
        debate,
      });
    } catch (error) {
      console.error("Error toggling debate status:", error);
      return c.json(
        { error: "Failed to toggle debate status" },
        500,
      );
    }
  },
);

// Update debate subHeard
app.patch(
  "/make-server-f1a393b4/admin/debate/:id/subheard",
  async (c) => {
    try {
      const debateId = c.req.param("id");
      const { newSubHeard } = await c.req.json();

      const debate = await getDebate(debateId);
      if (!debate) {
        return c.json({ error: "Debate not found" }, 404);
      }

      debate.subHeard = newSubHeard || null;

      await saveDebate(debate);

      return c.json({
        success: true,
        debate,
      });
    } catch (error) {
      console.error("Error updating debate subheard:", error);
      return c.json(
        { error: "Failed to update debate subheard" },
        500,
      );
    }
  },
);

const ADMIN_EDITABLE_USER_FIELDS = [
  "isDeveloper",
  "isTestUser",
  "isUnsubbedFromUpdates",
] as const satisfies readonly (keyof User)[];

type AdminEditableUserField = typeof ADMIN_EDITABLE_USER_FIELDS[number];

app.patch(
  "/make-server-f1a393b4/admin/user/:userId",
  defineRoute(
    {
      userId: { type: "string", required: true },
      updates: { type: "object", required: true },
    },
    async ({ userId, updates }: { userId: string; updates: Record<string, unknown> }) => {
      const user = await getUser(userId);
      if (!user) throw new Error("User not found");

      for (const [field, value] of Object.entries(updates)) {
        if (!ADMIN_EDITABLE_USER_FIELDS.includes(field as AdminEditableUserField)) {
          throw new Error(`Field "${field}" is not editable via this endpoint`);
        }
        if (typeof value !== "boolean") {
          throw new Error(`Field "${field}" must be a boolean`);
        }
        user[field as AdminEditableUserField] = value;
      }

      await saveUser(user);

      return { user };
    },
    "Failed to update user",
  ),
);

app.delete(
  "/make-server-f1a393b4/admin/user/:userId/clear-phone",
  async (c) => {
    try {
      const userId = c.req.param("userId");

      const user = await getUser(userId);

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      const phoneNumber = user.phoneNumber;

      user.phoneNumber = undefined;
      user.phoneVerified = false;
      user.phoneVerifiedAt = undefined;

      await saveUser(user);

      if (phoneNumber) {
        await deletePhone(phoneNumber);
      }

      return c.json({
        success: true,
        user: user,
      });
    } catch (error) {
      console.error("Error clearing phone verification:", error);
      return c.json(
        { error: "Failed to clear phone verification" },
        500,
      );
    }
  },
);

app.get(
  "/make-server-f1a393b4/admin/user-history/:userId",
  async (c) => {
    try {
      const userId = c.req.param("userId");

      const rooms: DebateRoom[] = [];
      const statements: Statement[] = [];
      const rants: Rant[] = [];

      const allRooms = await getAllRealDebates();
      for (const room of allRooms) {
        if (room.participants.includes(userId) || room.hostId === userId) {
          rooms.push(room);
        }

        if (room.hostId === userId) {
          const rants = await getByPrefixParsed<Rant>(`rant:${room.id}:`);
          if (rants.length) {
            rants.push(rants[0]);
          }
        }
      }

      const allStatements = await getAllStatements();
      for (const statement of allStatements) {
        if (statement.author === userId) {
          statements.push(statement);
        }
      }

      const votes = await getVotesForUser(userId);
      const activities = await getUserActivityRecords(userId);

      rooms.sort((a, b) => b.createdAt - a.createdAt);
      statements.sort((a, b) => b.timestamp - a.timestamp);
      votes.sort((a, b) => b.timestamp - a.timestamp);
      rants.sort((a, b) => b.timestamp - a.timestamp);
      activities.sort((a: any, b: any) => b.timestamp - a.timestamp);

      return c.json({
        userId,
        rooms,
        statements,
        votes,
        rants,
        activities,
      });
    } catch (error) {
      console.error("Error fetching user history:", error);
      return c.json({ error: "Failed to fetch user history" }, 500);
    }
  },
);

// Data Fixes - One-time operations to fix database issues
// These are idempotent and can be run multiple times safely

// Fix: Update "Dupont Circle Neighborhoods" to "dupont-circle-neighborhoods"
app.post(
  "/make-server-f1a393b4/admin/data-fix/normalize-dupont-circle",
  async (c) => {
    try {
      const oldName = "Dupont Circle Neighborhoods";
      const normalizedName = "dupont-circle-neighborhoods";
      
      // Get all active rooms
      const rooms = await getActiveRooms();
      let updatedRooms = 0;
      const updatedRoomIds: string[] = [];
      
      for (const room of rooms) {
        try {
          if (room.subHeard === oldName) {
            room.subHeard = normalizedName;
            // Update the main room record
            await saveDebate(room);
            updatedRooms++;
            updatedRoomIds.push(room.id);
            console.log(`Updated room ${room.id} subheard from "${oldName}" to "${normalizedName}"`);
          }
        } catch (error) {
          console.error("Error updating room:", error);
        }
      }

      return c.json({
        success: true,
        updatedRooms,
        roomIds: updatedRoomIds,
        message: `Successfully updated ${updatedRooms} room(s) from "${oldName}" to "${normalizedName}"`,
      });
    } catch (error) {
      console.error("Error running data fix:", error);
      return c.json(
        { error: "Failed to run data fix" },
        500,
      );
    }
  },
);

// Migrate all users to Supabase
app.post(
  "/make-server-f1a393b4/admin/migrate-users-to-supabase",
  async (c) => {
    try {
      const body = await c.req.json();
      const dryRun = body.dryRun === true;
      const result = await migrateAllUsersToSupabase(dryRun);
      return c.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error("Error migrating users to Supabase:", error);
      return c.json(
        { error: "Failed to migrate users to Supabase" },
        500,
      );
    }
  },
);

app.post(
  "/make-server-f1a393b4/admin/send-newsletter",
  async (c) => {
    try {
      const { testMode, testEmail, newsletterEdition } = await c.req.json();

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        return c.json(
          { error: "RESEND_API_KEY not configured" },
          500,
        );
      }

      const { eligibleUsers, alreadySent } = await getNewsletterRecipients(newsletterEdition, testMode, testEmail);
      console.log(`Already sent to ${alreadySent.length} users`);

      console.log(`Sending to ${eligibleUsers.length} recipients`);

      let sent = 0;
      let failed = 0;
      const newlySent: string[] = [];

      const { subject, html } = await getNewsletterByEdition(newsletterEdition);

      for (const user of eligibleUsers) {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Alex @ Heard <hello@heard-now.com>",
              to: [user.email],
              subject: `${testMode ? "[TEST] " : ""}${subject}`,
              html,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to send to ${user.email}: ${errorText}`);
            failed++;
          } else {
            console.log(`Successfully sent to ${user.email}`);
            sent++;
            newlySent.push(user.id);
            const sentUsers = [...alreadySent, ...newlySent];
            await saveNewsletterSentUsers(newsletterEdition, sentUsers);
          }
        } catch (error) {
          console.error(`Error sending to ${user.email}:`, error);
          failed++;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`Newsletter batch complete: ${sent} sent, ${failed} failed`);

      return c.json({
        success: true,
        sent,
        failed,
        total: eligibleUsers.length,
        skipped: alreadySent.length,
      });
    } catch (error) {
      console.error("Error sending newsletter:", error);
      return c.json(
        { error: "Failed to send newsletter" },
        500,
      );
    }
  },
);

app.get("/make-server-f1a393b4/admin/flyer-emails", async (c) => {
  try {
    const emails = await getFlyerEmails();
    return c.json({ emails });
  } catch (error) {
    console.error("Error fetching flyer emails:", error);
    return c.json({ error: "Failed to fetch flyer emails" }, 500);
  }
});

app.get("/make-server-f1a393b4/admin/power-users", async (c) => {
  try {
    const allUsers = await getAllRealUsers();
    const allActivities = await getAllActivityRecords();

    const userActivityMap = new Map<string, Set<string>>();

    for (const activity of allActivities) {
      if (!userActivityMap.has(activity.userId)) {
        userActivityMap.set(activity.userId, new Set());
      }
      userActivityMap.get(activity.userId)!.add(activity.date);
    }

    const powerUsers = allUsers
      .map(user => ({
        user: sanitizeUser(user),
        uniqueDays: userActivityMap.get(user.id)?.size || 0,
      }))
      .filter(pu => pu.uniqueDays > 0)
      .sort((a, b) => b.uniqueDays - a.uniqueDays);

    return c.json({ powerUsers });
  } catch (error) {
    console.error("Error fetching power users:", error);
    return c.json({ error: "Failed to fetch power users" }, 500);
  }
});

app.get(
  "/make-server-f1a393b4/newsletter/:edition",
  defineRoute(
    {
      edition: {
        required: true,
        type: "string",
        validate: (v) => {
          const editionInt = parseInt(v);
          return !isNaN(editionInt) && editionInt > 0;
        },
      },
    },
    async ({ edition }: { edition: string }) => {
      const editionInt = parseInt(edition);
      const { html } = await getNewsletterByEdition(editionInt);

      return { html };
    },
    "Failed to fetch newsletter",
  ),
);

export { app as adminApi };