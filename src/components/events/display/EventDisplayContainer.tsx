import { useCallback, useEffect, useState } from "react";
import { EventDisplay } from "./EventDisplay";
import { Loader } from "../../widgets/Loader";
import { useEventAction } from "../../../hooks/useEventAction";
import { useEventPolling } from "../../../hooks/useEventPolling";
import { useEventPost } from "../../../hooks/useEventPost";
import { usePolling } from "../../../hooks/usePolling";
import type { EventPost } from "../../../types";
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
  const { eventState, error, refresh, applyEventState } = useEventPolling(eventId, {
    includesHeadcount: true,
    intervalMs: DISPLAY_POLL_MS,
  });
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
  const { post, refresh } = useEventPost(currentRoomId, {
    includesVoteCounts: true,
  });
  usePolling(refresh, {
    intervalMs: refreshIntervalMs,
    isEnabled: currentRoomId !== null,
  });
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

  const refreshQuestions = useCallback(
    async (stopSignal: AbortSignal): Promise<boolean> => {
      const response = await api.getAudienceBreakdown(
        eventId,
        displayKey,
      );
      if (stopSignal.aborted) return false;
      if (!response.success || !response.data) return false;
      setQuestions(response.data.questions);
      return true;
    },
    [eventId, displayKey],
  );

  useEffect(() => {
    if (!isShowing) setQuestions(null);
  }, [isShowing]);

  usePolling(refreshQuestions, {
    intervalMs: refreshIntervalMs,
    isEnabled: isShowing,
  });

  return questions;
}
