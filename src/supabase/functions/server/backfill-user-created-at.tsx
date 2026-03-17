// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

app.post("/make-server-f1a393b4/one-time-fixes/backfill-user-created-at", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data: userRecords, error } = await supabase
      .from("kv_store_f1a393b4")
      .select("key, value, created_at")
      .like("key", "user:%");

    if (error) {
      throw new Error(`Failed to fetch user records: ${error.message}`);
    }

    if (!userRecords || userRecords.length === 0) {
      return c.json({
        success: true,
        updated: 0,
        skipped: 0,
        message: "No user records found",
      });
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const updatedUserIds: string[] = [];

    console.log(`Found ${userRecords.length} user records to process`);

    for (const record of userRecords) {
      try {
        const userData = JSON.parse(record.value);
        const userId = userData.id;
        const dbCreatedAt = record.created_at;

        if (userData.createdAt) {
          skippedCount++;
          console.log(`User ${userId} already has createdAt, skipping`);
          continue;
        }

        const createdAtTimestamp = new Date(dbCreatedAt).getTime();

        userData.createdAt = createdAtTimestamp;

        await kv.set(`user:${userId}`, userData);

        updatedCount++;
        updatedUserIds.push(userId);
        console.log(`Backfilled createdAt for user ${userId}: ${createdAtTimestamp}`);
      } catch (error) {
        errorCount++;
        console.error(`Error processing user record ${record.key}:`, error);
      }
    }

    return c.json({
      success: true,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
      updatedUserIds,
      message: `Backfilled createdAt for ${updatedCount} user(s), skipped ${skippedCount} already-backfilled, ${errorCount} error(s)`,
    });
  } catch (error) {
    console.error("Error running user createdAt backfill:", error);
    return c.json(
      { error: `Failed to run user createdAt backfill: ${error}` },
      500,
    );
  }
});

export { app as backfillUserCreatedAtApi };