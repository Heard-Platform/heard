import { useRef } from "react";
import type { SwipeSixItem } from "../../types";
import { VoteButtonRow } from "../VoteButton";
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

const isAddedByHost = ({ statement, room }: SwipeSixItem) =>
  statement.author === room.hostId;

interface SwipeDeckProps {
  items: SwipeSixItem[];
  votedCount: number;
  onVote: (item: SwipeSixItem, vote: SwipeVote) => void;
}

export function SwipeDeck({ items, votedCount, onVote }: SwipeDeckProps) {
  const stack = items.slice(votedCount);
  const current = stack[0];
  const cardsBehind = stack.slice(1, STACK_POSES.length);
  // Handles keyed by statement so a tap always reaches the card on top, never one that just flew off.
  const cardHandles = useRef(new Map<string, FlyerSwipeCardHandle>());
  const swipe = (vote: SwipeVote) => current && cardHandles.current.get(current.statement.id)?.swipe(vote);

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
            onDragStart={() => {}}
            onSwiped={(vote) => onVote(current, vote)}
          />
        )}
      </div>

      <div className="pt-4">
        <VoteButtonRow
          onAgree={() => swipe("agree")}
          onDisagree={() => swipe("disagree")}
          onPass={() => swipe("pass")}
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
