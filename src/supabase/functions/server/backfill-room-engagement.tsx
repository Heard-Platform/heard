// @ts-ignore
import { Hono } from "npm:hono";
import { getAllDebates } from "./kv-utils.tsx";
import { upsert, selectAll } from "./db-utils.ts";
import { defineRoute } from "./route-wrapper.tsx";
import type { RoomFollow, RoomView } from "./types.tsx";

const app = new Hono();

app.post(
  "/make-server-f1a393b4/one-time-fixes/backfill-room-engagement",
  defineRoute(
    { dryRun: { type: "boolean", required: true } },
    async ({ dryRun }: { dryRun: boolean }) => {
      const rooms = await getAllDebates();
      const now = Date.now();

      const views: RoomView[] = [];
      const follows: RoomFollow[] = [];
      const seen = new Set<string>();
      for (const room of rooms) {
        for (const userId of room.participants ?? []) {
          const key = `${userId}:${room.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          views.push({ userId, roomId: room.id, lastSeenAt: now });
          follows.push({ userId, roomId: room.id, followedAt: now });
        }
      }

      if (dryRun) {
        const [existingViews, existingFollows] = await Promise.all([
          selectAll("room_views"),
          selectAll("room_follows"),
        ]);
        return {
          dryRun: true,
          derivedPairs: views.length,
          existingViews: existingViews.length,
          existingFollows: existingFollows.length,
          message: `Dry run: ${views.length} (userId, roomId) pairs derived from room.participants. room_views has ${existingViews.length} rows; room_follows has ${existingFollows.length} rows.`,
        };
      }

      const batchSize = 500;
      const batchErrors: string[] = [];
      let viewsUpserted = 0;
      let followsUpserted = 0;

      for (let i = 0; i < views.length; i += batchSize) {
        const batch = views.slice(i, i + batchSize);
        const result = await upsert("room_views", batch as any, "userId,roomId");
        if (!result.success) {
          batchErrors.push(`room_views batch ${Math.floor(i / batchSize) + 1}: ${result.error}`);
        } else {
          viewsUpserted += batch.length;
        }
      }

      for (let i = 0; i < follows.length; i += batchSize) {
        const batch = follows.slice(i, i + batchSize);
        const result = await upsert("room_follows", batch as any, "userId,roomId");
        if (!result.success) {
          batchErrors.push(`room_follows batch ${Math.floor(i / batchSize) + 1}: ${result.error}`);
        } else {
          followsUpserted += batch.length;
        }
      }

      const [finalViews, finalFollows] = await Promise.all([
        selectAll("room_views"),
        selectAll("room_follows"),
      ]);

      return {
        dryRun: false,
        derivedPairs: views.length,
        viewsUpserted,
        followsUpserted,
        finalViews: finalViews.length,
        finalFollows: finalFollows.length,
        batchErrors,
        message: `Upserted ${viewsUpserted} room_views and ${followsUpserted} room_follows. Final row counts — room_views: ${finalViews.length}, room_follows: ${finalFollows.length}.`,
      };
    },
    "Failed to backfill room engagement",
  ),
);

export { app as backfillRoomEngagementApi };
