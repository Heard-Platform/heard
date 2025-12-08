// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getByPrefixParsed } from "./kv-utils.tsx";
import { backfillUserCreatedAtApi } from "./backfill-user-created-at.tsx";

const app = new Hono();

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

app.use("/make-server-f1a393b4/one-time-fixes/*", verifyAdminKey);

app.post(
  "/make-server-f1a393b4/one-time-fixes/fix-active-room-pointers",
  async (c) => {
    try {
      const activeRoomKeys = await kv.getByPrefix("active_room:");
      let migratedCount = 0;
      let skippedCount = 0;
      const migratedRoomIds: string[] = [];

      for (const value of activeRoomKeys) {
        try {
          if (value.startsWith("{")) {
            const roomData = JSON.parse(value);
            const roomId = roomData.id;

            await kv.set(`room:${roomId}`, value);
            await kv.set(`active_room:${roomId}`, roomId);

            migratedCount++;
            migratedRoomIds.push(roomId);
            console.log(`Migrated active_room:${roomId} from JSON to pointer`);
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error("Error processing active_room record:", value, error);
        }
      }

      return c.json({
        success: true,
        migrated: migratedCount,
        skipped: skippedCount,
        migratedRoomIds,
        message: `Migrated ${migratedCount} active_room record(s), skipped ${skippedCount} already-migrated record(s)`,
      });
    } catch (error) {
      console.error("Error running active_room migration:", error);
      return c.json(
        { error: "Failed to run active_room migration" },
        500,
      );
    }
  },
);

app.post(
  "/make-server-f1a393b4/one-time-fixes/migrate-isactive-to-rooms",
  async (c) => {
    try {
      const allRooms = await getByPrefixParsed<any>("room:");
      let updatedCount = 0;
      let alreadyActiveCount = 0;
      const updatedRoomIds: string[] = [];

      console.log(`Found ${allRooms.length} rooms to process`);

      for (const room of allRooms) {
        try {
          if (!room || !room.id) {
            console.log("Skipping invalid room:", room);
            continue;
          }

          const roomId = room.id;

          if (room.isActive !== true) {
            room.isActive = true;
            await kv.set(`room:${roomId}`, room);
            updatedCount++;
            updatedRoomIds.push(roomId);
            console.log(`Set room ${roomId} to active`);
          } else {
            alreadyActiveCount++;
            console.log(`Room ${roomId} already active`);
          }
        } catch (error) {
          console.error(`Error processing room:`, error);
        }
      }

      return c.json({
        success: true,
        updated: updatedCount,
        alreadyActive: alreadyActiveCount,
        updatedRoomIds,
        message: `Set ${updatedCount} room(s) to active, ${alreadyActiveCount} already active. All rooms are now active.`,
      });
    } catch (error) {
      console.error("Error running recovery migration:", error);
      return c.json(
        { error: `Failed to run recovery migration: ${error}` },
        500,
      );
    }
  },
);

app.route("/", backfillUserCreatedAtApi);

export { app as oneTimeFixesApi };
