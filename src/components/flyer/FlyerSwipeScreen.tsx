import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, X } from "lucide-react";
import type { Statement } from "../../types";
import {
  ClusterMinimap,
  type MinimapCluster,
} from "../room/ClusterMinimap";
import { FlyerProgress } from "./FlyerProgress";
import {
  FLYER_CARD_CLASS,
  FLYER_CARD_SHADOW,
  FlyerStackedCard,
  FlyerSwipeCard,
  STACK_PEEK_PX,
  STACK_POSES,
  type SwipeVote,
} from "./FlyerSwipeCard";
import {
  FlyerVoteIntroCard,
  type FlyerVote,
} from "./FlyerVoteIntroCard";
import { OnTheBoardBanner } from "./OnTheBoardBanner";
import type { TribeSummary } from "../../utils/tribe-summary";
import { RaindownConfetti } from "../../RaindownConfetti";
import {
  FLYER_MINIMAP_LAYOUT_ID,
  FlyerResults,
} from "./FlyerResults";

interface FlyerSwipeScreenProps {
  topic: string;
  flyerStatement: Statement;
  flyerVote: FlyerVote;
  statements: Statement[];
  clusters: MinimapCluster[];
  clusterProbabilities: number[] | null;
  tribeSummary: TribeSummary | null;
  onVote: (statementId: string, vote: SwipeVote) => void;
  onClose: () => void;
  onSaveSpot: () => void;
  onJustLooking: () => void;
}

export function FlyerSwipeScreen({
  topic,
  flyerStatement,
  flyerVote,
  statements,
  clusters,
  clusterProbabilities,
  tribeSummary,
  onVote,
  onClose,
  onSaveSpot,
  onJustLooking,
}: FlyerSwipeScreenProps) {
  const [votedCount, setVotedCount] = useState(0);
  const [hasStartedDragging, setHasStartedDragging] = useState(false);
  const deck = [flyerStatement, ...statements];
  const total = deck.length;
  const currentStatement = deck[votedCount];
  const cardsBehind = deck.slice(
    votedCount + 1,
    votedCount + STACK_POSES.length,
  );
  const showResults = votedCount >= total && tribeSummary !== null;

  const recordVote = (statementId: string, vote: SwipeVote) => {
    onVote(statementId, vote);
    setVotedCount((count) => count + 1);
  };

  return (
    <div className="heard-feed-bg relative flex min-h-full flex-col px-5 pb-5 pt-4">
      <FlyerHeader onClose={onClose} />
      <TopicPill topic={topic} />

      <div className="mt-5">
        <FlyerProgress votedCount={votedCount} total={total} />
      </div>

      {showResults ? (
        <>
          <RaindownConfetti />
          <div className="mt-5">
            <FlyerResults
              clusters={clusters}
              clusterProbabilities={clusterProbabilities}
              summary={tribeSummary}
              statements={deck}
              onSaveSpot={onSaveSpot}
              onJustLooking={onJustLooking}
            />
          </div>
        </>
      ) : (
        <>
          <div
            className="relative mt-5 h-60"
            style={{ marginBottom: STACK_PEEK_PX }}
          >
            {cardsBehind.map((statement, i) => (
              <FlyerStackedCard
                key={statement.id}
                statement={statement}
                depth={i + 1}
              />
            ))}
            {votedCount === 0 ? (
              <FlyerVoteIntroCard
                statement={flyerStatement}
                vote={flyerVote}
                onDismissed={() =>
                  recordVote(flyerStatement.id, flyerVote)
                }
              />
            ) : currentStatement ? (
              <FlyerSwipeCard
                key={currentStatement.id}
                statement={currentStatement}
                onDragStart={() => setHasStartedDragging(true)}
                onSwiped={(vote) =>
                  recordVote(currentStatement.id, vote)
                }
              />
            ) : (
              <AllVotedCard />
            )}
          </div>

          <AnimatePresence>
            {votedCount === 1 && (
              <motion.div
                className="-mx-2 overflow-hidden px-2"
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: "auto",
                  opacity: 1,
                  transition: {
                    height: { duration: 0.3, ease: "easeOut" },
                    opacity: { duration: 0.25, delay: 0.2 },
                  },
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                  transition: {
                    opacity: { duration: 0.2 },
                    height: {
                      duration: 0.3,
                      delay: 0.15,
                      ease: "easeInOut",
                    },
                  },
                }}
              >
                <div className="pb-3 pt-1">
                  <OnTheBoardBanner
                    remainingVotes={total - votedCount}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start justify-between gap-4 pt-3">
            <p className="max-w-40 text-sm leading-snug text-[#6B6760]">
              Swipe right to agree, left to disagree. Your dot will
              move as we find your tribe.
            </p>
            <ClusterMinimap
              clusters={clusters}
              clusterProbabilities={clusterProbabilities}
              layoutId={FLYER_MINIMAP_LAYOUT_ID}
            />
          </div>
        </>
      )}
    </div>
  );
}

function FlyerHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[28px] font-extrabold leading-none tracking-tight text-[#1C1B1F]">
        heard
      </span>
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8E3D6] text-[#1C1B1F]"
        aria-label="Close"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function TopicPill({ topic }: { topic: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#E8E3D6] px-3 py-2">
      <MessageCircle className="h-4 w-4 shrink-0 text-[#1C1B1F]" />
      <span className="text-sm font-semibold text-[#1C1B1F]">
        {topic}
      </span>
    </div>
  );
}

function AllVotedCard() {
  return (
    <div
      className={`${FLYER_CARD_CLASS} items-center justify-center text-center`}
      style={{ boxShadow: FLYER_CARD_SHADOW }}
    >
      <p className="text-2xl font-extrabold tracking-tight text-[#1C1B1F]">
        You found your tribe!
      </p>
      <p className="mt-2 text-sm text-[#6B6760]">
        See where you landed on the map.
      </p>
    </div>
  );
}
