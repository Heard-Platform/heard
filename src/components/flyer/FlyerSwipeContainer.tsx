import { useEffect, useState } from "react";
import * as Sentry from "@sentry/react";
import { motion } from "motion/react";
import type { DebateRoom, DeckOrder, Statement, VoteType } from "../../types";
import { api, safelyMakeApiCall } from "../../utils/api";
import { useDebateSession } from "../../hooks/useDebateSession";
import { useEmailOtpFlow, type EmailOtpFlow } from "../../hooks/useEmailOtpFlow";
import { estimateClusterProbabilities } from "../../utils/cluster-estimation";
import { summarizeTribe } from "../../utils/tribe-summary";
import { FLYER_EXTRA_CARD_COUNT, flyerCandidates, toMinimapClusters } from "../../utils/flyer-deck";
import { useOrderedStatements } from "../../hooks/useOrderedStatements";
import { FlyerSwipeScreen } from "./FlyerSwipeScreen";
import { SaveSpotDrawer } from "./SaveSpotDrawer";
import type { SwipeVote } from "./FlyerSwipeCard";
import type { FlyerVote } from "./FlyerVoteIntroCard";

export type FlyerCompleteReason = "signup" | "otp-login" | "continue";

interface FlyerSwipeContainerProps {
  room: DebateRoom;
  flyerStatementId: string;
  flyerVote: FlyerVote;
  onComplete: (roomId: string, reason: FlyerCompleteReason) => void;
}

interface FlyerDeck {
  flyerStatement: Statement;
  candidates: Statement[];
  deckOrder: DeckOrder | null;
}


export function FlyerSwipeContainer(props: FlyerSwipeContainerProps) {
  return (
    <div className="heard-feed-bg h-dvh overflow-y-auto">
      <div className="mx-auto min-h-full max-w-md">
        <Sentry.ErrorBoundary fallback={<LeaveOnError onLeave={() => props.onComplete(props.room.id, "continue")} />}>
          <FlyerSwipeFlow {...props} />
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

function FlyerSwipeFlow({ room, flyerStatementId, flyerVote, onComplete }: FlyerSwipeContainerProps) {
  const { user, getRoomStatements, voteOnStatement } = useDebateSession();
  const [deck, setDeck] = useState<FlyerDeck | null>(null);
  const [votes, setVotes] = useState<Record<string, VoteType>>({});
  const [isSaveSpotOpen, setIsSaveSpotOpen] = useState(false);
  const isLoggedIn = !!user && !user.isAnonymous;
  const track = (type: string) => api.trackEvent(type, room.id);

  const emailFlow = useEmailOtpFlow({
    onComplete: ({ wasOtpLogin }) => {
      track("flyer_results_email_submitted");
      onComplete(room.id, wasOtpLogin ? "otp-login" : "signup");
    },
  });

  useEffect(() => {
    track("flyer_swipe_opened");
    loadDeck();
  }, []);

  const votedCount = Object.keys(votes).length;
  const candidates = deck?.candidates ?? [];
  const unswiped = candidates.filter((statement) => !votes[statement.id]);
  const orderedUnswiped = useOrderedStatements(unswiped, deck?.deckOrder ?? null, {
    [flyerStatementId]: flyerVote,
    ...votes,
  });
  const total = 1 + Math.min(FLYER_EXTRA_CARD_COUNT, candidates.length);
  const cardsLeft = total - 1 - (candidates.length - unswiped.length);
  const upcoming = orderedUnswiped.slice(0, cardsLeft);
  const isDone = deck !== null && votedCount >= total;

  useEffect(() => {
    if (isDone) track("flyer_swipe_results_viewed");
  }, [isDone]);

  useEffect(() => {
    if (emailFlow.step === "otp") track("flyer_save_spot_code_step_shown");
  }, [emailFlow.step]);

  useEffect(() => {
    if (!emailFlow.error) return;
    track(emailFlow.step === "email" ? "flyer_save_spot_email_error" : "flyer_save_spot_code_error");
  }, [emailFlow.error]);

  const loadDeck = async () => {
    const [statements, deckOrderResponse] = await Promise.all([
      getRoomStatements(room.id),
      safelyMakeApiCall(() => api.getDeckOrder(room.id)),
    ]);
    const flyerStatement = statements.find((statement) => statement.id === flyerStatementId);
    if (!flyerStatement || !user) {
      onComplete(room.id, "continue");
      return;
    }
    const deckOrder = deckOrderResponse?.data?.deckOrder ?? null;
    setDeck({
      flyerStatement,
      candidates: flyerCandidates(statements, flyerStatementId, user.id),
      deckOrder,
    });
  };

  const handleVote = (statementId: string, vote: SwipeVote) => {
    track(`flyer_swipe_card_${votedCount + 1}_${vote}`);
    setVotes((current) => ({ ...current, [statementId]: vote }));
    if (statementId !== flyerStatementId) {
      voteOnStatement(statementId, vote).catch((error) => console.error("Flyer swipe vote failed:", error));
    }
  };

  const handleClose = () => {
    track(isDone ? "flyer_swipe_closed_results" : `flyer_swipe_closed_${votedCount + 1}`);
    onComplete(room.id, "continue");
  };

  const handleJustLooking = () => {
    track("flyer_swipe_just_looking_clicked");
    onComplete(room.id, "continue");
  };

  const handleSaveSpot = () => {
    track("flyer_results_get_results_clicked");
    if (isLoggedIn) {
      onComplete(room.id, "continue");
    } else {
      setIsSaveSpotOpen(true);
    }
  };

  const handleNotNow = () => {
    track("flyer_save_spot_not_now_clicked");
    setIsSaveSpotOpen(false);
  };

  const handleDismissSaveSpot = () => {
    track("flyer_save_spot_dismissed");
    setIsSaveSpotOpen(false);
  };

  const trackedEmailFlow: EmailOtpFlow = {
    ...emailFlow,
    submitEmail: () => {
      track("flyer_save_spot_email_submitted");
      return emailFlow.submitEmail();
    },
    submitOtp: () => {
      track("flyer_save_spot_code_submitted");
      return emailFlow.submitOtp();
    },
    goBackToEmail: () => {
      track("flyer_save_spot_different_email_clicked");
      emailFlow.goBackToEmail();
    },
  };

  if (!deck) return <FlyerLoading />;

  const clusters = toMinimapClusters(deck.deckOrder);
  const clusterProbabilities =
    deck.deckOrder && votedCount > 0 ? estimateClusterProbabilities(deck.deckOrder, votes) : null;
  const tribeSummary =
    deck.deckOrder && clusterProbabilities && isDone
      ? summarizeTribe(deck.deckOrder, votes, clusterProbabilities)
      : null;
  const tribe = tribeSummary ? clusters[tribeSummary.clusterIndex] : null;
  const crossoverId = tribeSummary?.crossover?.statementId;
  const crossoverStatement = [deck.flyerStatement, ...candidates].find((statement) => statement.id === crossoverId) ?? null;

  return (
    <>
      <FlyerSwipeScreen
        topic={room.topic}
        flyerStatement={deck.flyerStatement}
        flyerVote={flyerVote}
        upcoming={upcoming}
        total={total}
        clusters={clusters}
        clusterProbabilities={clusterProbabilities}
        tribeSummary={tribeSummary}
        crossoverStatement={crossoverStatement}
        onVote={handleVote}
        onClose={handleClose}
        onSaveSpot={handleSaveSpot}
        onJustLooking={handleJustLooking}
      />
      <SaveSpotDrawer
        isOpen={isSaveSpotOpen}
        tribe={tribe}
        emailFlow={trackedEmailFlow}
        onNotNow={handleNotNow}
        onDismiss={handleDismissSaveSpot}
      />
    </>
  );
}

function FlyerLoading() {
  return (
    <div className="flex h-dvh items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="h-8 w-8 heard-spinner"
      />
    </div>
  );
}
