import { useCallback, useEffect, useRef, useState } from "react";

export function useIdle(idleAfterMs: number) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsIdle(true), idleAfterMs);
  }, [idleAfterMs]);

  useEffect(() => {
    resetIdleTimer();
    return () => clearTimeout(timerRef.current);
  }, [resetIdleTimer]);

  return { isIdle, resetIdleTimer };
}
