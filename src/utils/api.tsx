import {
  ActivityMetricsData,
  AnalysisData,
  DevAnonDebate,
  DryRunResult,
  Feedback,
  PublicStatsData,
  RetentionStatsData,
  Statement,
  SubHeard,
  UserHistoryData,
  UserPresence,
  UserSession,
  type DebateRoom,
  type NewDebateRoom,
  type VoteType,
} from "../types";
import { FlyerVoteResponse, RoomStatusResponse, UserSessionResponse } from "../types/api-responses";
import {
  BaseApiClient,
  API_BASE_URL,
  ApiResponse,
} from "./api-client";
import { safelyGetStorageItem, safelySetStorageItem } from "./localStorage";
import { publicAnonKey } from "./supabase/info";
export { getSessionId, setSessionId, clearSessionId } from "./api-client";

class ApiClient extends BaseApiClient {
  async getUser(userId: string) {
    return this.request<{ user: UserSession }>(`/user/${userId}`);
  }

  // Authentication
  async signUp(nickname: string, email: string, password: string) {
    return this.request<UserSessionResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ nickname, email, password }),
    });
  }

  async signIn(email: string, password: string) {
    return this.request<UserSessionResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async sendMagicLink(email: string) {
    return this.request<undefined>("/auth/send-magic-link-auto", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async verifyMagicLink(token: string) {
    return this.request<UserSessionResponse>("/auth/verify-magic-link", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async setupAnonymousUser(
    userId: string,
    nickname: string,
    email: string,
    password: string,
  ) {
    return this.request<UserSessionResponse>("/auth/setup-anon", {
      method: "POST",
      body: JSON.stringify({ userId, nickname, email, password }),
    });
  }

  async forgotPassword(email: string) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async migrateSession(userId: string) {
    return this.request<UserSessionResponse>("/auth/migrate-session", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  // Room management
  async createRoom(
    newDebate: NewDebateRoom,
    userId: string,
  ): Promise<ApiResponse<DebateRoom>> {
    return this.request<DebateRoom>("/room/create", {
      method: "POST",
      body: JSON.stringify({ ...newDebate, userId }),
    });
  }

  async uploadDebateImage(
    imageFile: File,
  ): Promise<ApiResponse<{ imageUrl: string; filename: string }>> {
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await fetch(
        `${API_BASE_URL}/upload-debate-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          `Image Upload Error (${response.status}):`,
          data,
        );
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Image upload failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async updateRoomDescription(
    roomId: string,
    description: string,
    userId: string,
  ) {
    return this.request(`/room/${roomId}/description`, {
      method: "PUT",
      body: JSON.stringify({ description, userId }),
    });
  }

  async setRoomInactive(roomId: string, userId: string) {
    return this.request(`/room/${roomId}/inactive`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async joinRoom(roomId: string, userId: string) {
    return this.request(`/room/${roomId}/join`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async getRoomStatus(roomId: string) {
    return this.request<RoomStatusResponse>(`/room/${roomId}`);
  }

  async createAnonymousUser() {
    return this.request<UserSessionResponse>("/user/anonymous", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async updateRoomPhase(
    roomId: string,
    phase: string,
    userId: string,
    subPhase?: string,
  ) {
    return this.request(`/room/${roomId}/phase`, {
      method: "POST",
      body: JSON.stringify({ phase, subPhase, userId }),
    });
  }

  async getActiveRooms(subHeard?: string, userId?: string) {
    const params = new URLSearchParams();
    if (subHeard) params.append("subHeard", subHeard);
    if (userId) params.append("userId", userId);
    const queryString = params.toString();
    return this.request<{ rooms: DebateRoom[] }>(
      `/rooms/active${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getSubHeards(
    userId?: string,
  ): Promise<ApiResponse<{ subHeards: SubHeard[] }>> {
    const params = userId
      ? `?userId=${encodeURIComponent(userId)}`
      : "";
    return this.request(`/subheards${params}`);
  }

  async createSubHeard(
    name: string,
    userId: string,
    isPrivate?: boolean,
  ) {
    return this.request("/subheard/create", {
      method: "POST",
      body: JSON.stringify({ name, userId, isPrivate }),
    });
  }

  async updateSubHeardSettings(
    name: string,
    userId: string,
    isPrivate: boolean,
  ) {
    return this.request(`/subheard/${name}/settings`, {
      method: "PATCH",
      body: JSON.stringify({ userId, isPrivate }),
    });
  }

  async joinSubHeard(name: string, userId: string) {
    return this.request(`/subheard/${name}/join`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  // Statement management
  async submitStatement(
    roomId: string,
    text: string,
    userId: string,
  ) {
    return this.request(`/room/${roomId}/statement`, {
      method: "POST",
      body: JSON.stringify({ text, userId }),
    });
  }

  async extractTopicAndStatements(rant: string) {
    return this.request<{ topic: string; statements: string[] }>(
      "/rant/extract",
      {
        method: "POST",
        body: JSON.stringify({ rant }),
      },
    );
  }

  async voteOnStatement(
    statementId: string,
    voteType: "agree" | "disagree" | "pass" | "super_agree",
    userId: string,
  ) {
    type VoteResponse = {
      statement: Statement;
      user: UserSession;
      pointsEarned: number;
      userVote: VoteType | null;
    };
    return this.request<VoteResponse>(`/statement/${statementId}/vote`, {
      method: "POST",
      body: JSON.stringify({ voteType, userId }),
    });
  }

  async voteViaFlyer(
    flyerId: string,
    statementId: string,
    vote: VoteType,
    userId?: string,
  ) {
    return this.request<FlyerVoteResponse>(
      "/flyer/vote",
      {
        method: "POST",
        body: JSON.stringify({ flyerId, statementId, vote, userId }),
      },
    );
  }

  async markChanceCardSwiped(userId: string, roomId: string) {
    return this.request("/chance-card/mark-swiped", {
      method: "POST",
      body: JSON.stringify({ userId, roomId }),
    });
  }

  async markYouTubeCardSwiped(userId: string, roomId: string) {
    return this.request("/youtube-card/mark-swiped", {
      method: "POST",
      body: JSON.stringify({ userId, roomId }),
    });
  }

  // Invite management
  async sendInvites(
    roomId: string,
    emails: string[],
    customMessage?: string,
  ) {
    return this.request(`/room/${roomId}/invite`, {
      method: "POST",
      body: JSON.stringify({ emails, customMessage }),
    });
  }

  // Development helpers
  async createSeedData(userId: string) {
    return this.request("/seed/create", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async createTestRoom(userId: string) {
    return this.request("/test-room/create", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async createRantTestRoom(userId: string) {
    return this.request("/rant-test-room/create", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async createRealtimeTestRoom(userId: string) {
    return this.request("/realtime-test-room/create", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async createAnonDebate(userId: string) {
    return this.request<DevAnonDebate>(
      "/dev/create-anon-enabled-debate",
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      },
    );
  }

  async getAnonDebates() {
    return this.request<{ debates: DevAnonDebate[] }>(
      "/dev/anon-debates",
      {
        method: "GET",
      },
    );
  }

  // Admin methods (require X-Admin-Key header)
  async adminGetUsers(adminKey: string) {
    return this.request<{ users: UserSession[] }>("/admin/users", {
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async adminGetSubHeards(adminKey: string) {
    return this.request<{ subHeards: SubHeard[] }>(
      "/admin/subheards",
      {
        headers: {
          "X-Admin-Key": adminKey,
        },
      },
    );
  }

  async adminUpdateSubHeardAdmin(
    subHeardName: string,
    newAdminId: string,
    adminKey: string,
  ) {
    return this.request(`/admin/subheard/${subHeardName}/admin`, {
      method: "PATCH",
      body: JSON.stringify({ newAdminId }),
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async adminRenameSubHeard(
    subHeardName: string,
    newName: string,
    adminKey: string,
  ) {
    return this.request(`/admin/subheard/${subHeardName}/rename`, {
      method: "PATCH",
      body: JSON.stringify({ newName }),
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async adminBackfillTokens(adminKey: string) {
    return this.request("/admin/backfill-tokens", {
      method: "POST",
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async adminGetDebates(adminKey: string) {
    return this.request<{ debates: DebateRoom[] }>("/admin/debates", {
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async adminToggleDebateActive(debateId: string, adminKey: string) {
    return this.request<{ debate: DebateRoom }>(
      `/admin/debate/${debateId}/toggle-active`,
      {
        method: "PATCH",
        headers: {
          "X-Admin-Key": adminKey,
        },
      },
    );
  }

  async adminUpdateUserTestStatus(
    userId: string,
    isTestUser: boolean,
    adminKey: string,
  ) {
    return this.request(`/admin/user/${userId}/test-status`, {
      method: "PATCH",
      body: JSON.stringify({ isTestUser }),
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async adminUpdateUserUnsubStatus(
    userId: string,
    isUnsubbedFromUpdates: boolean,
    adminKey: string,
  ) {
    return this.request(`/admin/user/${userId}/unsub-status`, {
      method: "PATCH",
      body: JSON.stringify({ isUnsubbedFromUpdates }),
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async adminUpdateDebateSubHeard(
    debateId: string,
    newSubHeard: string | null,
    adminKey: string,
  ) {
    return this.request<{ debate: DebateRoom }>(
      `/admin/debate/${debateId}/subheard`,
      {
        method: "PATCH",
        body: JSON.stringify({ newSubHeard }),
        headers: {
          "X-Admin-Key": adminKey,
        },
      },
    );
  }

  async adminGetUserHistory(userId: string, adminKey: string) {
    return this.request<UserHistoryData>(
      `/admin/user-history/${userId}`,
      {
        headers: {
          "X-Admin-Key": adminKey,
        },
      },
    );
  }

  // Data fixes - one-time operations
  async adminDataFixNormalizeDupontCircle(adminKey: string) {
    return this.request("/admin/data-fix/normalize-dupont-circle", {
      method: "POST",
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  // Create test room from Reddit post
  async adminCreateRedditSeedRoom(
    redditUrl: string,
    userId: string,
    adminKey: string,
    subHeard?: string,
  ) {
    return this.request("/reddit/seed", {
      method: "POST",
      body: JSON.stringify({ redditUrl, userId, subHeard }),
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  // Feedback
  async submitFeedback(feedbackText: string, userId?: string) {
    return this.request("/feedback/submit", {
      method: "POST",
      body: JSON.stringify({ feedbackText, userId }),
    });
  }

  async getFeedbackList() {
    return this.request<{ feedback: Feedback[] }>("/feedback/list");
  }

  // Activity tracking
  async trackActivity(userId: string) {
    return this.request("/activity/track", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async getPublicActivityMetrics() {
    return this.request<ActivityMetricsData>(
      "/activity/public-metrics",
    );
  }

  async getPublicStats() {
    return this.request<PublicStatsData>("/public-stats");
  }

  async getRetentionStats() {
    return this.request<RetentionStatsData>("/retention-stats");
  }

  async importPolisData(data: {
    debateName: string;
    subHeard: string;
    statementsCSV: string;
    votesCSV: string;
    importerId: string;
    dryRun: boolean;
  }): Promise<{
    success: boolean;
    data?:
      | { userCount: number; statementCount: number }
      | DryRunResult;
    error?: string;
  }> {
    return this.request("/import-polis", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getRoomAnalysis(roomId: string) {
    return this.request<AnalysisData>(`/room/${roomId}/analysis`);
  }

  async regenerateClusters(roomId: string) {
    return this.request(`/room/${roomId}/regenerate-clusters`, {
      method: "POST",
    });
  }

  async updateUserPresence(userId: string, currentRoomIndex: number) {
    return this.request("/vine/presence", {
      method: "POST",
      body: JSON.stringify({ userId, currentRoomIndex }),
    });
  }

  async getActivePresences() {
    return this.request<{ data: UserPresence[] }>("/vine/presences");
  }

  async getEmailPreview(userId?: string, digestType?: string) {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (digestType) params.append("digestType", digestType);

    const queryString = params.toString();
    const response = await fetch(
      `${API_BASE_URL}/dev/email-previews${
        queryString ? `?${queryString}` : ""
      }`,
      {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.text();
  }

  async sendTestEmail(
    userId: string,
    useMockData: boolean,
    digestType?: string,
  ) {
    return this.request("/dev/email-previews/send", {
      method: "POST",
      body: JSON.stringify({ userId, useMockData, digestType }),
    });
  }

  async getEmailDigestCount(digestType: string) {
    const params = new URLSearchParams();
    params.append("digestType", digestType);

    return this.request<{
      eligibleCount: number;
      totalCount: number;
      sinceTimestamp: number;
      eligibleUsers: Array<{
        email: string;
        nickname: string;
        id: string;
      }>;
      consideredUsers: Array<{
        email: string;
        nickname: string;
        id: string;
      }>;
    }>(`/dev/email-previews/count?${params.toString()}`);
  }

  async unsubscribe(userId: string) {
    return this.request("/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }
}

export const api = new ApiClient();

// Local storage helpers for user session
export const getUserId = (): string | null => {
  if (typeof window === "undefined") return null;
  return safelyGetStorageItem<string | null>("heard_user_id", null);
};

export const setUserId = (userId: string) => {
  if (typeof window === "undefined") return;
  safelySetStorageItem("heard_user_id", userId);
};

export const clearUserId = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("heard_user_id");
};

export const getRoomId = (): string | null => {
  if (typeof window === "undefined") return null;
  return safelyGetStorageItem<string | null>("heard_room_id", null);
};

export const setRoomId = (roomId: string) => {
  if (typeof window === "undefined") return;
  safelySetStorageItem("heard_room_id", roomId);
};

export const clearRoomId = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("heard_room_id");
};