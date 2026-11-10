import { useCallback, useEffect, useState } from "react";
import { EventDisplay } from "./EventDisplay";
import { Loader } from "../../widgets/Loader";
import { useEventAction } from "../../../hooks/useEventAction";
import { useEventPolling } from "../../../hooks/useEventPolling";
import { useEventPost, type EventPost } from "../../../hooks/useEventPost";
import { useReloadOnNonceChange } from "../../../hooks/useReloadOnNonceChange";
import type { AudienceBreakdownQuestion } from "../../../types";
import { api } from "../../../utils/api";
import {
  createEventJoinLink,
  createLiveEventLink,
} from "../../../utils/url";

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
  const [isShowingAudienceBreakdown, setIsShowingAudienceBreakdown] =
    useState(false);
  const audienceBreakdownQuestions = useBreakdownRefreshing(
    eventId,
    displayKey,
    isShowingAudienceBreakdown,
    DISPLAY_POLL_MS,
  );

  const handleShowAudienceBreakdown = () => {
    setIsShowingAudienceBreakdown(true);
    api.trackEvent(
      "live_audience_breakdown_shown",
      eventState?.currentRoomId ?? undefined,
    );
  };

  const handleCloseAudienceBreakdown = useCallback(
    () => setIsShowingAudienceBreakdown(false),
    [],
  );

  const currentRoomId = eventState?.currentRoomId ?? undefined;
  const handleScreenHidden = useCallback(
    () => api.trackEvent("live_display_hidden", currentRoomId),
    [currentRoomId],
  );

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
      reportUrl={createLiveEventLink(eventId, "report")}
      isBusy={isBusy}
      isShowingAudienceBreakdown={isShowingAudienceBreakdown}
      audienceBreakdownQuestions={audienceBreakdownQuestions}
      onAction={runAction}
      onShowAudienceBreakdown={handleShowAudienceBreakdown}
      onCloseAudienceBreakdown={handleCloseAudienceBreakdown}
      onScreenHidden={handleScreenHidden}
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

function useBreakdownRefreshing(
  eventId: string,
  displayKey: string | null,
  isShowing: boolean,
  refreshIntervalMs: number,
): AudienceBreakdownQuestion[] | null {
  const [questions, setQuestions] = useState<
    AudienceBreakdownQuestion[] | null
  >(null);

  useEffect(() => {
    if (!isShowing) {
      setQuestions(null);
      return;
    }
    let isCancelled = false;
    const refresh = async () => {
      if (document.hidden) return;
      const response = await api.getAudienceBreakdown(
        eventId,
        displayKey,
      );
      if (isCancelled) return;
      if (response.success && response.data) {
        setQuestions(response.data.questions);
      }
    };
    refresh();
    const timer = setInterval(refresh, refreshIntervalMs);
    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [eventId, displayKey, isShowing, refreshIntervalMs]);

  return questions;
}
