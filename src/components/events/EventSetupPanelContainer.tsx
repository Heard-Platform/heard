// @ts-ignore
import { toast } from "sonner@2.0.3";
import { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { EventSetupPanel } from "./EventSetupPanel";
import { api } from "../../utils/api";
import { orderByRoomOrder } from "../../utils/live-event";
import { createLiveEventLink } from "../../utils/url";
import type { Event, LiveEventView } from "../../types";

export function EventSetupPanelContainer({ event }: { event: Event }) {
  const [live, setLive] = useState<LiveEventView | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getLiveEvent(event.id).then((response) => {
      if (cancelled) return;
      if (response.success && response.data) {
        setLive(response.data.live);
      } else {
        toast.error(response.error || "Couldn't load the live session");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  const rooms = useMemo(
    () => orderByRoomOrder(_.sortBy(event.rooms, "createdAt"), live?.roomOrder ?? []),
    [event.rooms, live?.roomOrder],
  );

  if (!live) return null;

  const handleReorder = async (roomOrder: string[]) => {
    const previous = live;
    setLive({ ...live, roomOrder });
    const response = await api.updateLiveEvent(event.id, { action: "reorder", roomOrder });
    if (response.success && response.data) {
      setLive(response.data.live);
    } else {
      setLive(previous);
      toast.error(response.error || "Couldn't save the new order");
    }
  };

  const handleOpenControls = () => {
    window.location.assign(createLiveEventLink(event.id, "moderate"));
  };

  return (
    <EventSetupPanel
      rooms={rooms}
      status={live.status}
      currentIndex={live.currentIndex}
      joinUrl={createLiveEventLink(event.id, "live")}
      displayUrl={createLiveEventLink(event.id, "display")}
      onReorder={handleReorder}
      onOpenControls={handleOpenControls}
    />
  );
}
