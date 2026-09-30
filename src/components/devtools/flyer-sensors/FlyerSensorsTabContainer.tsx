import { useEffect, useState } from "react";
import { api, safelyMakeApiCall } from "../../../utils/api";
import type { ApiResponse } from "../../../utils/api-client";
import { devApi, type NewFlyerPlacementsRequest, type RoomFlyerPlacements } from "../../../utils/dev-api";
import { FlyerSensorsTab } from "./FlyerSensorsTab";
import type { RoomSearchOption } from "../../RoomSearchPicker";

function formatRoomDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function unwrap<T>(response: ApiResponse<T>, fallbackError: string): T {
  if (!response.success || response.data === undefined) throw new Error(response.error ?? fallbackError);
  return response.data;
}

async function loadRoomFlyers(roomId: string): Promise<RoomFlyerPlacements> {
  const { statements, flyers } = unwrap(await devApi.getFlyerPlacements(roomId), "Failed to load flyers");
  return { statements, flyers };
}

async function saveFlyers(request: NewFlyerPlacementsRequest): Promise<void> {
  unwrap(await devApi.saveFlyerPlacements(request), "Failed to save flyers");
}

export function FlyerSensorsTabContainer() {
  const [rooms, setRooms] = useState<RoomSearchOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    safelyMakeApiCall(() => api.getAllPosts()).then((response) => {
      if (cancelled) return;
      const posts = response?.success ? response.data?.posts ?? [] : [];
      setRooms(posts.map(({ id, topic, createdAt }) => ({ id, topic, detail: formatRoomDate(createdAt) })));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FlyerSensorsTab
      rooms={rooms}
      roomsLoading={loading}
      loadRoomFlyers={loadRoomFlyers}
      saveFlyers={saveFlyers}
    />
  );
}
