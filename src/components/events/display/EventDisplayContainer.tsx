import { useEffect } from "react";
import { EventDisplay } from "./EventDisplay";
import { Loader } from "../../widgets/Loader";
import { useEventAction } from "../../../hooks/useEventAction";
import { useEventPolling } from "../../../hooks/useEventPolling";
import { useEventPost, type EventPost } from "../../../hooks/useEventPost";
import { useReloadOnNonceChange } from "../../../hooks/useReloadOnNonceChange";
import { createEventJoinLink } from "../../../utils/url";

const DISPLAY_POLL_MS = 2000;

interface EventDisplayContainerProps {
  eventId: string;
  displayKey: string | null;
}

export function EventDisplayContainer({ eventId, displayKey }: EventDisplayContainerProps) {
  const { eventState, error, refresh, applyEventState } = useEventPolling(eventId, DISPLAY_POLL_MS);
  const { isBusy, runAction } = useEventAction({ eventId, displayKey, eventState, applyEventState, refresh });
  const post = useEventPostRefreshedEvery(eventState?.currentRoomId ?? null, DISPLAY_POLL_MS);
  useReloadOnNonceChange(eventState?.reloadNonce);

  if (!eventState) {
    return error ? (
      <p className="p-6 text-center text-muted-foreground">{error}</p>
    ) : (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  const joinLink = createEventJoinLink(eventId);

  return (
    <EventDisplay
      eventState={eventState}
      post={post}
      joinUrl={joinLink.url}
      joinLabel={joinLink.label}
      isBusy={isBusy}
      onAction={runAction}
    />
  );
}

function useEventPostRefreshedEvery(currentRoomId: string | null, refreshIntervalMs: number): EventPost | null {
  const { post, refresh } = useEventPost(currentRoomId);

  useEffect(() => {
    if (!currentRoomId) return;
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [currentRoomId, refresh, refreshIntervalMs]);

  return post;
}
