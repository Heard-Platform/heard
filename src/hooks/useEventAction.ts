// @ts-ignore
import { toast } from "sonner@2.0.3";
import { useState } from "react";
import { api } from "../utils/api";
import type { LiveEventAction, LiveEventView, ModeratorAction } from "../types";

const TRACKED_EVENT_NAME_BY_ACTION: Record<ModeratorAction, string> = {
  start: "live_started",
  next: "live_next",
  back: "live_back",
  pause: "live_paused",
  resume: "live_resumed",
  end: "live_ended",
};

const toActionRequest = (action: ModeratorAction, eventState: LiveEventView): LiveEventAction =>
  action === "next" || action === "back" ? { action, fromIndex: eventState.currentIndex ?? 0 } : { action };

interface UseEventActionOptions {
  eventId: string;
  displayKey: string | null;
  eventState: LiveEventView | null;
  applyEventState: (eventState: LiveEventView) => void;
  refresh: () => Promise<void>;
}

export function useEventAction({ eventId, displayKey, eventState, applyEventState, refresh }: UseEventActionOptions) {
  const [isBusy, setIsBusy] = useState(false);

  const runAction = async (action: ModeratorAction) => {
    if (!eventState) return;
    setIsBusy(true);
    const response = await api.updateLiveEvent(eventId, toActionRequest(action, eventState), displayKey ?? undefined);
    if (response.success && response.data) {
      applyEventState(response.data.live);
      api.trackEvent(TRACKED_EVENT_NAME_BY_ACTION[action], response.data.live.currentRoomId ?? undefined);
    } else {
      toast.error(response.error || "That didn't go through. Try again.");
      await refresh();
    }
    setIsBusy(false);
  };

  return { isBusy, runAction };
}
