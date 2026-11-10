import { useRef, useState } from "react";
import { useMotionValue } from "motion/react";
import type { SwipeSixItem } from "../../types";
import { VoteButtonRow } from "../VoteButton";
import { SuperAgreeStarTrail } from "../SuperAgreeStarTrail";
import { RoomProgressBar } from "../room/RoomProgressBar";
import { FlyerProgressSegments } from "../flyer/FlyerProgress";
import {
  FlyerStackedCard,
  FlyerSwipeCard,
  type FlyerSwipeCardHandle,
  STACK_PEEK_PX,
  STACK_POSES,
  type SwipeVote,
} from "../flyer/FlyerSwipeCard";

interface StarTrail {
  id: number;
  startX: number;
}

const isAddedByHost = ({ statement, room }: SwipeSixItem) =>
  statement.author === room.hostId;

interface SwipeDeckProps {
  items: SwipeSixItem[];
  votedCount: number;
  onVote: (item: SwipeSixItem, vote: SwipeVote) => void;
  onSuperAgree?: (item: SwipeSixItem) => void;
}

export function SwipeDeck({ items, votedCount, onVote, onSuperAgree }: SwipeDeckProps) {
  const stack = items.slice(votedCount);
  const current = stack[0];
  const cardsBehind = stack.slice(1, STACK_POSES.length);
  // Handles keyed by statement so a tap always reaches the card on top, never one that just flew off.
  const cardHandles = useRef(new Map<string, FlyerSwipeCardHandle>());
  const swipe = (vote: SwipeVote) => current && cardHandles.current.get(current.statement.id)?.swipe(vote);
  const handleCardSuperAgreed = () => current && onSuperAgree?.(current);
  const heldAgreeChargeProgress = useMotionValue(0);

  const handleSuperAgreeHeld = () => {
    if (!current) return;
    cardHandles.current.get(current.statement.id)?.superAgree();
    heldAgreeChargeProgress.set(0);
  };
  const [starTrails, setStarTrails] = useState<StarTrail[]>([]);
  const nextStarTrailId = useRef(0);

  const handleSuperAgreeFlyOff = (startX: number) => {
    const id = nextStarTrailId.current++;
    setStarTrails((trails) => [...trails, { id, startX }]);
  };

  const removeStarTrail = (id: number) => {
    setStarTrails((trails) =>
      trails.filter((trail) => trail.id !== id),
    );
  };

  return (
    <>
      <div className="mt-4">
        <RoomProgressBar total={items.length} completed={votedCount} />
      </div>
      {current && (
        <h1 className="mt-4 text-xl font-bold leading-tight dark-text">
          {current.room.topic}
        </h1>
      )}

      <div
        className="relative mt-5 h-48"
        style={{ marginBottom: STACK_PEEK_PX }}
      >
        {cardsBehind.map((item, i) => (
          <FlyerStackedCard
            key={item.statement.id}
            statement={item.statement}
            depth={i + 1}
            addedByHost={isAddedByHost(item)}
          />
        ))}
        {current && (
          <FlyerSwipeCard
            ref={(handle) => {
              if (handle) cardHandles.current.set(current.statement.id, handle);
              else cardHandles.current.delete(current.statement.id);
            }}
            key={current.statement.id}
            statement={current.statement}
            addedByHost={isAddedByHost(current)}
            heldAgreeChargeProgress={heldAgreeChargeProgress}
            onDragStart={() => {}}
            onSwiped={(vote) => onVote(current, vote)}
            onSuperAgree={onSuperAgree && handleCardSuperAgreed}
            onSuperAgreeFlyOff={handleSuperAgreeFlyOff}
          />
        )}
        {starTrails.map((trail) => (
          <SuperAgreeStarTrail
            key={trail.id}
            startX={trail.startX}
            onFinished={() => removeStarTrail(trail.id)}
          />
        ))}
      </div>

      <div className="pt-4">
        <VoteButtonRow
          superAgreeChargeProgress={heldAgreeChargeProgress}
          onAgree={() => swipe("agree")}
          onDisagree={() => swipe("disagree")}
          onPass={() => swipe("pass")}
          onSuperAgree={onSuperAgree && handleSuperAgreeHeld}
        />
      </div>
    </>
  );
}

export function SwipeProgress({ votedCount, total }: { votedCount: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <FlyerProgressSegments votedCount={votedCount} total={total} />
      <span className="shrink-0 text-sm font-semibold secondary-text">
        {votedCount} of {total}
      </span>
    </div>
  );
}
