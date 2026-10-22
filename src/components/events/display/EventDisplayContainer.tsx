import { useEffect, useState } from "react";
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
  const shownPost = usePostKeptUntilNextLoads(eventState?.currentRoomId ?? null);
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
      post={shownPost}
      joinUrl={joinLink.url}
      joinLabel={joinLink.label}
      isBusy={isBusy}
      onAction={runAction}
    />
  );
}

function usePostKeptUntilNextLoads(currentRoomId: string | null): EventPost | null {
  const { post, refresh } = useEventPost(currentRoomId);
  const [shownPost, setShownPost] = useState<EventPost | null>(null);

  useEffect(() => {
    if (post) setShownPost(post);
  }, [post]);

  useEffect(() => {
    if (!currentRoomId) return;
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, DISPLAY_POLL_MS);
    return () => clearInterval(timer);
  }, [currentRoomId, refresh]);

  return shownPost;
}
