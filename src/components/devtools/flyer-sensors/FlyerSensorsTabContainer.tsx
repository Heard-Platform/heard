import { useRoomSearchOptions } from "../../../hooks/useRoomSearchOptions";
import type { ApiResponse } from "../../../utils/api-client";
import { devApi, type NewFlyerPlacementsRequest, type RoomFlyerPlacements } from "../../../utils/dev-api";
import { FlyerSensorsTab } from "./FlyerSensorsTab";

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
  const { roomOptions, isLoadingRoomOptions } = useRoomSearchOptions();

  return (
    <FlyerSensorsTab
      rooms={roomOptions}
      roomsLoading={isLoadingRoomOptions}
      loadRoomFlyers={loadRoomFlyers}
      saveFlyers={saveFlyers}
    />
  );
}
