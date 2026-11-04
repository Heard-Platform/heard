import { useEffect, useState } from "react";
import { api, safelyMakeApiCall } from "../utils/api";
import { toRoomSearchOption } from "../utils/room-search";
import type { RoomSearchOption } from "../components/RoomSearchPicker";
// @ts-ignore
import { toast } from "sonner@2.0.3";

export function useRoomSearchOptions() {
  const [roomOptions, setRoomOptions] = useState<RoomSearchOption[]>([]);
  const [isLoadingRoomOptions, setIsLoadingRoomOptions] = useState(true);

  useEffect(() => {
    let cancelled = false;

    safelyMakeApiCall(() => api.getRoomSummaries()).then((response) => {
      if (cancelled) return;
      if (response?.success && response.data) {
        setRoomOptions(response.data.rooms.map(toRoomSearchOption));
      } else {
        toast.error("Failed to load rooms");
      }
      setIsLoadingRoomOptions(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { roomOptions, isLoadingRoomOptions };
}
