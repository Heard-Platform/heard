import * as Sentry from "@sentry/react";
import { getEnvironment } from "./constants/general";
import { safelyDelStorageItem, safelyGetStorageItem, safelySetStorageItem } from "./localStorage";
import { projectId, publicAnonKey } from "./supabase/info";
import type { UserSession } from "../types";

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f1a393b4`;

export interface ApiResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

const SESSION_ID_KEY = "heard_session_id";
const CACHED_USER_KEY = "heard_cached_user";

export const getSessionId = (): string | null =>
  safelyGetStorageItem<string | null>(SESSION_ID_KEY, null);

export const setSessionId = (id: string): void => {
  safelySetStorageItem(SESSION_ID_KEY, id);
};

export const clearSessionId = (): void => {
  safelyDelStorageItem(SESSION_ID_KEY);
};

export const getCachedUser = (): UserSession | null =>
  safelyGetStorageItem<UserSession | null>(CACHED_USER_KEY, null);

export const setCachedUser = (user: UserSession): void => {
  safelySetStorageItem(CACHED_USER_KEY, user);
};

export const clearCachedUser = (): void => {
  safelyDelStorageItem(CACHED_USER_KEY);
};

type HeadersDict = Record<string, string>;

const buildHeaders = (extraHeaders?: HeadersDict): HeadersDict => {
  const sessionId = getSessionId();
  const headers: HeadersDict = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${publicAnonKey}`,
    "X-API-Key": import.meta.env.VITE_HEARD_API_SECRET,
    ...extraHeaders,
  };
  
  if (sessionId) {
    headers["X-Session-Id"] = sessionId;
  }
  
  return headers;
};

export class BaseApiClient {
  private async instrumentedFetch(
    endpoint: string,
    options: RequestInit,
  ): Promise<Response> {
    const label = `${options.method ?? "GET"} ${endpoint}`;
    const start = performance.now();
    return Sentry.startSpan({ name: label, op: "http.client" }, async () => {
      try {
        return await fetch(`${API_BASE_URL}${endpoint}`, options);
      } finally {
        if (getEnvironment() === "development") {
          console.log(`[api] ${label} — ${(performance.now() - start).toFixed(0)}ms`);
        }
      }
    });
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const isFormData = options.body instanceof FormData;
      const headers = buildHeaders(options.headers as HeadersDict);
      if (isFormData) {
        delete headers["Content-Type"];
      }
      const response = await this.instrumentedFetch(endpoint, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`API Error (${response.status}):`, data);
        
        if (
          response.status === 401 &&
          (data.error === "Invalid session" ||
            data.error === "Session expired")
        ) {
          return {
            success: false,
            error: "SESSION_EXPIRED",
          };
        }
        
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
    return this.instrumentedFetch(endpoint, {
      headers: buildHeaders(headers),
    });
  }

  async post(endpoint: string, body?: any, headers?: HeadersDict) {
    return this.instrumentedFetch(endpoint, {
      method: "POST",
      headers: buildHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch(endpoint: string, body?: any, headers?: HeadersDict) {
    return this.instrumentedFetch(endpoint, {
      method: "PATCH",
      headers: buildHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}