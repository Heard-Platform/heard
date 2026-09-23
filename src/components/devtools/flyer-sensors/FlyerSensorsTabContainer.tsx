import { useEffect, useState } from "react";
import { api, safelyMakeApiCall } from "../../../utils/api";
import { FlyerSensorsTab } from "./FlyerSensorsTab";
import type { RoomOption } from "./RoomPicker";
import type { FlyerPlacementsSavePayload } from "./save-payload";
import type { FlyerVoteTally } from "./flyer-votes";

async function saveFlyerPlacements(payload: FlyerPlacementsSavePayload): Promise<void> {
  console.info("Flyer placements save payload", payload);
  throw new Error("Saving isn't connected to the backend yet. The payload was logged to the console.");
}

async function loadFlyerVotes(): Promise<FlyerVoteTally[]> {
  throw new Error("flyer votes aren't connected to the backend yet");
}

export function FlyerSensorsTabContainer() {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    safelyMakeApiCall(() => api.getAllPosts()).then((response) => {
      if (cancelled) return;
      const posts = response?.success ? response.data?.posts ?? [] : [];
      setRooms(posts.map(({ id, topic, createdAt }) => ({ id, topic, createdAt })));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FlyerSensorsTab
      rooms={rooms}
      roomsLoading={loading}
      loadFlyerVotes={loadFlyerVotes}
      onSave={saveFlyerPlacements}
    />
  );
}
