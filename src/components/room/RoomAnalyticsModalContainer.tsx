import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { api, safelyMakeApiCall } from "../../utils/api";
import { RoomAnalyticsModal } from "./RoomAnalyticsModal";
import type { AnonymityBreakdown, ReferrerShareCount, TrafficSourceCount } from "./RoomAnalyticsModal";

interface RoomAnalyticsModalContainerProps {
  roomId: string;
  roomTopic: string;
  onClose: () => void;
}

export function RoomAnalyticsModalContainer({
  roomId,
  roomTopic,
  onClose,
}: RoomAnalyticsModalContainerProps) {
  const [data, setData] = useState<{
    trafficSources: TrafficSourceCount[];
    referrers: ReferrerShareCount[];
    anonymity: AnonymityBreakdown;
  } | null>(null);
  const [loading, setLoading] = useState(true);

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
      onClose={onClose}
    />
  );
}
