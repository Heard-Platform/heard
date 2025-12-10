import { projectId, publicAnonKey } from "./supabase/info";
import type { DebateRoom, NewDebateRoom } from "../types";

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f1a393b4`;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            ...options.headers,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(`API Error (${response.status}):`, data);
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return { success: true, data };
    } catch (error) {
      console.error("API Request failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Network error",
      };
    }
  }

  // User management
  async createUser(nickname: string, email: string) {
    return this.request("/user/create", {
      method: "POST",
      body: JSON.stringify({ nickname, email }),
    });
  }

  async getUser(userId: string) {
    return this.request(`/user/${userId}`);
  }

  // Authentication
  async signUp(nickname: string, email: string, password: string) {
    return this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ nickname, email, password }),
    });
  }

  async signIn(email: string, password: string) {
    return this.request("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
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

  // Room management
  async createRoom(
    newDebate: NewDebateRoom,
    userId: string
  ): Promise<ApiResponse<DebateRoom>> {
    return this.request<DebateRoom>("/room/create", {
      method: "POST",
      body: JSON.stringify({ ...newDebate, userId }),
    });
  }

  async uploadDebateImage(imageFile: File): Promise<ApiResponse<{ imageUrl: string; filename: string }>> {
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await fetch(`${API_BASE_URL}/upload-debate-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`Image Upload Error (${response.status}):`, data);
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
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async updateRoomDescription(roomId: string, description: string, userId: string) {
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
    return this.request(`/room/${roomId}`);
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
    return this.request(`/rooms/active${queryString ? `?${queryString}` : ""}`);
  }

  async getSubHeards(userId?: string) {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return this.request(`/subheards${params}`);
  }

  async createSubHeard(name: string, userId: string, isPrivate?: boolean) {
    return this.request("/subheard/create", {
      method: "POST",
      body: JSON.stringify({ name, userId, isPrivate }),
    });
  }

  async updateSubHeardSettings(name: string, userId: string, isPrivate: boolean) {
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
    return this.request<{ topic: string; statements: string[] }>("/rant/extract", {
      method: "POST",
      body: JSON.stringify({ rant }),
    });
  }

  async voteOnStatement(
    statementId: string,
    voteType: "agree" | "disagree" | "pass" | "super_agree",
    userId: string,
  ) {
    return this.request(`/statement/${statementId}/vote`, {
      method: "POST",
      body: JSON.stringify({ voteType, userId }),
    });
  }

  // Invite management
  async sendInvites(roomId: string, emails: string[], customMessage?: string) {
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

  // Admin methods (require X-Admin-Key header)
  async adminGetUsers(adminKey: string) {
    return this.request("/admin/users", {
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async adminGetSubHeards(adminKey: string) {
    return this.request("/admin/subheards", {
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async adminUpdateSubHeardAdmin(subHeardName: string, newAdminId: string, adminKey: string) {
    return this.request(`/admin/subheard/${subHeardName}/admin`, {
      method: "PATCH",
      body: JSON.stringify({ newAdminId }),
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async adminRenameSubHeard(subHeardName: string, newName: string, adminKey: string) {
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
    return this.request("/admin/debates", {
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async adminToggleDebateActive(debateId: string, adminKey: string) {
    return this.request(`/admin/debate/${debateId}/toggle-active`, {
      method: "PATCH",
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
  }

  async adminUpdateDebateSubHeard(debateId: string, newSubHeard: string | null, adminKey: string) {
    return this.request(`/admin/debate/${debateId}/subheard`, {
      method: "PATCH",
      body: JSON.stringify({ newSubHeard }),
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
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
  async adminCreateRedditSeedRoom(redditUrl: string, userId: string, adminKey: string, subHeard?: string) {
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
    return this.request("/feedback/list");
  }

  // Activity tracking
  async trackActivity(userId: string) {
    return this.request("/activity/track", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async getPublicActivityMetrics() {
    return this.request("/activity/public-metrics");
  }

  async getPublicStats() {
    return this.request("/public-stats");
  }

  async getRetentionStats() {
    return this.request("/retention-stats");
  }

  async importPolisData(data: {
    debateName: string;
    subHeard: string;
    statementsCSV: string;
    votesCSV: string;
    importerId: string;
    dryRun: boolean;
  }) {
    return this.request("/import-polis", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getRoomAnalysis(roomId: string) {
    return this.request(`/room/${roomId}/analysis`);
  }
}

export const api = new ApiClient();

// Local storage helpers for user session
export const getUserId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("heard_user_id");
};

export const setUserId = (userId: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("heard_user_id", userId);
};

export const clearUserId = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("heard_user_id");
};

export const getRoomId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("heard_room_id");
};

export const setRoomId = (roomId: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("heard_room_id", roomId);
};

export const clearRoomId = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("heard_room_id");
};