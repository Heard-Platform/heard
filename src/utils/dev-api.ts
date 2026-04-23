import { BaseApiClient } from "./api-client";
import type { VoteStats } from "../types";

interface FlyerRoomData {
  topic: string;
  groups: Record<number, number>;
  lastUserCreated: number;
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

  async getVoteStats() {
    return this.request<VoteStats>("/dev/vote-stats", { method: "GET" });
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