import {
  ActivityMetricsData,
  AnalysisData,
  DevAnonDebate,
  DryRunResult,
  Feedback,
  FeatureResults,
  FunnelMetricsData,
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
  EnrichmentConfig,
} from "../types";
import { FlyerVoteResponse, RoomStatusResponse, UserSessionResponse } from "../types/api-responses";
import {
  BaseApiClient,
  API_BASE_URL,
  ApiResponse,
} from "./api-client";
import { FeatureFlags, isFeatureEnabled } from "./constants/feature-flags";
import { getEnvironment } from "./constants/general";
import { safelyGetStorageItem, safelySetStorageItem } from "./localStorage";
import { publicAnonKey } from "./supabase/info";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
export { getSessionId, setSessionId, clearSessionId } from "./api-client";

export async function safelyMakeApiCall<T>(
  callFn: () => Promise<ApiResponse<T>>
): Promise<ApiResponse<T> | null> {
  try {
    const response = await callFn();
    if (response.success) {
      return response;
    } else {
      throw new Error(response.error || "Unknown error");
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("API call failed:", errorMsg);
    return null;
  }
}

class ApiClient extends BaseApiClient {
  async getUser(userId: string) {
    return this.request<{ user: UserSession }>(`/user/${userId}`);
  }

  async sendMagicLink(email: string) {
    return this.request<undefined>("/auth/send-magic-link", {
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

  async sendSmsCode(phone: string, requireExisting: boolean = false) {
    return this.request<undefined>("/auth/send-sms-code", {
      method: "POST",
      body: JSON.stringify({ phone, requireExisting }),
    });
  }

  async verifySmsCode(phone: string, code: string, tosAcknowledged: boolean = true, privacyPolicyAcknowledged: boolean = true) {
    return this.request<UserSessionResponse>("/auth/verify-sms-code", {
      method: "POST",
      body: JSON.stringify({ phone, code, tosAcknowledged, privacyPolicyAcknowledged }),
    });
  }

  async addPhoneToAccount(phone: string, code: string) {
    return this.request<{ user: UserSession }>("/auth/add-phone-to-account", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
  }

  async addEmailToAccount(email: string) {
    return this.request<{ user: UserSession }>("/auth/add-email-to-account", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async migrateSession(userId: string) {
    return this.request<UserSessionResponse>("/auth/migrate-session", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async updateAvatar(avatarAnimal: string) {
    return this.request<{ user: UserSession }>("/account/avatar", {
      method: "POST",
      body: JSON.stringify({ avatarAnimal }),
    });
  }

  // Room management
  async createRoom(
    newDebate: NewDebateRoom,
  ): Promise<ApiResponse<DebateRoom>> {
    return this.request<DebateRoom>("/room/create", {
      method: "POST",
      body: JSON.stringify(newDebate),
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

  async setRoomInactive(roomId: string) {
    return this.request(`/room/${roomId}/inactive`, {
      method: "POST",
    });
  }

  async joinRoom(roomId: string) {
    return this.request(`/room/${roomId}/join`, {
      method: "POST",
    });
  }

  async getRoomStatus(roomId: string) {
    return this.request<RoomStatusResponse>(`/room/${roomId}`);
  }

  async createAnonymousUser() {
    const environment = getEnvironment();
    
    let fingerprint = "unknown";
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      fingerprint = result.visitorId;
    } catch (error) {
      console.error("Failed to generate fingerprint:", error);
    }
    
    const userAgent = navigator.userAgent;
    const webdriver = navigator.webdriver;
    
    return this.request<UserSessionResponse>("/user/anonymous", {
      method: "POST",
      body: JSON.stringify({ environment, fingerprint, userAgent, webdriver }),
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
    params.append("onlyJoined", isFeatureEnabled(FeatureFlags.ONLY_JOINED_COMMUNITIES).toString());
    const queryString = params.toString();
    return this.request<{ rooms: DebateRoom[] }>(
      `/rooms/active${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getSubHeards(
    userId: string,
  ): Promise<ApiResponse<{ subHeards: SubHeard[] }>> {
    const params = new URLSearchParams();
    params.append("userId", userId);
    params.append("onlyJoined", isFeatureEnabled(FeatureFlags.ONLY_JOINED_COMMUNITIES).toString());
    const queryString = params.toString();
    return this.request(`/subheards${queryString ? `?${queryString}` : ""}`);
  }

  async getExplorableSubHeards(
    userId: string,
  ): Promise<ApiResponse<SubHeard[]>> {
    const params = new URLSearchParams();
    params.append("userId", userId);
    const queryString = params.toString();
    return this.request(`/subheards/explorable${queryString ? `?${queryString}` : ""}`);
  }

  async createSubHeard(
    community: Partial<SubHeard>,
    userId: string,
  ) {
    return this.request("/subheard/create", {
      method: "POST",
      body: JSON.stringify({ community, userId }),
    });
  }

  async updateSubHeardSettings(
    community: SubHeard,
    userId: string,
  ) {
    return this.request(`/subheard/${community.name}/settings`, {
      method: "PATCH",
      body: JSON.stringify({ userId, settings: community }),
    });
  }

  async joinSubHeard(name: string, userId: string) {
    return this.request<undefined>(`/subheard/${name}/join`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async leaveSubHeard(name: string, userId: string) {
    return this.request<undefined>(`/subheard/${name}/leave`, {
      method: "DELETE",
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
    flyerGroup?: number,
  ) {
    const environment = getEnvironment();
    return this.request<FlyerVoteResponse>("/flyer/vote", {
      method: "POST",
      body: JSON.stringify({
        flyerId,
        statementId,
        vote,
        environment,
        flyerGroup,
      }),
    });
  }

  async submitFlyerEmail(email: string) {
    return this.request<undefined>(
      "/flyer/submit-email",
      {
        method: "POST",
        body: JSON.stringify({ email }),
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

  async flagStatement(statementId: string, roomId: string) {
    return this.request(`/statement/${statementId}/flag`, {
      method: "POST",
      body: JSON.stringify({ userId: getUserId(), roomId }),
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
    return this.request<RetentionStatsData>("/stats/retention", {
      method: "GET",
    });
  }

  async getFunnelMetrics() {
    return this.request<FunnelMetricsData>("/stats/funnel", {
      method: "GET",
    });
  }

  async getFeatureStats() {
    return this.request<FeatureResults>("/stats/features", {
      method: "GET",
    });
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

  async getEnrichmentConfig() {
    return this.request<EnrichmentConfig>("/internal/config/enrichment");
  }

  async setEnrichmentConfig(config: EnrichmentConfig) {
    return this.request<EnrichmentConfig>("/internal/config/enrichment", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  async runEnrichmentNow() {
    return this.request<{ roomId: string; statementIds: string[] }>("/enrichment/run", {
      method: "POST",
      body: JSON.stringify({ forceRun: true }),
    });
  }

  async getUserRank(userId: string) {
    return this.request<{ rank: number; totalUsers: number }>("/user-rank", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async getAllPosts() {
    return this.request<{posts: DebateRoom[]}>("/dev/posts");
  }

  async submitOrgEmail(email: string) {
    return this.request<undefined>("/orgs/submit-email", {
      method: "POST",
      body: JSON.stringify({ email }),
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