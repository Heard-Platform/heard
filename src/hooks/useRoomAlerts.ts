import { useCallback, useEffect, useState } from "react";
import type { RoomAlert } from "../types";
import { api, safelyMakeApiCall } from "../utils/api";

const POLL_INTERVAL_MS = 30_000;

export interface RoomAlertsState {
  alerts: RoomAlert[];
  refresh: () => Promise<void>;
  clearAlert: (roomId: string) => void;
}

export function useRoomAlerts(): RoomAlertsState {
  const [alerts, setAlerts] = useState<RoomAlert[]>([]);

  const refresh = useCallback(async () => {
    const response = await safelyMakeApiCall(() => api.getRoomAlerts());
    if (response?.data) setAlerts(response.data.alerts);
  }, []);

  const clearAlert = useCallback((roomId: string) => {
    setAlerts((prev) => prev.filter((a) => a.roomId !== roomId));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return { alerts, refresh, clearAlert };
}
