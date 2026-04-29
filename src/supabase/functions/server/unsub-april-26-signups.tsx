// @ts-ignore
import { Hono } from "npm:hono";
import { getAllRealUsers, saveUser } from "./kv-utils.tsx";
import { defineRoute } from "./route-wrapper.tsx";

const app = new Hono();

// Inclusive start, exclusive end (UTC).
const START_MS = Date.UTC(2026, 3, 26, 0, 0, 0); // 2026-04-26 00:00:00 UTC
const END_MS = Date.UTC(2026, 3, 27, 0, 0, 0);   // 2026-04-27 00:00:00 UTC

app.post(
  "/make-server-f1a393b4/one-time-fixes/unsub-april-26-signups",
  defineRoute(
    { dryRun: { type: "boolean", required: true } },
    async ({ dryRun }: { dryRun: boolean }) => {
      const users = await getAllRealUsers();

      let updatedCount = 0;
      let alreadyUnsubbedCount = 0;
      let errorCount = 0;
      const updatedUserIds: string[] = [];

      for (const user of users) {
        try {
          if (
            typeof user.createdAt !== "number" ||
            user.createdAt < START_MS ||
            user.createdAt >= END_MS ||
            user.isAnonymous === true
          ) {
            continue;
          }

          if (user.isUnsubbedFromUpdates === true) {
            alreadyUnsubbedCount++;
            continue;
          }

          if (!dryRun) {
            user.isUnsubbedFromUpdates = true;
            await saveUser(user);
          }

          updatedCount++;
          updatedUserIds.push(user.id);
          console.log(
            `[unsub-april-26]${dryRun ? " [dry-run]" : ""} ${
              dryRun ? "Would unsub" : "Unsubbed"
            } user ${user.id} (${user.email}), createdAt=${user.createdAt}`,
          );
        } catch (error) {
          errorCount++;
          console.error(`[unsub-april-26] Error processing user ${user?.id}:`, error);
        }
      }

      const verb = dryRun ? "Would unsub" : "Unsubbed";
      return {
        dryRun,
        updated: updatedCount,
        alreadyUnsubbed: alreadyUnsubbedCount,
        errors: errorCount,
        updatedUserIds,
        message: `${verb} ${updatedCount} user(s) from updates (signed up 2026-04-26 UTC), ${alreadyUnsubbedCount} already unsubbed, ${errorCount} error(s)`,
      };
    },
    "Failed to run unsub-april-26-signups",
  ),
);

export { app as unsubApril26SignupsApi };
