import { useEffect, useState } from "react";
import type { RoomFlyerPlacements } from "../../../utils/dev-api";

export type RoomFlyersState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; roomFlyers: RoomFlyerPlacements }
  | { status: "error"; message: string };

export function useRoomFlyers(
  roomId: string | null,
  loadRoomFlyers: (roomId: string) => Promise<RoomFlyerPlacements>,
) {
  const [state, setState] = useState<RoomFlyersState>({ status: "idle" });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    setState({ status: "loading" });

    loadRoomFlyers(roomId)
      .then((roomFlyers) => {
        if (!cancelled) setState({ status: "loaded", roomFlyers });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({ status: "error", message: error instanceof Error ? error.message : "Failed to load flyers" });
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, loadRoomFlyers, reloadCount]);

  return { state, reload: () => setReloadCount((count) => count + 1) };
}
