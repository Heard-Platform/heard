// @ts-ignore
import { Hono } from "npm:hono";
import { getByPrefixParsed, getActiveRoomValues, saveActiveRoomPointer, saveDebate, getMembership, saveMembership, deleteMembership, getStatementsForRoomIncludingHidden, getVotesForStatement, deleteVote } from "./kv-utils.tsx";
import { getAllRecords } from "./db-utils.ts";
import { getDemographicQuestionsForRoom, insertDemographicQuestion } from "./model-utils.ts";
import { CommunityMembership, DemographicQuestion } from "./types.tsx";
import { backfillUserCreatedAtApi } from "./backfill-user-created-at.tsx";
import { backfillMembershipsApi } from "./script-backfill-memberships.tsx";
import { backfillVotesToTableApi } from "./backfill-votes-to-table.tsx";
import { backfillRoomEngagementApi } from "./backfill-room-engagement.tsx";
import { backfillAnonMergeLinksApi } from "./backfill-anon-merge-links.tsx";
import { unsubApril26SignupsApi } from "./unsub-april-26-signups.tsx";
import { inviteCommunityToPostApi } from "./invite-community-to-post.tsx";
import { verifyAdminKey } from "./admin-api.tsx";
import { defineRoute } from "./route-wrapper.tsx";

const app = new Hono();

app.use("/make-server-f1a393b4/one-time-fixes/*", verifyAdminKey);

app.post(
  "/make-server-f1a393b4/one-time-fixes/fix-interdependance-day-memberships",
  defineRoute(
    { dryRun: { type: "boolean", required: false } },
    async ({ dryRun }: { dryRun?: boolean }, _c) => {
      const oldName = "interdependance-day";
      const newName = "interdependance";

      const memberships = await getAllRecords<CommunityMembership>("subheard_member:");
      let renamed = 0;
      let deletedDuplicates = 0;
      const affectedUserIds: string[] = [];

      for (const membership of memberships) {
        if (membership.subHeard !== oldName) continue;

        try {
          const existingAtNewName = await getMembership(membership.userId, newName);
          affectedUserIds.push(membership.userId);

          if (existingAtNewName) {
            deletedDuplicates++;
            if (!dryRun) await deleteMembership(membership.userId, oldName);
            continue;
          }

          renamed++;
          if (!dryRun) {
            await deleteMembership(membership.userId, oldName);
            membership.subHeard = newName;
            await saveMembership(membership);
          }
        } catch (error) {
          console.error("Error fixing up membership:", error);
        }
      }

      return { dryRun: !!dryRun, renamed, deletedDuplicates, affectedUserIds };
    },
    "Failed to fix up interdependance-day memberships",
  ),
);

app.post(
  "/make-server-f1a393b4/one-time-fixes/add-where-do-you-live-question",
  defineRoute(
    {},
    async (_params, _c) => {
      const roomId = "h722fdmwizvmrwlgokq";
      const text = "Where do you live?";
      const options = [
        "In or near LA",
        "In California",
        "Somewhere else in US",
        "Other",
      ];

      const existingQuestions =
        await getDemographicQuestionsForRoom(roomId);
      const alreadyExists = existingQuestions.some(
        (q) => q.text === text,
      );
      if (alreadyExists) {
        return { added: false, alreadyExists: true };
      }

      await insertDemographicQuestion({
        roomId,
        type: "custom",
        text,
        options,
      } as DemographicQuestion);

      return { added: true };
    },
    "Failed to add demographic question",
  ),
);

app.post(
  "/make-server-f1a393b4/one-time-fixes/fix-active-room-pointers",
  async (c) => {
    try {
      const activeRoomValues = await getActiveRoomValues();
      let migratedCount = 0;
      let skippedCount = 0;
      const migratedRoomIds: string[] = [];

      for (const value of activeRoomValues) {
        try {
          if (typeof value === "string" && value.startsWith("{")) {
            const roomData = JSON.parse(value);
            const roomId = roomData.id;

            await saveDebate(roomData);
            await saveActiveRoomPointer(roomId, roomId);

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
            await saveDebate(room);
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

app.post(
  "/make-server-f1a393b4/one-time-fixes/cleanup-orphaned-anonymous-votes-for-room",
  defineRoute(
    {
      roomId: { type: "string", required: true },
      dryRun: { type: "boolean", required: true },
    },
    async ({ roomId, dryRun }: { roomId: string; dryRun: boolean }) => {
      const statements = await getStatementsForRoomIncludingHidden(roomId);

      const orphans: {
        statementId: string;
        anonymousUserId: string;
        mergedIntoUserId: string;
      }[] = [];

      for (const statement of statements) {
        const votes = await getVotesForStatement(statement.id);
        const voteUserIds = new Set(votes.map((vote) => vote.userId));

        for (const vote of votes) {
          if (!vote.anonymousUserId) continue;
          if (!voteUserIds.has(vote.anonymousUserId)) continue;

          orphans.push({
            statementId: statement.id,
            anonymousUserId: vote.anonymousUserId,
            mergedIntoUserId: vote.userId,
          });

          if (!dryRun) {
            await deleteVote(statement.id, vote.anonymousUserId);
          }
        }
      }

      return {
        roomId,
        dryRun,
        orphansFound: orphans.length,
        orphans,
        message: dryRun
          ? `Dry run: found ${orphans.length} orphaned anonymous vote(s) in room ${roomId}.`
          : `Deleted ${orphans.length} orphaned anonymous vote(s) in room ${roomId}.`,
      };
    },
    "Failed to clean up orphaned anonymous votes for room",
  ),
);

app.route("/", backfillUserCreatedAtApi);
app.route("/", backfillMembershipsApi);
app.route("/", backfillVotesToTableApi);
app.route("/", backfillRoomEngagementApi);
app.route("/", backfillAnonMergeLinksApi);
app.route("/", unsubApril26SignupsApi);
app.route("/", inviteCommunityToPostApi);

export { app as oneTimeFixesApi };