// @ts-ignore
import { toast } from "sonner@2.0.3";
import { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { ModeratorControls } from "./ModeratorControls";
import { ModeratorControlsEnded } from "./ModeratorControlsEnded";
import { ModeratorControlsRefusal } from "./ModeratorControlsRefusal";
import { Loader } from "../../widgets/Loader";
import { useEventPolling } from "../../../hooks/useEventPolling";
import { api } from "../../../utils/api";
import { orderByRoomOrder } from "../../../utils/live-event";
import type { Event, LiveEventAction, LiveEventView, ModeratorAction } from "../../../types";

const ACTION_EVENT_NAMES: Record<ModeratorAction, string> = {
  start: "live_started",
  next: "live_next",
  back: "live_back",
  pause: "live_paused",
  resume: "live_resumed",
  end: "live_ended",
};

const toRequest = (action: ModeratorAction, eventState: LiveEventView): LiveEventAction =>
  action === "next" || action === "back"
    ? { action, fromIndex: eventState.currentIndex ?? 0 }
    : { action };

export function ModeratorControlsContainer({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const { eventState, refresh, applyEventState } = useEventPolling(eventId);

  useEffect(() => {
    let cancelled = false;
    api.getEvent(eventId).then((response) => {
      if (cancelled) return;
      if (response.success && response.data) {
        setEvent(response.data.event);
      } else {
        setEventError(response.error || "Couldn't load this event");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const rooms = useMemo(
    () => orderByRoomOrder(_.sortBy(event?.rooms ?? [], "createdAt"), eventState?.roomOrder ?? []),
    [event?.rooms, eventState?.roomOrder],
  );

  if (eventError) {
    return <p className="p-6 text-center text-muted-foreground">{eventError}</p>;
  }

  if (!event || !eventState) return <LoadingScreen />;

  if (!event.canModerate) return <ModeratorControlsRefusal communityName={event.communityName} />;

  if (eventState.status === "ended") {
    return eventState.totals ? (
      <ModeratorControlsEnded eventName={event.name} postCount={eventState.roomOrder.length} totals={eventState.totals} />
    ) : (
      <LoadingScreen />
    );
  }

  const handleAction = async (action: ModeratorAction) => {
    setIsBusy(true);
    const response = await api.updateLiveEvent(eventId, toRequest(action, eventState));
    if (response.success && response.data) {
      applyEventState(response.data.live);
      api.trackEvent(ACTION_EVENT_NAMES[action], response.data.live.currentRoomId ?? undefined);
    } else {
      toast.error(response.error || "That didn't go through. Try again.");
      await refresh();
    }
    setIsBusy(false);
  };

  return (
    <ModeratorControls eventName={event.name} rooms={rooms} eventState={eventState} isBusy={isBusy} onAction={handleAction} />
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader />
    </div>
  );
}
