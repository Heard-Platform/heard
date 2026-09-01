// @ts-ignore
import { Hono } from "npm:hono";
import { getAllUsers } from "./kv-utils.tsx";
import { getRoomViewsForUser } from "./model-utils.ts";
import { mergeRoomViews } from "./anonymous-merge-utils.tsx";
import { defineRoute } from "./route-wrapper.tsx";

const app = new Hono();

app.post(
  "/make-server-f1a393b4/one-time-fixes/backfill-user-data",
  defineRoute(
    { dryRun: { type: "boolean", required: true } },
    async ({ dryRun }: { dryRun: boolean }) => {
      const users = await getAllUsers();
      const candidates = users.filter((user) => user.isAnonymous && user.mergedIntoUserId);

      const usersUpdated: string[] = [];
      let viewsMerged = 0;

      for (const user of candidates) {
        const anonViews = await getRoomViewsForUser(user.id);
        if (anonViews.length === 0) continue;

        usersUpdated.push(user.id);
        viewsMerged += anonViews.length;

        if (!dryRun) {
          await mergeRoomViews(user.id, user.mergedIntoUserId!);
        }
      }

      return {
        dryRun,
        candidateUsers: candidates.length,
        usersWithOrphanedViews: usersUpdated.length,
        viewsMerged,
        message: dryRun
          ? `Dry run: ${usersUpdated.length} of ${candidates.length} linked anonymous user(s) have orphaned room_views (${viewsMerged} total) that would be merged into their account.`
          : `Merged ${viewsMerged} orphaned room_views row(s) for ${usersUpdated.length} anonymous user(s) into their linked account.`,
      };
    },
    "Failed to backfill user data",
  ),
);

export { app as backfillUserDataApi };
