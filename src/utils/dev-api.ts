import { BaseApiClient } from "./api-client";

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
}

export const devApi = new DevApiClient();