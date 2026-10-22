import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../utils/api";
import { getIntervalWithBackoff as getIntervalWithBackoff, pickNewestState } from "../utils/live-event";
import type { LiveEventView } from "../types";

export const EVENT_POLL_MS = 3000;

export function useEventPolling(eventId: string, intervalMs: number = EVENT_POLL_MS) {
  const [eventState, setEventState] = useState<LiveEventView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const failuresRef = useRef(0);

  const applyEventState = useCallback((incoming: LiveEventView) => {
    setEventState((current) => pickNewestState(current, incoming));
  }, []);

  const refresh = useCallback(async () => {
    const response = await api.getLiveEvent(eventId);
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
