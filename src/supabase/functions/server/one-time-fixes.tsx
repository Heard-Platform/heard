// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

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

export { app as oneTimeFixesApi };
