// @ts-ignore
import { toast } from "sonner@2.0.3";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Sentry from "@sentry/react";
import type { LiveHeartbeat, Statement } from "../../../types";
import { api } from "../../../utils/api";
import { useDebateSession } from "../../../hooks/useDebateSession";
import { EVENT_POLL_MS, useEventPolling } from "../../../hooks/useEventPolling";
import { useEventPost } from "../../../hooks/useEventPost";
import { useReloadOnNonceChange } from "../../../hooks/useReloadOnNonceChange";
import { buildPostDeck, getAttendeeScreen, toLiveScreen } from "../../../utils/live-event";
import type { SwipeVote } from "../../flyer/FlyerSwipeCard";
import { Loader } from "../../widgets/Loader";
import { AttendeeFrame, AttendeeMessage } from "./AttendeeFrame";
import { EventLobby } from "./EventLobby";
import { EventSwipeScreen } from "./EventSwipeScreen";

const WAITING_REFRESH_MS = 15_000;

export function EventAttendeeContainer({ eventId }: { eventId: string }) {
  return (
    <div className="heard-feed-bg h-dvh overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-md flex-col">
        <Sentry.ErrorBoundary fallback={<AttendeeNotice title="Something went wrong" body="Reload the page to rejoin." />}>
          <EventAttendeeFlow eventId={eventId} />
        </Sentry.ErrorBoundary>
      </div>
    </div>
  );
}

function EventAttendeeFlow({ eventId }: { eventId: string }) {
  const { user, voteOnStatement, submitStatement } = useDebateSession();
  const [localVotes, setLocalVotes] = useState<Record<string, SwipeVote>>({});
  const heartbeatRef = useRef<LiveHeartbeat | null>(null);
  const { eventState, error } = useEventPolling(eventId, EVENT_POLL_MS, () => heartbeatRef.current);
  const currentRoomId = eventState?.status === "live" ? eventState.currentRoomId : null;
  const { post, refresh: refreshPost, addStatement } = useEventPost(currentRoomId);
  const shownPost = post && post.room.id === currentRoomId ? post : null;
  const userId = user?.id ?? "";

  const deck = useMemo(
    () => (shownPost ? buildPostDeck(shownPost.statements, userId, localVotes) : null),
    [shownPost, userId, localVotes],
  );
  const hasCardsLeft = !!deck && deck.votedCount < deck.statements.length;
  const screen = eventState ? getAttendeeScreen(eventState, hasCardsLeft) : null;
  const isLoadingPost = (screen === "swiping" || screen === "waiting") && !shownPost;

  heartbeatRef.current = screen && !isLoadingPost ? { screen: toLiveScreen(screen), shownRoomId: currentRoomId } : null;

  useReloadOnNonceChange(eventState?.reloadNonce);

  useEffect(() => {
    if (eventState) api.trackEvent("live_joined");
  }, [!!eventState]);

  useEffect(() => {
    if (shownPost) api.trackEvent("live_post_shown", shownPost.room.id);
  }, [shownPost?.room.id]);

  useEffect(() => {
    if (screen !== "waiting") return;
    const timer = setInterval(refreshPost, WAITING_REFRESH_MS);
    return () => clearInterval(timer);
  }, [screen, refreshPost]);

  const handleVote = (statement: Statement, vote: SwipeVote) => {
    setLocalVotes((current) => ({ ...current, [statement.id]: vote }));
    voteOnStatement(statement.id, vote).catch((voteError: Error) => {
      toast.error(voteError.message || "That vote didn't go through.");
    });
  };

  const handleAddStatement = async (text: string): Promise<boolean> => {
    if (!currentRoomId) return false;
    try {
      const { statement } = await submitStatement(currentRoomId, text);
      api.trackEvent("live_statement_added", currentRoomId);
      addStatement(statement);
      refreshPost();
      return true;
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Couldn't add that. Try again.");
      return false;
    }
  };

  if (!eventState && error) return <AttendeeNotice title="Can't find this event" body="Check the link and try again." />;
  if (!eventState || !screen || isLoadingPost) return <AttendeeLoading />;

  switch (screen) {
    case "starting":
      return <EventLobby moment="starting" peopleHere={eventState.peopleHere} />;
    case "paused":
      return <EventLobby moment="paused" />;
    case "waiting":
      return (
        <EventLobby
          moment="waiting"
          peopleHere={eventState.peopleHere}
          finishedCurrentPost={eventState.finishedCurrentPost}
          onAddStatement={handleAddStatement}
        />
      );
    case "swiping":
      return (
        <EventSwipeScreen
          room={shownPost!.room}
          statements={deck!.statements}
          votedCount={deck!.votedCount}
          onVote={handleVote}
        />
      );
    case "end":
      return <EventLobby moment="ended" />;
  }
}

function AttendeeNotice({ title, body }: { title: string; body: string }) {
  return (
    <AttendeeFrame>
      <div className="my-auto">
        <AttendeeMessage title={title} body={body} />
      </div>
    </AttendeeFrame>
  );
}

function AttendeeLoading() {
  return (
    <AttendeeFrame>
      <div className="my-auto flex justify-center">
        <Loader />
      </div>
    </AttendeeFrame>
  );
}
