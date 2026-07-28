import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Shield } from "lucide-react";
import { api } from "../../utils/api";
import { adminApi } from "../../utils/admin-api";

interface DataFixesProps {
  adminKey: string;
  fetchAdminData: () => Promise<void>;
}

interface ScriptConfig {
  id: string;
  title: string;
  description: string;
  dryRunMessage: string;
  liveRunMessage: string;
  successMessageDryRun: (stats: any) => string;
  successMessageLive: (stats: any) => string;
  statsDisplay: (stats: any) => string;
  apiCall: (adminKey: string, dryRun: boolean) => Promise<any>;
  bgColor: string;
}

const SCRIPTS: ScriptConfig[] = [
  {
    id: "fix-interdependance-day-memberships",
    title: "Fix Interdependance Day Memberships",
    description: "One-time fix for community memberships left behind under the old 'interdependance-day' name after the rename to 'interdependance' — an unpaginated scan silently dropped rows past its row cap. Idempotent — safe to re-run.",
    dryRunMessage: "Run DRY RUN?\n\nPreviews how many memberships would be renamed from 'interdependance-day' to 'interdependance'.\n\nNo changes will be made.\n\nContinue?",
    liveRunMessage: "Run LIVE FIX?\n\nThis will rename any remaining 'interdependance-day' membership records to 'interdependance', deleting duplicates where a correct record already exists.\n\nContinue?",
    successMessageDryRun: (stats) =>
      `DRY RUN complete!\n\n` +
      `Would rename: ${stats.renamed}\n` +
      `Would delete as duplicates: ${stats.deletedDuplicates}\n\n` +
      `No changes were made.`,
    successMessageLive: (stats) =>
      `Done!\n\n` +
      `Renamed: ${stats.renamed}\n` +
      `Deleted duplicates: ${stats.deletedDuplicates}`,
    statsDisplay: (stats) =>
      stats.dryRun
        ? `Last dry run: ${stats.renamed} would be renamed, ${stats.deletedDuplicates} would be deleted as duplicates`
        : `Last run: ${stats.renamed} renamed, ${stats.deletedDuplicates} deleted as duplicates`,
    apiCall: (adminKey, dryRun) => adminApi.fixInterdependanceDayMemberships(adminKey, dryRun),
    bgColor: "bg-teal-50",
  },
  {
    id: "backfill-room-engagement",
    title: "Backfill Room Engagement (Views + Follows)",
    description: "Seeds the room_views and room_follows tables from each room's participants list. Marks every (user, room) pair as seen-now and followed-now so the alert center starts from a clean baseline. Idempotent.",
    dryRunMessage: "Run DRY RUN?\n\nPreviews how many (userId, roomId) pairs would be upserted into room_views and room_follows.\n\nNo changes will be made.\n\nContinue?",
    liveRunMessage: "Run LIVE SCRIPT?\n\nThis will upsert one row per (user, room) into both room_views and room_follows for every participant on every room.\n\n- Idempotent (re-runs reset lastSeenAt to now)\n- May take a few minutes for large datasets\n\nContinue?",
    successMessageDryRun: (stats) =>
      `DRY RUN complete!\n\n` +
      `Pairs derived: ${stats.derivedPairs}\n` +
      `Existing room_views rows: ${stats.existingViews}\n` +
      `Existing room_follows rows: ${stats.existingFollows}\n\n` +
      `No changes were made.`,
    successMessageLive: (stats) =>
      `Done!\n\n` +
      `Pairs derived: ${stats.derivedPairs}\n` +
      `room_views upserted: ${stats.viewsUpserted}\n` +
      `room_follows upserted: ${stats.followsUpserted}\n` +
      `Final room_views: ${stats.finalViews}\n` +
      `Final room_follows: ${stats.finalFollows}\n\n` +
      (stats.batchErrors?.length ? `Errors:\n${stats.batchErrors.join("\n")}` : "No errors."),
    statsDisplay: (stats) =>
      stats.dryRun
        ? `Last dry run: ${stats.derivedPairs} pairs derived, ${stats.existingViews} views + ${stats.existingFollows} follows already exist`
        : `Last run: ${stats.viewsUpserted} views + ${stats.followsUpserted} follows upserted (final: ${stats.finalViews} views, ${stats.finalFollows} follows)`,
    apiCall: (adminKey, dryRun) => adminApi.backfillRoomEngagement(adminKey, dryRun),
    bgColor: "bg-sky-50",
  },
    {
    id: "unsub-april-26-signups",
    title: "Unsub April 26 Signups from Updates",
    description: "Sets isUnsubbedFromUpdates=true for all users who signed up on 2026-04-26 (UTC). Idempotent — already-unsubbed users are skipped.",
    dryRunMessage: "Run DRY RUN?\n\nPreviews how many users signed up on 2026-04-26 (UTC) would be unsubscribed from updates.\n\nNo changes will be made.\n\nContinue?",
    liveRunMessage: "Run LIVE SCRIPT?\n\nThis will set isUnsubbedFromUpdates=true for all users who signed up on 2026-04-26 (UTC).\n\n- Idempotent (already-unsubbed users skipped)\n- Affects only users created on that UTC day\n\nContinue?",
    successMessageDryRun: (stats) =>
      `DRY RUN complete!\n\n` +
      `Would unsub: ${stats.updated}\n` +
      `Already unsubbed: ${stats.alreadyUnsubbed}\n` +
      `Errors: ${stats.errors}\n\n` +
      `No changes were made.`,
    successMessageLive: (stats) =>
      `Done!\n\n` +
      `Unsubbed: ${stats.updated}\n` +
      `Already unsubbed: ${stats.alreadyUnsubbed}\n` +
      `Errors: ${stats.errors}`,
    statsDisplay: (stats) =>
      stats.dryRun
        ? `Last dry run: ${stats.updated} would be unsubbed, ${stats.alreadyUnsubbed} already unsubbed, ${stats.errors} errors`
        : `Last run: ${stats.updated} unsubbed, ${stats.alreadyUnsubbed} already unsubbed, ${stats.errors} errors`,
    apiCall: (adminKey, dryRun) => adminApi.unsubApril26Signups(adminKey, dryRun),
    bgColor: "bg-rose-50",
  },
  {
    id: "backfill-memberships",
    title: "Backfill Community Memberships",
    description: "Create membership records for all non-anonymous users based on their room participation. Required after enabling the \"only joined communities\" feature. Safe to run multiple times.",
    dryRunMessage: "Run DRY RUN?\n\nThis will preview what would happen without making any changes.\n\n- Shows how many users need memberships backfilled\n- No database changes will be made\n- Safe to run anytime\n\nContinue?",
    liveRunMessage: "Run LIVE SCRIPT?\n\nThis will create membership records for all non-anonymous users based on their room participation.\n\n- Scans all rooms and participants\n- Creates memberships for communities users have participated in\n- Safe to run multiple times (idempotent)\n\nNOTE: This may take a few minutes depending on data size.\n\nContinue?",
    successMessageDryRun: (stats) => 
      `DRY RUN complete!\n\n` +
      `Total users: ${stats.totalUsers}\n` +
      `Users needing memberships: ${stats.usersNeedingMemberships}\n` +
      `Memberships to create: ${stats.totalMembershipsToCreate}\n` +
      `Memberships already exist: ${stats.totalMembershipsAlreadyExist}\n\n` +
      `No changes were made.`,
    successMessageLive: (stats) =>
      `Backfill complete!\n\n` +
      `Total users: ${stats.totalUsers}\n` +
      `Users processed: ${stats.usersNeedingMemberships}\n` +
      `Memberships created: ${stats.totalMembershipsToCreate}\n` +
      `Memberships already existed: ${stats.totalMembershipsAlreadyExist}`,
    statsDisplay: (stats) =>
      `Last run: ${stats.totalUsers} total users, ${stats.usersNeedingMemberships} users needing memberships, ${stats.totalMembershipsToCreate} memberships to create, ${stats.totalMembershipsAlreadyExist} already exist`,
    apiCall: (adminKey, dryRun) => adminApi.backfillMemberships(adminKey, dryRun),
    bgColor: "bg-purple-50",
  },
  {
    id: "copy-votes-to-table",
    title: "Copy Votes to Table",
    description: "Copies all votes from the KV store into the votes table. Idempotent — safe to run multiple times. Includes a count check at the end.",
    dryRunMessage: "Preview how many votes would be copied from KV store to the votes table?\n\nNo changes will be made.\n\nContinue?",
    liveRunMessage: "Copy all votes from KV store into the votes table?\n\nThis is idempotent — safe to run multiple times.\n\nContinue?",
    successMessageDryRun: (stats) =>
      `Dry run complete!\n\n` +
      `Votes in KV store: ${stats.kvVoteCount}\n` +
      `Already in table: ${stats.tableVoteCount}\n` +
      `Would insert: ${stats.kvVoteCount - stats.tableVoteCount}\n\n` +
      `No changes were made.`,
    successMessageLive: (stats) =>
      `Done!\n\n` +
      `KV votes: ${stats.kvVoteCount}\n` +
      `Inserted: ${stats.insertedCount}\n` +
      `Table count: ${stats.tableVoteCount}\n` +
      `Counts match: ${stats.countsMatch ? "Yes" : "No — check batchErrors"}\n\n` +
      (stats.batchErrors?.length ? `Errors:\n${stats.batchErrors.join("\n")}` : "No errors."),
    statsDisplay: (stats) =>
      stats.dryRun
        ? `Last dry run: ${stats.kvVoteCount} in KV, ${stats.tableVoteCount} in table, ${stats.kvVoteCount - stats.tableVoteCount} would be inserted`
        : `Last run: ${stats.insertedCount} inserted, ${stats.tableVoteCount} total in table, counts match: ${stats.countsMatch ? "yes" : "no"}`,
    apiCall: (adminKey, dryRun) => adminApi.copyVotesToTable(adminKey, dryRun),
    bgColor: "bg-amber-50",
  },
];

export function DataFixes({ adminKey, fetchAdminData }: DataFixesProps) {
  const [dataFixLoading, setDataFixLoading] = useState<string | null>(null);
  const [migrationStats, setMigrationStats] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationDryRun, setMigrationDryRun] = useState(true);
  const [scriptStats, setScriptStats] = useState<Record<string, any>>({});
  const [isRunningScript, setIsRunningScript] = useState(false);
  const [scriptDryRun, setScriptDryRun] = useState<Record<string, boolean>>(
    Object.fromEntries(SCRIPTS.map(s => [s.id, true])),
  );
  const [currentScript, setCurrentScript] = useState<string>(SCRIPTS[0]?.id || "");

  const handleDataFixNormalizeDupontCircle = async () => {
    if (
      !confirm(
        "Run data fix to normalize 'Dupont Circle Neighborhoods' to 'dupont-circle-neighborhoods'?",
      )
    ) {
      return;
    }

    setDataFixLoading("dupont-circle");
    try {
      const res =
        await api.adminDataFixNormalizeDupontCircle(adminKey) as any;
      if (res.success) {
        alert(
          res.data?.message ||
            `Fixed ${res.data?.updatedRooms || 0} room(s)`,
        );
        await fetchAdminData();
      } else {
        alert(`Failed to run data fix: ${res.error}`);
      }
    } catch (error) {
      console.error("Error running data fix:", error);
      alert("Failed to run data fix");
    } finally {
      setDataFixLoading(null);
    }
  };

  const handleFixActiveRoomPointers = async () => {
    if (
      !confirm(
        "Migrate active_room records from full JSON objects to room ID pointers?",
      )
    ) {
      return;
    }

    setDataFixLoading("active-room-pointers");
    try {
      const res = await adminApi.fixActiveRoomPointers(adminKey);
      if (res.success) {
        alert(
          `Migrated ${res.data?.migrated || 0} record(s), skipped ${res.data?.skipped || 0} already-migrated record(s)`,
        );
        await fetchAdminData();
      } else {
        alert(`Failed to run migration: ${res.error}`);
      }
    } catch (error) {
      console.error("Error running migration:", error);
      alert("Failed to run migration");
    } finally {
      setDataFixLoading(null);
    }
  };

  const handleMigrateIsActiveToRooms = async () => {
    if (
      !confirm(
        "Migrate isActive field into room objects and delete all active_room lookup records? This is a one-time migration.",
      )
    ) {
      return;
    }

    setDataFixLoading("migrate-isactive");
    try {
      const res = await adminApi.migrateIsActiveToRooms(adminKey);
      if (res.success) {
        alert(
          `Set ${res.data?.updated || 0} room(s) to active, ${res.data?.alreadyActive || 0} already active`,
        );
        await fetchAdminData();
      } else {
        alert(`Failed to run migration: ${res.error}`);
      }
    } catch (error) {
      console.error("Error running migration:", error);
      alert("Failed to run migration");
    } finally {
      setDataFixLoading(null);
    }
  };

  const handleAddWhereDoYouLiveQuestion = async () => {
    if (
      !confirm(
        "Add the \"Where do you live?\" demographic question to room h722fdmwizvmrwlgokq? Safe to run multiple times.",
      )
    ) {
      return;
    }

    setDataFixLoading("add-where-do-you-live-question");
    try {
      const res = await adminApi.addWhereDoYouLiveQuestion(adminKey);
      if (res.success) {
        alert(
          res.data?.alreadyExists
            ? "Question already exists on this room — no changes made."
            : "Question added to room h722fdmwizvmrwlgokq.",
        );
        await fetchAdminData();
      } else {
        alert(`Failed to add question: ${res.error}`);
      }
    } catch (error) {
      console.error("Error adding demographic question:", error);
      alert("Failed to add question");
    } finally {
      setDataFixLoading(null);
    }
  };

  const handleBackfillUserCreatedAt = async () => {
    if (
      !confirm(
        "Backfill createdAt field for all users from database created_at column? Safe to run multiple times.",
      )
    ) {
      return;
    }

    setDataFixLoading("backfill-user-created-at");
    try {
      const res = await adminApi.backfillUserCreatedAt(adminKey);
      if (res.success) {
        alert(
          `Backfilled ${res.data?.updated || 0} user(s), skipped ${res.data?.skipped || 0} already-backfilled, ${res.data?.errors || 0} error(s)`,
        );
        await fetchAdminData();
      } else {
        alert(`Failed to run backfill: ${res.error}`);
      }
    } catch (error) {
      console.error("Error running backfill:", error);
      alert("Failed to run backfill");
    } finally {
      setDataFixLoading(null);
    }
  };

  const handleMigrateToSupabase = async () => {
    const confirmMessage = migrationDryRun
      ? `Run MIGRATION DRY RUN?\n\nThis will preview what would happen without making any changes.\n\n` +
        `- Shows which users would be migrated\n` +
        `- No database changes will be made\n` +
        `- Safe to run anytime\n\nContinue?`
      : `Run LIVE MIGRATION to Supabase Auth?\n\nThis will create Supabase auth records for all existing users.\n\n` +
        `- Anonymous users → Supabase anonymous auth\n` +
        `- Full accounts → Supabase accounts with email\n` +
        `- Safe to run multiple times (idempotent)\n` +
        `\n\nNOTE: This may take a few minutes depending on number of users.` +
        `\n\nContinue?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsMigrating(true);
    setMigrationStats(null);
    try {
      const res = await adminApi.migrateUsersToSupabase(adminKey, migrationDryRun);

      if (res.success) {
        setMigrationStats(res.data!.result);
        const stats = res.data!.result;
        const resultMessage = migrationDryRun
          ? `DRY RUN complete!\n\n` +
            `Would migrate:\n` +
            `Total users: ${stats.total}\n` +
            `Already migrated: ${stats.alreadyMigrated}\n` +
            `Anonymous to migrate: ${stats.anonymousMigrated}\n` +
            `Full accounts to migrate: ${stats.fullAccountMigrated}\n` +
            `Would skip: ${stats.skipped}\n\n` +
            `No changes were made.`
          : `Migration complete!\n\n` +
            `Total users: ${stats.total}\n` +
            `Already migrated: ${stats.alreadyMigrated}\n` +
            `Anonymous migrated: ${stats.anonymousMigrated}\n` +
            `Full accounts migrated: ${stats.fullAccountMigrated}\n` +
            `Skipped: ${stats.skipped}\n` +
            `Failed: ${stats.failed}`;

        alert(resultMessage);
        await fetchAdminData();
      } else {
        alert(`Failed to migrate users: ${res.error}`);
      }
    } catch (error) {
      console.error("Error migrating users:", error);
      alert("Failed to migrate users");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleRunScript = async (script: ScriptConfig) => {
    const dryRun = scriptDryRun[script.id];
    const confirmMessage = dryRun ? script.dryRunMessage : script.liveRunMessage;

    if (!confirm(confirmMessage)) {
      return;
    }

    setCurrentScript(script.id);
    setIsRunningScript(true);
    setScriptStats(prev => ({ ...prev, [script.id]: null }));
    try {
      const res = await script.apiCall(adminKey, dryRun);

      if (res.success && res.data) {
        setScriptStats(prev => ({ ...prev, [script.id]: res.data }));
        const resultMessage = dryRun
          ? script.successMessageDryRun(res.data)
          : script.successMessageLive(res.data);

        alert(resultMessage);
        await fetchAdminData();
      } else {
        alert(`Failed to run script: ${res.error}`);
      }
    } catch (error) {
      console.error(`Error running script ${script.title}:`, error);
      alert(`Failed to run script: ${error}`);
    } finally {
      setIsRunningScript(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl">One-Time Data Fixes</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Idempotent operations to fix database issues. Safe
        to run multiple times.
      </p>
      <div className="space-y-3">

        {SCRIPTS.map(script => {
          const isCurrentScript = currentScript === script.id;
          return (
            <div key={script.id} className={`flex items-center justify-between p-4 border rounded-lg ${script.bgColor}`}>
              <div className="flex-1">
                <h3 className="font-medium">
                  {script.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {script.description}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Checkbox
                    id={`script-dry-run-${script.id}`}
                    checked={scriptDryRun[script.id]}
                    onCheckedChange={(v: boolean) =>
                      setScriptDryRun(prev => ({ ...prev, [script.id]: v }))
                    }
                    disabled={isRunningScript}
                  />
                  <Label
                    htmlFor={`script-dry-run-${script.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    Dry Run Mode (preview only)
                  </Label>
                </div>
                {scriptStats[script.id] && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {script.statsDisplay(scriptStats[script.id])}
                  </div>
                )}
              </div>
              <Button
                onClick={() => handleRunScript(script)}
                disabled={isRunningScript}
                variant="outline"
                size="sm"
              >
                {isRunningScript && isCurrentScript
                  ? "Running..."
                  : scriptDryRun[script.id]
                  ? "Run Dry Run"
                  : "Run"}
              </Button>
            </div>
          );
        })}
        <div className="heard-between p-4 border rounded-lg">
          <div className="flex-1">
            <h3 className="font-medium">
              Set All Rooms to Active
            </h3>
            <p className="text-sm text-muted-foreground">
              Recovery migration: Sets all rooms to
              isActive=true. Run this to restore room
              visibility after the active_room data was
              lost.
            </p>
          </div>
          <Button
            onClick={handleMigrateIsActiveToRooms}
            disabled={dataFixLoading === "migrate-isactive"}
            variant="outline"
            size="sm"
          >
            {dataFixLoading === "migrate-isactive"
              ? "Running..."
              : "Set All Active"}
          </Button>
        </div>
        <div className="heard-between p-4 border rounded-lg">
          <div className="flex-1">
            <h3 className="font-medium">
              Normalize Dupont Circle Sub-Heard
            </h3>
            <p className="text-sm text-muted-foreground">
              Updates rooms with "Dupont Circle
              Neighborhoods" to
              "dupont-circle-neighborhoods"
            </p>
          </div>
          <Button
            onClick={handleDataFixNormalizeDupontCircle}
            disabled={dataFixLoading === "dupont-circle"}
            variant="outline"
            size="sm"
          >
            {dataFixLoading === "dupont-circle"
              ? "Running..."
              : "Run Fix"}
          </Button>
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 opacity-60">
          <div className="flex-1">
            <h3 className="font-medium text-muted-foreground">
              Fix Active Room Pointers (Obsolete)
            </h3>
            <p className="text-sm text-muted-foreground">
              Migrate active_room records from full JSON
              objects to room ID pointers. This migration is
              obsolete - use "Migrate isActive to Rooms"
              instead.
            </p>
          </div>
          <Button
            onClick={handleFixActiveRoomPointers}
            disabled={true}
            variant="outline"
            size="sm"
          >
            Disabled
          </Button>
        </div>
        <div className="heard-between p-4 border rounded-lg bg-indigo-50">
          <div className="flex-1">
            <h3 className="font-medium">
              Add "Where Do You Live?" Question
            </h3>
            <p className="text-sm text-muted-foreground">
              Adds a custom demographic question ("Where do you
              live?" with LA/California/elsewhere-in-US/Other
              options) to room h722fdmwizvmrwlgokq. Safe to run
              multiple times.
            </p>
          </div>
          <Button
            onClick={handleAddWhereDoYouLiveQuestion}
            disabled={
              dataFixLoading === "add-where-do-you-live-question"
            }
            variant="outline"
            size="sm"
          >
            {dataFixLoading === "add-where-do-you-live-question"
              ? "Running..."
              : "Add Question"}
          </Button>
        </div>
        <div className="heard-between p-4 border rounded-lg bg-blue-50">
          <div className="flex-1">
            <h3 className="font-medium">
              Backfill User CreatedAt
            </h3>
            <p className="text-sm text-muted-foreground">
              Backfill createdAt field for all users from
              database created_at column. Safe to run
              multiple times.
            </p>
          </div>
          <Button
            onClick={handleBackfillUserCreatedAt}
            disabled={
              dataFixLoading === "backfill-user-created-at"
            }
            variant="outline"
            size="sm"
          >
            {dataFixLoading === "backfill-user-created-at"
              ? "Running..."
              : "Backfill CreatedAt"}
          </Button>
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
          <div className="flex-1">
            <h3 className="font-medium">
              Migrate Users to Supabase Auth
            </h3>
            <p className="text-sm text-muted-foreground">
              Create Supabase auth records for all users. Anonymous users get anonymous auth, full accounts get email-based auth. Safe to run multiple times.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Checkbox
                id="migration-dry-run"
                checked={migrationDryRun}
                onCheckedChange={setMigrationDryRun}
                disabled={isMigrating}
              />
              <Label
                htmlFor="migration-dry-run"
                className="text-sm font-normal cursor-pointer"
              >
                {migrationDryRun ? "Dry Run Mode (preview only)" : "Live Migration Mode"}
              </Label>
            </div>
            {migrationStats && (
              <div className="mt-2 text-xs text-muted-foreground">
                Last run: {migrationStats.total} total, {migrationStats.alreadyMigrated} already migrated, {migrationStats.anonymousMigrated} anon, {migrationStats.fullAccountMigrated} full, {migrationStats.failed} failed
              </div>
            )}
          </div>
          <Button
            onClick={handleMigrateToSupabase}
            disabled={isMigrating}
            variant="outline"
            size="sm"
          >
            {isMigrating
              ? "Migrating..."
              : migrationDryRun
              ? "Run Dry Run"
              : "Run Migration"}
          </Button>
        </div>
      </div>
    </Card>
  );
}