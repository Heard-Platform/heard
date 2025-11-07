// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { generateAccessToken } from "./subheard-api.tsx";
import { getActiveRooms } from "./debate-api.tsx";

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
    const userKeys = await kv.getByPrefix("user:");

    const users = userKeys
      .map((userData) => {
        try {
          // Check if it's already an object or needs parsing
          const user =
            typeof userData === "string"
              ? JSON.parse(userData)
              : userData;

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

// Get all subheards (including private ones with access tokens)
app.get("/make-server-f1a393b4/admin/subheards", async (c) => {
  try {
    const createdSubHeards = await kv.getByPrefix("subheard:");

    const subHeards = createdSubHeards
      .map((sh) => {
        try {
          // Check if it's already an object or needs parsing
          const data =
            typeof sh === "string" ? JSON.parse(sh) : sh;
          // Return full data including access tokens (this is admin endpoint)
          return {
            name: data.name,
            createdAt: data.createdAt,
            isPrivate: data.isPrivate || false,
            adminId: data.adminId,
            accessToken: data.accessToken,
          };
        } catch (error) {
          return null;
        }
      })
      .filter((sh) => sh !== null);

    // Sort by creation date
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
    const rooms = await getActiveRooms();

    const debates = rooms
      .map((room) => {
        try {
          return {
            id: room.id,
            topic: room.topic,
            subHeard: room.subHeard || null,
            isActive: room.isActive,
            createdAt: room.createdAt,
            participants: room.participants?.length || 0,
            phase: room.phase,
            mode: room.mode,
            rantFirst: room.rantFirst || false,
          };
        } catch (error) {
          return null;
        }
      })
      .filter((debate) => debate !== null);

    // Sort by creation date (newest first)
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

      // Get existing debate data from main room record
      const roomKey = `room:${debateId}`;
      const existingData = await kv.get(roomKey);

      if (!existingData) {
        return c.json({ error: "Debate not found" }, 404);
      }

      let debateData;
      try {
        debateData = JSON.parse(existingData);
      } catch (error) {
        console.error("Error parsing debate data:", error);
        return c.json({ error: "Invalid debate data" }, 500);
      }

      // Toggle active status
      debateData.isActive = !debateData.isActive;

      // Save updated data to main room record
      await kv.set(roomKey, JSON.stringify(debateData));
      
      // Update active_room pointer
      if (debateData.isActive) {
        await kv.set(`active_room:${debateId}`, debateId);
      } else {
        await kv.del(`active_room:${debateId}`);
      }

      return c.json({
        success: true,
        debate: {
          id: debateData.id,
          topic: debateData.topic,
          isActive: debateData.isActive,
        },
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

// Backfill access tokens for private sub-heards without one
app.post(
  "/make-server-f1a393b4/admin/backfill-tokens",
  async (c) => {
    try {
      const createdSubHeards =
        await kv.getByPrefix("subheard:");

      let backfilledCount = 0;
      const backfilledSubHeards: string[] = [];

      for (const sh of createdSubHeards) {
        try {
          const data =
            typeof sh === "string" ? JSON.parse(sh) : sh;

          // Check if it's private and missing an access token
          if (data.isPrivate && !data.accessToken) {
            const accessToken = generateAccessToken();
            data.accessToken = accessToken;

            const subHeardKey = `subheard:${data.name}`;
            await kv.set(subHeardKey, JSON.stringify(data));

            backfilledCount++;
            backfilledSubHeards.push(data.name);
            console.log(
              `Backfilled access token for sub-heard: ${data.name}`,
            );
          }
        } catch (error) {
          console.error(
            "Error processing sub-heard during backfill:",
            error,
          );
        }
      }

      return c.json({
        success: true,
        backfilledCount,
        subHeards: backfilledSubHeards,
        message: `Successfully backfilled ${backfilledCount} sub-heard(s)`,
      });
    } catch (error) {
      console.error("Error backfilling access tokens:", error);
      return c.json(
        { error: "Failed to backfill access tokens" },
        500,
      );
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