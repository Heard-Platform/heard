import { useEffect, useState } from "react";
import type { RoomVoteDepth } from "../../../types";
import { api, safelyMakeApiCall } from "../../../utils/api";
import { WAYMO_DC_ROOM_ID } from "../../../utils/constants/flyers";
import { toRoomSearchOption } from "../../../utils/room-search";
import type { RoomSearchOption } from "../../RoomSearchPicker";
import { RoomActivityTab } from "./RoomActivityTab";

export function RoomActivityTabContainer() {
  const [selectedRoomId, setSelectedRoomId] = useState(WAYMO_DC_ROOM_ID);
  const [roomOptions, setRoomOptions] = useState<RoomSearchOption[]>([]);
  const [isLoadingRoomOptions, setIsLoadingRoomOptions] = useState(true);
  const [roomVoteDepth, setRoomVoteDepth] = useState<RoomVoteDepth | null>(null);
  const [roomVoteDepthError, setRoomVoteDepthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    safelyMakeApiCall(() => api.getRoomsForReview()).then((response) => {
      if (cancelled) return;
      if (response?.success && response.data) {
        setRoomOptions(response.data.rooms.map(toRoomSearchOption));
      }
      setIsLoadingRoomOptions(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRoomVoteDepth(null);
    setRoomVoteDepthError(null);

    api.getRoomVoteDepth(selectedRoomId).then((response) => {
      if (cancelled) return;
      if (response.success && response.data) {
        setRoomVoteDepth(response.data);
      } else {
        setRoomVoteDepthError(response.error ?? "Failed to load room activity");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedRoomId]);

  return (
    <RoomActivityTab
      roomVoteDepth={roomVoteDepth}
      roomVoteDepthError={roomVoteDepthError}
      selectedRoomId={selectedRoomId}
      roomOptions={roomOptions}
      isLoadingRoomOptions={isLoadingRoomOptions}
      onSelectRoom={setSelectedRoomId}
    />
  );
}
