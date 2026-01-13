import { BaseApiClient } from "./api-client";

interface MigrationStats {
  total: number;
  alreadyMigrated: number;
  anonymousMigrated: number;
  fullAccountMigrated: number;
  skipped: number;
  failed: number;
}

interface FixActiveRoomPointersResult {
  migrated: number;
  skipped: number;
}

interface MigrateIsActiveResult {
  updated: number;
  alreadyActive: number;
}

interface BackfillUserCreatedAtResult {
  updated: number;
  skipped: number;
  errors: number;
}

class AdminApiClient extends BaseApiClient {
  async fixActiveRoomPointers(adminKey: string) {
    return this.request<FixActiveRoomPointersResult>(
      "/one-time-fixes/fix-active-room-pointers",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
      },
    );
  }

  async migrateIsActiveToRooms(adminKey: string) {
    return this.request<MigrateIsActiveResult>(
      "/one-time-fixes/migrate-isactive-to-rooms",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
      },
    );
  }

  async backfillUserCreatedAt(adminKey: string) {
    return this.request<BackfillUserCreatedAtResult>(
      "/one-time-fixes/backfill-user-created-at",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
      },
    );
  }

  async migrateUsersToSupabase(adminKey: string, dryRun: boolean) {
    return this.request<{ result: MigrationStats }>(
      "/admin/migrate-users-to-supabase",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ dryRun }),
      },
    );
  }
}

export const adminApi = new AdminApiClient();
