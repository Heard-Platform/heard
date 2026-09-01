import { SubHeard } from "../types";
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

interface CopyVotesToTableResult {
  kvVoteCount: number;
  insertedCount: number;
  tableVoteCount: number;
  countsMatch: boolean;
  batchErrors: string[];
  message: string;
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

  async copyVotesToTable(adminKey: string, dryRun: boolean) {
    return this.request<CopyVotesToTableResult>(
      "/one-time-fixes/copy-votes-to-table",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ dryRun }),
      },
    );
  }

  async backfillRoomEngagement(adminKey: string, dryRun: boolean) {
    interface Result {
      dryRun: boolean;
      derivedPairs: number;
      existingViews?: number;
      existingFollows?: number;
      viewsUpserted?: number;
      followsUpserted?: number;
      finalViews?: number;
      finalFollows?: number;
      batchErrors?: string[];
      message: string;
    }

    return this.request<Result>(
      "/one-time-fixes/backfill-room-engagement",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ dryRun }),
      },
    );
  }

  async unsubApril26Signups(adminKey: string, dryRun: boolean) {
    interface Result {
      dryRun: boolean;
      updated: number;
      alreadyUnsubbed: number;
      errors: number;
      updatedUserIds: string[];
      message: string;
    }

    return this.request<Result>(
      "/one-time-fixes/unsub-april-26-signups",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ dryRun }),
      },
    );
  }

  async inviteCommunityToPost(
    adminKey: string,
    roomId: string,
    communities: string[],
    dryRun: boolean,
    testEmail?: string,
  ) {
    interface Result {
      dryRun: boolean;
      roomId: string;
      topic: string;
      communities: string[];
      recipientCount: number;
      alreadyEmailed: number;
      sent: number;
      failed: number;
      errors: string[];
      message: string;
    }

    return this.request<Result>(
      "/one-time-fixes/invite-community-to-post",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ roomId, communities, dryRun, testEmail }),
      },
    );
  }

  async fixInterdependanceDayMemberships(adminKey: string, dryRun: boolean) {
    interface Result {
      dryRun: boolean;
      renamed: number;
      deletedDuplicates: number;
      affectedUserIds: string[];
    }

    return this.request<Result>(
      "/one-time-fixes/fix-interdependance-day-memberships",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ dryRun }),
      },
    );
  }

  async cleanupOrphanedAnonymousVotesForRoom(
    adminKey: string,
    roomId: string,
    dryRun: boolean,
  ) {
    interface Result {
      roomId: string;
      dryRun: boolean;
      orphansFound: number;
      orphans: {
        statementId: string;
        anonymousUserId: string;
        mergedIntoUserId: string;
      }[];
      message: string;
    }

    return this.request<Result>(
      "/one-time-fixes/cleanup-orphaned-anonymous-votes-for-room",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ roomId, dryRun }),
      },
    );
  }

  async backfillAnonMergeLinks(adminKey: string, dryRun: boolean) {
    interface Result {
      dryRun: boolean;
      updatedCount: number;
      updated: { anonymousUserId: string; mergedIntoUserId: string }[];
      message: string;
    }

    return this.request<Result>(
      "/one-time-fixes/backfill-anon-merge-links",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ dryRun }),
      },
    );
  }

  async backfillUserData(adminKey: string, dryRun: boolean) {
    interface Result {
      dryRun: boolean;
      candidateUsers: number;
      usersWithOrphanedViews: number;
      viewsMerged: number;
      message: string;
    }

    return this.request<Result>(
      "/one-time-fixes/backfill-user-data",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ dryRun }),
      },
    );
  }

  async addWhereDoYouLiveQuestion(adminKey: string) {
    interface Result {
      added: boolean;
      alreadyExists?: boolean;
    }

    return this.request<Result>(
      "/one-time-fixes/add-where-do-you-live-question",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
      },
    );
  }

  async backfillMemberships(adminKey: string, dryRun: boolean) {
    interface Result {
      totalUsers: number;
      usersNeedingMemberships: number;
      totalMembershipsToCreate: number;
      totalMembershipsAlreadyExist: number;
      dryRun: boolean;
    }

    return this.request<Result>(
      "/one-time-fixes/backfill-community-memberships",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ dryRun }),
      },
    );
  }

  async updateSubHeard(
    subHeardName: string,
    update: Partial<SubHeard>,
    adminKey: string,
  ) {
    return this.request(`/admin/subheard/${subHeardName}/update`, {
      method: "PATCH",
      body: JSON.stringify({ update }),
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
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

  async sendNewsletter(adminKey: string, testMode: boolean, testEmail: string, newsletterEdition: number) {
    return this.request<{ sent: number; failed: number; total: number }>(
      "/admin/send-newsletter",
      {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ testMode, testEmail, newsletterEdition }),
      },
    );
  }

  async getNewsletterEligibleCount(adminKey: string, newsletterEdition: number) {
    return this.request<{ eligible: number; alreadySent: number; total: number }>(
      `/admin/newsletter-eligible-count?edition=${newsletterEdition}`,
      {
        method: "GET",
        headers: { "X-Admin-Key": adminKey },
      },
    );
  }

  async clearPhoneVerification(
    adminKey: string,
    userId: string,
  ) {
    return this.request(`/admin/user/${userId}/clear-phone`, {
      method: "DELETE",
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async getFlyerEmails(adminKey: string) {
    return this.request<{ emails: { email: string }[] }>(
      "/admin/flyer-emails",
      {
        method: "GET",
        headers: { "X-Admin-Key": adminKey },
      },
    );
  }

  async getPowerUsers(adminKey: string) {
    return this.request<{ powerUsers: Array<{ user: any; uniqueDays: number }> }>(
      "/admin/power-users",
      {
        method: "GET",
        headers: { "X-Admin-Key": adminKey },
      },
    );
  }
}

export const adminApi = new AdminApiClient();