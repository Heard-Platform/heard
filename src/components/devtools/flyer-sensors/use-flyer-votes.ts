import { useEffect, useState } from "react";
import { indexVotesByTapTime, type FlyerVoteTally, type FlyerVotesByTapTime } from "./flyer-votes";

export type FlyerVotesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; votes: FlyerVotesByTapTime }
  | { status: "error"; message: string };

export function useFlyerVotes(
  roomId: string | null,
  loadFlyerVotes: (roomId: string) => Promise<FlyerVoteTally[]>,
): FlyerVotesState {
  const [state, setState] = useState<FlyerVotesState>({ status: "idle" });

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    setState({ status: "loading" });

    loadFlyerVotes(roomId)
      .then((tallies) => {
        if (!cancelled) setState({ status: "loaded", votes: indexVotesByTapTime(tallies) });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to load flyer votes";
        setState({ status: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, loadFlyerVotes]);

  return state;
}
