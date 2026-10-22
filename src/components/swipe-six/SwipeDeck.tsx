import { useRef, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import type { SwipeSixItem } from "../../types";
import { Button } from "../ui/button";
import { FlyerProgressSegments } from "../flyer/FlyerProgress";
import {
  FlyerStackedCard,
  FlyerSwipeCard,
  type FlyerSwipeCardHandle,
  STACK_PEEK_PX,
  STACK_POSES,
  type SwipeVote,
} from "../flyer/FlyerSwipeCard";
import { TopicPill, topicPillColor } from "./TopicPill";

const isAddedByHost = ({ statement, room }: SwipeSixItem) =>
  statement.author === room.hostId;

interface SwipeDeckProps {
  items: SwipeSixItem[];
  votedCount: number;
  hideCommunity?: boolean;
  onVote: (item: SwipeSixItem, vote: SwipeVote) => void;
}

export function SwipeDeck({ items, votedCount, hideCommunity = false, onVote }: SwipeDeckProps) {
  const stack = items.slice(votedCount);
  const current = stack[0];
  const cardsBehind = stack.slice(1, STACK_POSES.length);
  // Handles keyed by statement so a tap always reaches the card on top, never one that just flew off.
  const cardHandles = useRef(new Map<string, FlyerSwipeCardHandle>());
  const swipe = (vote: SwipeVote) => current && cardHandles.current.get(current.statement.id)?.swipe(vote);

  return (
    <>
      {current && (
        <TopicSlider item={current} topicIndex={topicIndexAt(items, votedCount)} hideCommunity={hideCommunity} />
      )}

      <div className="mt-5">
        <SwipeProgress votedCount={votedCount} total={items.length} />
      </div>

      <div className="relative mt-5 h-60" style={{ marginBottom: STACK_PEEK_PX }}>
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

      <div className="grid grid-cols-3 gap-3 pt-4">
        <VoteButton label="Disagree" vote="disagree" icon={<X />} onClick={() => swipe("disagree")} />
        <VoteButton label="Pass" vote="pass" onClick={() => swipe("pass")} />
        <VoteButton label="Agree" vote="agree" icon={<Check />} onClick={() => swipe("agree")} />
      </div>
      <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs secondary-text">
        <span>← Swipe left</span>
        <span>↑ Swipe up</span>
        <span>Swipe right →</span>
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

interface VoteButtonProps {
  label: string;
  vote: SwipeVote;
  icon?: ReactNode;
  onClick: () => void;
}

function VoteButton({ label, vote, icon, onClick }: VoteButtonProps) {
  // The label carries the vote color so the outline variant's hover text color can't override it.
  return (
    <Button variant="outline" size="lg" className={`border-2 ${vote}-border`} onClick={onClick}>
      <span className={`flex items-center gap-1.5 font-bold ${vote}-text`}>
        {icon}
        {label}
      </span>
    </Button>
  );
}

// Which topic (0, 1, 2...) the card at this position belongs to, counting each change of post.
function topicIndexAt(items: SwipeSixItem[], position: number): number {
  return items.slice(1, position + 1).filter((item, i) => item.room.id !== items[i].room.id).length;
}

// A simulated horizontal scroller: when the topic changes, the old pill flies off left
// and the new one slides in from the right. The first topic slides in on open.
interface TopicSliderProps {
  item: SwipeSixItem;
  topicIndex: number;
  hideCommunity: boolean;
}

function TopicSlider({ item, topicIndex, hideCommunity }: TopicSliderProps) {
  return (
    <>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide secondary-text">
        Topic
      </p>
      <div className="-mx-5 mt-1 overflow-hidden px-5">
        <AnimatePresence mode="popLayout" initial>
          <TopicPill
            key={item.room.id}
            room={item.room}
            colorClass={topicPillColor(topicIndex)}
            hideCommunity={hideCommunity}
          />
        </AnimatePresence>
      </div>
    </>
  );
}
