import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../utils/api";
import {
  EVENT_POLL_MS,
  getIntervalWithBackoff as getIntervalWithBackoff,
  pickNewestState,
  type SentHeartbeat,
  shouldSendHeartbeat,
} from "../utils/live-event";
import type { LiveEventView, LiveHeartbeat } from "../types";

export function useEventPolling(
  eventId: string,
  intervalMs: number = EVENT_POLL_MS,
  getHeartbeat?: () => LiveHeartbeat | null,
) {
  const [eventState, setEventState] = useState<LiveEventView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const failuresRef = useRef(0);
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

  const refresh = useCallback(async () => {
    const response = await api.getLiveEvent(eventId, nextHeartbeat());
    if (response.success && response.data) {
      failuresRef.current = 0;
      setError(null);
      applyEventState(response.data.live);
    } else {
      failuresRef.current += 1;
      setError(response.error || "Couldn't reach the event");
    }
  }, [eventId, applyEventState]);

  useEffect(() => {
    let cancelled = false;
    let loopId = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async (id: number) => {
      if (!document.hidden) await refresh();
      if (cancelled || id !== loopId) return;
      timer = setTimeout(() => run(id), getIntervalWithBackoff(intervalMs, failuresRef.current));
    };

    const restart = () => {
      loopId += 1;
      clearTimeout(timer);
      run(loopId);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) restart();
    };

    restart();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh, intervalMs]);

  return { eventState, error, refresh, applyEventState };
}
