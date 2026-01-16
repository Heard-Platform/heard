import { safelyGetStorageItem } from "./localStorage";
import { projectId, publicAnonKey } from "./supabase/info";

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f1a393b4`;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const SESSION_ID_KEY = "heard_session_id";

export const getSessionId = (): string | null =>
  safelyGetStorageItem<string | null>(SESSION_ID_KEY, null);

export const setSessionId = (id: string): void => {
  try {
    localStorage.setItem(SESSION_ID_KEY, id);
  } catch (error) {
    console.error("Failed to store session ID:", error);
  }
};

export const clearSessionId = (): void => {
  try {
    localStorage.removeItem(SESSION_ID_KEY);
  } catch (error) {
    console.error("Failed to clear session ID:", error);
  }
};

type HeadersDict = Record<string, string>;

const buildHeaders = (extraHeaders?: HeadersDict): HeadersDict => {
  const sessionId = getSessionId();
  const headers: HeadersDict = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${publicAnonKey}`,
    ...extraHeaders,
  };
  
  if (sessionId) {
    headers["X-Session-Id"] = sessionId;
  }
  
  return headers;
};

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
          headers: buildHeaders(options.headers as HeadersDict),
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

  async get(endpoint: string, headers?: HeadersDict) {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      headers: buildHeaders(headers),
    });
  }

  async post(endpoint: string, body?: any, headers?: HeadersDict) {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: buildHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch(endpoint: string, body?: any, headers?: HeadersDict) {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: buildHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}