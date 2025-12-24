import { projectId, publicAnonKey } from "./supabase/info";

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f1a393b4`;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class BaseApiClient {
  protected async request<T>(
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

  async get(endpoint: string, headers?: Record<string, string>) {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
        ...headers,
      },
    });
  }

  async post(endpoint: string, body?: any, headers?: Record<string, string>) {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch(endpoint: string, body?: any, headers?: Record<string, string>) {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}
