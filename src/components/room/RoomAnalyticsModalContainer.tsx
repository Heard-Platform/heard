import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { api, safelyMakeApiCall } from "../../utils/api";
import { RoomAnalyticsModal } from "./RoomAnalyticsModal";
import type { AnonymityBreakdown, ParticipationBreakdown, ReferrerShareCount, TrafficSourceCount } from "./RoomAnalyticsModal";
import type { RoomDebugData } from "./RoomDebugDataPanel";

interface RoomAnalyticsModalContainerProps {
  roomId: string;
  roomTopic: string;
  isDeveloper?: boolean;
  onClose: () => void;
}

export function RoomAnalyticsModalContainer({
  roomId,
  roomTopic,
  isDeveloper,
  onClose,
}: RoomAnalyticsModalContainerProps) {
  const [data, setData] = useState<{
    trafficSources: TrafficSourceCount[];
    referrers: ReferrerShareCount[];
    anonymity: AnonymityBreakdown;
    participation: ParticipationBreakdown;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugData, setDebugData] = useState<RoomDebugData | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugRequested, setDebugRequested] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await safelyMakeApiCall(() => api.getRoomTrafficSources(roomId));
      if (response?.success && response.data) {
        setData(response.data);
      }
      setLoading(false);
    };
    load();
  }, [roomId]);

  const handleDebugTabOpen = () => {
    if (debugRequested) return;
    setDebugRequested(true);
    setDebugLoading(true);
    (async () => {
      const response = await safelyMakeApiCall(() => api.getRoomDebugData(roomId));
      if (response?.success && response.data) {
        setDebugData(response.data);
      }
      setDebugLoading(false);
    })();
  };

  if (loading || !data) {
    return (
      <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
        <DialogContent className="max-w-md w-full">
          <DialogTitle className="line-clamp-1 pr-8">Room analytics</DialogTitle>
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            {loading ? "Loading…" : "Failed to load analytics."}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <RoomAnalyticsModal
      roomTopic={roomTopic}
      trafficSources={data.trafficSources}
      referrers={data.referrers}
      anonymity={data.anonymity}
      participation={data.participation}
      isDeveloper={isDeveloper}
      debugData={debugData}
      debugLoading={debugLoading}
      onDebugTabOpen={handleDebugTabOpen}
      onClose={onClose}
    />
  );
}
