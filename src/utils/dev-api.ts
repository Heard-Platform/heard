import { BaseApiClient } from "./api-client";
import type { VoteStats } from "../types";

interface FlyerRoomData {
  topic: string;
  groups: Record<number, number>;
  lastUserCreated: number;
  convertedUsers: number;
}

interface ReferralEventDetail {
  refereeUserId: string;
  refereeEmail?: string;
  source: string;
  referrerUserId?: string;
  referrerEmail?: string;
  roomId?: string;
  createdAt: number;
}

interface ReferralEventSummary {
  bySource: { source: string; count: number }[];
  referrals: ReferralEventDetail[];
}

interface SessionSummary {
  sessionId: string;
  userId: string;
  userLabel: string;
  startedAt: number;
  endedAt: number | null;
  durationMs: number;
  eventCount: number;
  eventTypes: string[];
  isActive: boolean;
}

interface SessionsResponse {
  sessions: SessionSummary[];
  fetchedAt: number;
}

export interface FlyerStatementOption {
  id: string;
  text: string;
}

export interface SavedFlyerPlacement {
  id: string;
  statementId: string;
  flyerGroup: number;
  latitude: number;
  longitude: number;
  headingDeg: number | null;
  agrees: number;
  disagrees: number;
}

export interface RoomFlyerPlacements {
  statements: FlyerStatementOption[];
  flyers: SavedFlyerPlacement[];
}

export interface NewFlyerPlacementsRequest {
  roomId: string;
  statementId: string;
  flyers: {
    flyerGroup: number;
    latitude: number;
    longitude: number;
    headingDeg: number | null;
  }[];
}

class DevApiClient extends BaseApiClient {
  async getFlyerStats() {
    return this.request<{ flyerRoomData: Record<string, FlyerRoomData> }>(
      "/dev/flyer-stats",
      {
        method: "GET",
      },
    );
  }

  async getReferralEvents() {
    return this.request<ReferralEventSummary>("/dev/referral-events", {
      method: "GET",
    });
  }

  async getVoteStats() {
    return this.request<VoteStats>("/dev/vote-stats", { method: "GET" });
  }

  async getSessions(sinceTs?: number) {
    const query = sinceTs ? `?since=${new Date(sinceTs).toISOString()}` : "";
    return this.request<SessionsResponse>(`/dev/sessions${query}`, {
      method: "GET",
    });
  }

  async getFlyerPlacements(roomId: string) {
    return this.request<RoomFlyerPlacements>(`/dev/flyer-placements/${roomId}`, {
      method: "GET",
    });
  }

  async saveFlyerPlacements(request: NewFlyerPlacementsRequest) {
    return this.request<{}>("/dev/flyer-placements", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async timedGet(endpoint: string): Promise<{ success: boolean; durationMs: number }> {
    const start = performance.now();
    const response = await this.request(endpoint, { method: "GET" });
    return { success: response.success, durationMs: performance.now() - start };
  }

  async testPingPerf() {
    return this.timedGet("/performance-test/ping");
  }

  async testKvSinglePerf() {
    return this.timedGet("/performance-test/kv-single");
  }

  async testSqlTablePerf() {
    return this.timedGet("/performance-test/sql-table");
  }

  async testKvAllPerf() {
    return this.timedGet("/performance-test/kv-all");
  }

  async getRoomOgHtml(roomId: string): Promise<string | null> {
    try {
      const res = await this.get(`/og/${roomId}`);
      if (!res.ok) return null;
      return res.text();
    } catch {
      return null;
    }
  }
}

export const devApi = new DevApiClient();