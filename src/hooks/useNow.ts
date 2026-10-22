import { useEffect, useState } from "react";

export function useNow(refreshIntervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), refreshIntervalMs);
    return () => clearInterval(timer);
  }, [refreshIntervalMs]);

  return now;
}
