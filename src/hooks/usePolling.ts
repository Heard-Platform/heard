import { useEffect } from "react";
import { type Poll, startPollingLoop } from "../utils/polling-loop";

export interface PollingOptions {
  intervalMs: number;
  isEnabled?: boolean;
}

export function usePolling(
  poll: Poll,
  { intervalMs, isEnabled = true }: PollingOptions,
) {
  useEffect(() => {
    if (!isEnabled) return;
    const loop = startPollingLoop({
      poll,
      intervalMs,
      isPageHidden: () => document.hidden,
    });
    const handleVisibilityChange = () => {
      if (!document.hidden) loop.pollNow();
    };
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );
    return () => {
      loop.stop();
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [poll, intervalMs, isEnabled]);
}
