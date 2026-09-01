// @ts-ignore
import { Hono } from "npm:hono";
import { getAllStatements, getAllUsers, getAllVotes, saveUser } from "./kv-utils.tsx";
import { defineRoute } from "./route-wrapper.tsx";

const app = new Hono();

app.post(
  "/make-server-f1a393b4/one-time-fixes/backfill-anon-merge-links",
  defineRoute(
    { dryRun: { type: "boolean", required: true } },
    async ({ dryRun }: { dryRun: boolean }) => {
      const [statements, votes, users] = await Promise.all([
        getAllStatements(),
        getAllVotes(),
        getAllUsers(),
      ]);

      const targetUserIdByAnonymousUserId = new Map<string, string>();
      for (const statement of statements) {
        if (statement.anonymousUserId) {
          targetUserIdByAnonymousUserId.set(statement.anonymousUserId, statement.author);
        }
      }
      for (const vote of votes) {
        if (vote.anonymousUserId) {
          targetUserIdByAnonymousUserId.set(vote.anonymousUserId, vote.userId);
        }
      }

      const toUpdate: { anonymousUserId: string; mergedIntoUserId: string }[] = [];
      for (const user of users) {
        if (!user.isAnonymous || user.mergedIntoUserId) continue;
        const targetUserId = targetUserIdByAnonymousUserId.get(user.id);
        if (!targetUserId) continue;
        toUpdate.push({ anonymousUserId: user.id, mergedIntoUserId: targetUserId });
      }

      if (!dryRun) {
        const usersById = new Map(users.map((user) => [user.id, user]));
        for (const { anonymousUserId, mergedIntoUserId } of toUpdate) {
          const user = usersById.get(anonymousUserId)!;
          user.mergedIntoUserId = mergedIntoUserId;
          await saveUser(user);
        }
      }

      return {
        dryRun,
        updatedCount: toUpdate.length,
        updated: toUpdate,
        message: dryRun
          ? `Dry run: found ${toUpdate.length} anonymous user(s) with a known merge target but no mergedIntoUserId set.`
          : `Set mergedIntoUserId on ${toUpdate.length} anonymous user(s).`,
      };
    },
    "Failed to backfill anonymous user merge links",
  ),
);

export { app as backfillAnonMergeLinksApi };
