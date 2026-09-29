import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { api, safelyMakeApiCall } from "../../../utils/api";
import { ClusterNameReviewRoom } from "../../../types";
import { ClusterNamingToggle } from "./ClusterNamingToggle";
import { ClusterNamesReviewRow } from "./ClusterNamesReviewRow";
// @ts-ignore
import { toast } from "sonner@2.0.3";

const PAGE_SIZE = 25;

export function ClusterNamesReview() {
  const [rooms, setRooms] = useState<ClusterNameReviewRoom[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regeneratingRoomId, setRegeneratingRoomId] = useState<string | null>(null);

  const loadPage = async (offset: number) => {
    setLoading(true);
    const response = await safelyMakeApiCall(() => api.getClusterNamesForReview(offset, PAGE_SIZE));
    if (response?.success && response.data) {
      const page = response.data.rooms;
      setRooms((current) => (offset === 0 ? page : [...current, ...page]));
      setHasMore(response.data.hasMore);
    } else {
      toast.error("Failed to load rooms");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPage(0);
  }, []);

  const handleRegenerate = async (roomId: string) => {
    setRegeneratingRoomId(roomId);
    const response = await api.regenerateClusterNames(roomId);
    if (response.success && response.data) {
      const updated = response.data.room;
      setRooms((current) => current.map((room) => (room.roomId === roomId ? updated : room)));
    } else {
      toast.error(response.error ?? "Failed to re-run naming");
    }
    setRegeneratingRoomId(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Cluster Names</h3>
        <p className="text-sm text-slate-600">
          Every room, most recent first. Re-run naming to generate fresh names for a room's clusters.
        </p>
      </div>

      <ClusterNamingToggle />

      <div className="divide-y border rounded-lg bg-white">
        {rooms.map((room) => (
          <ClusterNamesReviewRow
            key={room.roomId}
            room={room}
            regenerating={regeneratingRoomId === room.roomId}
            onRegenerate={handleRegenerate}
          />
        ))}
        {!loading && rooms.length === 0 && (
          <p className="p-4 text-sm text-slate-600">No rooms found</p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        </div>
      ) : (
        hasMore && (
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={() => loadPage(rooms.length)}>
              Load more
            </Button>
          </div>
        )
      )}
    </div>
  );
}
