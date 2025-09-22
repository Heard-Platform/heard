import { projectId, publicAnonKey } from "./supabase/info";

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f1a393b4`;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
          ...options.headers,
        },
      });

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
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // User management
  async createUser(nickname: string) {
    return this.request("/user/create", {
      method: "POST",
      body: JSON.stringify({ nickname }),
    });
  }

  async getUser(userId: string) {
    return this.request(`/user/${userId}`);
  }

  // Room management
  async createRoom(topic: string, userId: string) {
    return this.request("/room/create", {
      method: "POST",
      body: JSON.stringify({ topic, userId }),
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

  async updateRoomPhase(roomId: string, phase: string, userId: string) {
    return this.request(`/room/${roomId}/phase`, {
      method: "POST",
      body: JSON.stringify({ phase, userId }),
    });
  }

  async getActiveRooms() {
    return this.request("/rooms/active");
  }

  // Statement management
  async submitStatement(roomId: string, text: string, type: string | undefined, userId: string) {
    return this.request(`/room/${roomId}/statement`, {
      method: "POST",
      body: JSON.stringify({ text, type, userId }),
    });
  }

  async voteOnStatement(statementId: string, voteType: "up" | "down", userId: string) {
    return this.request(`/statement/${statementId}/vote`, {
      method: "POST",
      body: JSON.stringify({ voteType, userId }),
    });
  }

  // Development helpers
  async createSeedData(userId: string) {
    return this.request("/seed/create", {
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
