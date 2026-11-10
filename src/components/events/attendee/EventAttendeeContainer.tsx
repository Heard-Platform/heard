// @ts-ignore
import { toast } from "sonner@2.0.3";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Sentry from "@sentry/react";
import type { LiveHeartbeat, Statement, VoteType } from "../../../types";
import { api } from "../../../utils/api";
import { APPROVAL_PENDING_MESSAGE } from "../../../utils/constants/text";
import { useAttendeeOnboarding } from "../../../hooks/useAttendeeOnboarding";
import { useDebateSession } from "../../../hooks/useDebateSession";
import { useEventPolling } from "../../../hooks/useEventPolling";
import { useEventPost } from "../../../hooks/useEventPost";
import { useReloadOnNonceChange } from "../../../hooks/useReloadOnNonceChange";
import { buildPostDeck, EVENT_POLL_MS, getAttendeeScreen, toLiveScreen } from "../../../utils/live-event";
import { Loader } from "../../widgets/Loader";
import { AttendeeFrame, AttendeeMessage } from "./AttendeeFrame";
import { EventLobby } from "./EventLobby";
import { EventOnboarding } from "./EventOnboarding";
import { EventSwipeScreen } from "./EventSwipeScreen";

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
  const [localVotes, setLocalVotes] = useState<Record<string, VoteType>>({});
  const [statementText, setStatementText] = useState("");
  const heartbeatRef = useRef<LiveHeartbeat | null>(null);
  const { eventState, error } = useEventPolling(eventId, EVENT_POLL_MS, () => heartbeatRef.current);
  const currentRoomId = eventState?.status === "live" ? eventState.currentRoomId : null;
  const { post, refresh: refreshPost, addStatement } = useEventPost(currentRoomId);
  const canAnswerQuestions =
    eventState?.status === "open" || eventState?.status === "live";

  const {
    questions,
    answeredQuestionIds,
    isLoadingOnboarding,
    isAnsweringQuestions,
    saveAnswer,
    finishOnboarding,
  } = useAttendeeOnboarding(eventId, canAnswerQuestions);

  const shownPost = post && post.room.id === currentRoomId ? post : null;
  const userId = user?.id ?? "";

  const deck = useMemo(
    () => (shownPost ? buildPostDeck(shownPost.statements, userId, localVotes) : null),
    [shownPost, userId, localVotes],
  );
  const cardsLeftCount = deck ? deck.statements.length - deck.votedCount : 0;
  const isWritingStatement = statementText.trim().length > 0;
  const screen = eventState
    ? getAttendeeScreen(eventState, {
        isAnsweringQuestions,
        hasCardsLeft: cardsLeftCount > 0,
        isWritingStatement,
      })
    : null;
  const isLoadingPost = (screen === "swiping" || screen === "waiting") && !shownPost;

  const heartbeatScreen =
    screen && !isLoadingPost ? toLiveScreen(screen) : null;

   heartbeatRef.current = heartbeatScreen
    ? { screen: heartbeatScreen, shownRoomId: currentRoomId }
    : null;

  useReloadOnNonceChange(eventState?.reloadNonce);

  useEffect(() => {
    if (eventState) api.trackEvent("live_joined");
  }, [!!eventState]);

  useEffect(() => {
    if (shownPost) api.trackEvent("live_post_shown", shownPost.room.id);
  }, [shownPost?.room.id]);

  useEffect(() => {
    setStatementText("");
  }, [currentRoomId]);

  useEffect(() => {
    if (screen !== "waiting") return;
    refreshPost();
    const timer = setInterval(refreshPost, EVENT_POLL_MS);
    return () => clearInterval(timer);
  }, [screen, refreshPost]);

  const handleVote = (statement: Statement, vote: VoteType) => {
    setLocalVotes((current) => ({ ...current, [statement.id]: vote }));
    voteOnStatement(statement.id, vote, { source: "event" }).catch(
      (voteError: Error) => {
        toast.error(
          voteError.message || "That vote didn't go through.",
        );
      },
    );
  };

  const handleSuperAgree = (statement: Statement) => {
    handleVote(statement, "super_agree");
  };

  const handleAddStatement = async (
    text: string,
    trackedEventType = "live_statement_added",
  ): Promise<boolean> => {
    if (!currentRoomId) return false;
    try {
      const { statement, isAwaitingApproval } = await submitStatement(
        currentRoomId,
        text,
        { source: "event" },
      );
      api.trackEvent(trackedEventType, currentRoomId);
      setStatementText("");
      if (isAwaitingApproval) {
        toast.success(APPROVAL_PENDING_MESSAGE);
      } else {
        toast.success("Added!");
        addStatement(statement);
      }
      refreshPost();
      return true;
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Couldn't add that. Try again.");
      return false;
    }
  };

  const handleVoteOnNewStatements = () => {
    api.trackEvent("live_new_statements_tapped", currentRoomId ?? undefined);
    setStatementText("");
  };

  if (!eventState && error) return <AttendeeNotice title="Can't find this event" body="Check the link and try again." />;
  if (
    !eventState ||
    !screen ||
    isLoadingPost ||
    isLoadingOnboarding
  ) {
    return <AttendeeLoading />;
  }

  switch (screen) {
    case "closed":
      return <EventLobby moment="closed" />;
    case "onboarding":
      return (
        <EventOnboarding
          questions={questions}
          welcomeVariant="joining-event"
          answeredQuestionIds={answeredQuestionIds}
          onAnswer={saveAnswer}
          onFinish={finishOnboarding}
        />
      );
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
          statementText={statementText}
          newStatementCount={cardsLeftCount}
          onStatementTextChange={setStatementText}
          onAddStatement={handleAddStatement}
          onVoteOnNewStatements={handleVoteOnNewStatements}
        />
      );
    case "swiping":
      return (
        <EventSwipeScreen
          room={shownPost!.room}
          statements={deck!.statements}
          votedCount={deck!.votedCount}
          onVote={handleVote}
          onSuperAgree={handleSuperAgree}
          onAddStatement={(text) =>
            handleAddStatement(text, "live_statement_added_mid_deck")
          }
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
