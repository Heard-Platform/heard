import { useCallback, useRef, useState } from "react";
import { api } from "../utils/api";
import {
  EVENT_POLL_MS,
  pickNewestState,
  type SentHeartbeat,
  shouldSendHeartbeat,
} from "../utils/live-event";
import type { LiveEventView, LiveHeartbeat } from "../types";
import { usePolling } from "./usePolling";

export function useEventPolling(
  eventId: string,
  intervalMs: number = EVENT_POLL_MS,
  getHeartbeat?: () => LiveHeartbeat | null,
) {
  const [eventState, setEventState] = useState<LiveEventView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const getHeartbeatRef = useRef(getHeartbeat);
  const lastHeartbeatRef = useRef<SentHeartbeat | null>(null);
  getHeartbeatRef.current = getHeartbeat;

  const nextHeartbeat = (): LiveHeartbeat | undefined => {
    const heartbeat = getHeartbeatRef.current?.();
    const now = Date.now();
    if (!heartbeat || !shouldSendHeartbeat(lastHeartbeatRef.current, heartbeat, now)) return undefined;
    lastHeartbeatRef.current = { heartbeat, sentAt: now };
    return heartbeat;
  };

  const applyEventState = useCallback((incoming: LiveEventView) => {
    setEventState((current) => pickNewestState(current, incoming));
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    const response = await api.getLiveEvent(eventId, nextHeartbeat());
    if (response.success && response.data) {
      setError(null);
      applyEventState(response.data.live);
      return true;
    }
    setError(response.error || "Couldn't reach the event");
    return false;
  }, [eventId, applyEventState]);

  usePolling(refresh, intervalMs, true);

  return { eventState, error, refresh, applyEventState };
}
