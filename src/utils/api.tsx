import { projectId, publicAnonKey } from "./supabase/info";

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f1a393b4`;

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

  // Room management
  async createRoom(topic: string, userId: string, mode = "host-controlled", rantFirst?: boolean, description?: string) {
    return this.request("/room/create", {
      method: "POST",
      body: JSON.stringify({ topic, description, userId, mode, rantFirst }),
    });
  }

  async updateRoomDescription(roomId: string, description: string, userId: string) {
    return this.request(`/room/${roomId}/description`, {
      method: "PUT",
      body: JSON.stringify({ description, userId }),
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

  async getActiveRooms() {
    return this.request("/rooms/active");
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

  async submitRant(
    roomId: string,
    text: string,
    userId: string,
  ) {
    return this.request(`/room/${roomId}/rant`, {
      method: "POST",
      body: JSON.stringify({ text, userId }),
    });
  }

  async voteOnStatement(
    statementId: string,
    voteType: "agree" | "disagree" | "pass",
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