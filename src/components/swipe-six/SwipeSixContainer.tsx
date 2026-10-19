import { useEffect, useState } from "react";
import * as Sentry from "@sentry/react";
import type { SwipeSixItem } from "../../types";
import { api, safelyMakeApiCall } from "../../utils/api";
import { localDateString } from "../../utils/time";
import { useDebateSession } from "../../hooks/useDebateSession";
import type { SwipeVote } from "../flyer/FlyerSwipeCard";
import { SwipeSixScreen, type SwipeSixPhase } from "./SwipeSixScreen";

interface SwipeSixContainerProps {
  items: SwipeSixItem[];
  onCompleted: () => void;
  onExit: () => void;
}

export function SwipeSixContainer(props: SwipeSixContainerProps) {
  return (
    <div className="heard-feed-bg modal-layer fixed inset-0 h-dvh overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-md flex-col">
        <Sentry.ErrorBoundary fallback={<LeaveOnError onLeave={props.onExit} />}>
          <SwipeSixFlow {...props} />
        </Sentry.ErrorBoundary>
      </div>
    </div>
  );
}

function LeaveOnError({ onLeave }: { onLeave: () => void }) {
  useEffect(() => {
    onLeave();
  }, []);
  return null;
}

function SwipeSixFlow({ items, onCompleted, onExit }: SwipeSixContainerProps) {
  const { voteOnStatement } = useDebateSession();
  const [votedCount, setVotedCount] = useState(0);
  const [phase, setPhase] = useState<SwipeSixPhase>("swiping");

  useEffect(() => {
    api.trackEvent("swipe_six_started");
  }, []);

  const handleVote = (item: SwipeSixItem, vote: SwipeVote) => {
    const cardNumber = votedCount + 1;
    api.trackEvent(`swipe_six_card_${cardNumber}_${vote}`, item.room.id);
    voteOnStatement(item.statement.id, vote).catch((error) => console.error("Swipe six vote failed:", error));
    setVotedCount(cardNumber);
    if (cardNumber >= items.length) handleFinished();
  };

  const handleFinished = () => {
    api.trackEvent("swipe_six_completed");
    setPhase("celebrating");
    safelyMakeApiCall(() => api.completeSwipeSix(localDateString()));
    onCompleted();
  };

  const handleClose = () => {
    api.trackEvent(phase === "swiping" ? `swipe_six_closed_${votedCount + 1}` : `swipe_six_closed_${phase}`);
    onExit();
  };

  const handleAllDone = () => {
    api.trackEvent("swipe_six_all_done_clicked");
    setPhase("done");
  };

  const handleBackToFeed = () => {
    api.trackEvent(`swipe_six_back_to_feed_clicked_${phase}`);
    onExit();
  };

  return (
    <SwipeSixScreen
      items={items}
      votedCount={votedCount}
      phase={phase}
      onVote={handleVote}
      onClose={handleClose}
      onAllDone={handleAllDone}
      onBackToFeed={handleBackToFeed}
    />
  );
}
