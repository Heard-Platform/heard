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
}

export const devApi = new DevApiClient();