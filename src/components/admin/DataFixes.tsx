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

export function DataFixes({ adminKey, fetchAdminData }: DataFixesProps) {
  const [dataFixLoading, setDataFixLoading] = useState<string | null>(null);
  const [migrationStats, setMigrationStats] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationDryRun, setMigrationDryRun] = useState(true);

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
        <div className="heard-between p-4 border rounded-lg bg-purple-50">
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