import { useEffect, useState } from "react";
import type { RoomActivity } from "../../../types";
import { useRoomSearchOptions } from "../../../hooks/useRoomSearchOptions";
import { api } from "../../../utils/api";
import { WAYMO_DC_ROOM_ID } from "../../../utils/constants/flyers";
import { RoomActivityTab } from "./RoomActivityTab";

export function RoomActivityTabContainer() {
  const [selectedRoomId, setSelectedRoomId] = useState(WAYMO_DC_ROOM_ID);
  const { roomOptions, isLoadingRoomOptions } = useRoomSearchOptions();
  const [roomActivity, setRoomActivity] = useState<RoomActivity | null>(null);
  const [roomActivityError, setRoomActivityError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRoomActivity(null);
    setRoomActivityError(null);

    api.getRoomActivity(selectedRoomId).then((response) => {
      if (cancelled) return;
      if (response.success && response.data) {
        setRoomActivity(response.data);
      } else {
        setRoomActivityError(response.error ?? "Failed to load room activity");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedRoomId]);

  return (
    <RoomActivityTab
      roomActivity={roomActivity}
      roomActivityError={roomActivityError}
      selectedRoomId={selectedRoomId}
      roomOptions={roomOptions}
      isLoadingRoomOptions={isLoadingRoomOptions}
      onSelectRoom={setSelectedRoomId}
    />
  );
}
