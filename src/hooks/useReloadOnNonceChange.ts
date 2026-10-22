import { useEffect, useRef } from "react";

export function useReloadOnNonceChange(reloadNonce: number | undefined) {
  const firstNonceRef = useRef<number | null>(null);

  useEffect(() => {
    if (reloadNonce === undefined) return;
    if (firstNonceRef.current === null) firstNonceRef.current = reloadNonce;
    else if (reloadNonce !== firstNonceRef.current) window.location.reload();
  }, [reloadNonce]);
}
