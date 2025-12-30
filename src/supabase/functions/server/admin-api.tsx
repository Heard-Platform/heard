// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getActiveRooms } from "./debate-api.tsx";
import { getAllRealDebates, getAllRealUsers, getAllStatements, getAllSubHeards, getByPrefixParsed, getDebate, saveDebate } from "./kv-utils.tsx";
import { getVotesForUser, getUserActivityRecords } from "./kv-utils.tsx";
import { DebateRoom, Rant, Statement } from "./types.tsx";

const app = new Hono();

// Middleware to verify admin key
const verifyAdminKey = async (c: any, next: any) => {
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

// Apply middleware to all admin routes
app.use("/make-server-f1a393b4/admin/*", verifyAdminKey);

// Get all users
app.get("/make-server-f1a393b4/admin/users", async (c) => {
  try {
    let users = await getAllRealUsers();
    users = users.map(({passwordHash, ...rest}) => rest);
    users.sort((a, b) => b.lastActive - a.lastActive);
    return c.json({ users });
  } catch (error) {
    console.error("Error fetching all users for admin:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
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
      return c.json(
        { error: "Failed to update sub-heard admin" },
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

      // Normalize the new name (lowercase, replace spaces with hyphens)
      const normalizedNewName = newName.trim().toLowerCase().replace(/\s+/g, '-');

      if (normalizedNewName.length < 2) {
        return c.json({ error: "Sub-heard name must be at least 2 characters" }, 400);
      }

      // Check if new name already exists
      const newSubHeardKey = `subheard:${normalizedNewName}`;
      const existingNewData = await kv.get(newSubHeardKey);
      if (existingNewData) {
        return c.json({ error: "A sub-heard with that name already exists" }, 409);
      }

      // Get existing sub-heard data
      const oldSubHeardKey = `subheard:${oldName}`;
      const existingData = await kv.get(oldSubHeardKey);

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

      // Update the name
      subHeardData.name = normalizedNewName;
      subHeardData.renamedAt = Date.now();
      subHeardData.previousName = oldName;

      // Save under new key
      await kv.set(newSubHeardKey, JSON.stringify(subHeardData));
      
      // Delete old key
      await kv.del(oldSubHeardKey);

      // Update all memberships
      const memberships = await kv.getByPrefix("subheard_member:");
      let updatedMemberships = 0;
      
      for (const membershipData of memberships) {
        try {
          const membership = typeof membershipData === "string" 
            ? JSON.parse(membershipData) 
            : membershipData;
          
          if (membership.subHeard === oldName) {
            // Delete old membership key
            const oldMembershipKey = `subheard_member:${membership.userId}:${oldName}`;
            await kv.del(oldMembershipKey);
            
            // Create new membership key
            const newMembershipKey = `subheard_member:${membership.userId}:${normalizedNewName}`;
            membership.subHeard = normalizedNewName;
            await kv.set(newMembershipKey, JSON.stringify(membership));
            
            updatedMemberships++;
          }
        } catch (error) {
          console.error("Error updating membership:", error);
        }
      }

      // Update all active rooms
      const rooms = await getActiveRooms();
      let updatedRooms = 0;
      
      for (const room of rooms) {
        try {
          if (room.subHeard === oldName) {
            room.subHeard = normalizedNewName;
            // Update the main room record
            await kv.set(`room:${room.id}`, JSON.stringify(room));
            updatedRooms++;
          }
        } catch (error) {
          console.error("Error updating room:", error);
        }
      }

      console.log(`Renamed sub-heard from "${oldName}" to "${normalizedNewName}"`);
      console.log(`Updated ${updatedMemberships} memberships and ${updatedRooms} rooms`);

      return c.json({
        success: true,
        oldName,
        newName: normalizedNewName,
        updatedMemberships,
        updatedRooms,
      });
    } catch (error) {
      console.error("Error renaming sub-heard:", error);
      return c.json(
        { error: "Failed to rename sub-heard" },
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
            await kv.set(`room:${room.id}`, JSON.stringify(room));
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

export { app as adminApi };