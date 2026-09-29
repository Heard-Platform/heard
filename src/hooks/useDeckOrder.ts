import { useEffect, useState } from "react";
import { api, safelyMakeApiCall } from "../utils/api";
import { DeckOrder } from "../types";

export function useDeckOrder(roomId: string): DeckOrder | null {
  const [deckOrder, setDeckOrder] = useState<DeckOrder | null>(null);

  useEffect(() => {
    let cancelled = false;
    safelyMakeApiCall(() => api.getDeckOrder(roomId)).then((response) => {
      if (!cancelled && response?.success && response.data) setDeckOrder(response.data.deckOrder);
    });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  return deckOrder;
}
