import { forwardRef, useRef, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { SwipeSixItem } from "../../types";
import { RaindownConfetti } from "../../RaindownConfetti";
import { Button } from "../ui/button";
import { FlyerProgressSegments } from "../flyer/FlyerProgress";
import { FlyerHeader } from "../flyer/FlyerSwipeScreen";
import {
  FlyerStackedCard,
  FlyerSwipeCard,
  type FlyerSwipeCardHandle,
  STACK_PEEK_PX,
  STACK_POSES,
  type SwipeVote,
} from "../flyer/FlyerSwipeCard";

export type SwipeSixPhase = "swiping" | "celebrating" | "done";


const isAddedByHost = ({ statement, room }: SwipeSixItem) =>
  statement.author === room.hostId;

interface SwipeSixScreenProps {
  items: SwipeSixItem[];
  votedCount: number;
  phase: SwipeSixPhase;
  onVote: (item: SwipeSixItem, vote: SwipeVote) => void;
  onClose: () => void;
  onAllDone: () => void;
  onBackToFeed: () => void;
}

export function SwipeSixScreen({
  items,
  votedCount,
  phase,
  onVote,
  onClose,
  onAllDone,
  onBackToFeed,
}: SwipeSixScreenProps) {
  return (
    <div className="heard-feed-bg relative flex min-h-full flex-1 flex-col overflow-clip px-5 pt-4 pb-5">
      <FlyerHeader onClose={onClose} />
      {phase === "swiping" && <SwipeSixSwiping items={items} votedCount={votedCount} onVote={onVote} />}
      {phase === "celebrating" && (
        <SwipeSixCelebration total={items.length} onAllDone={onAllDone} onBackToFeed={onBackToFeed} />
      )}
      {phase === "done" && <SwipeSixDone onBackToFeed={onBackToFeed} />}
    </div>
  );
}

interface SwipeSixSwipingProps {
  items: SwipeSixItem[];
  votedCount: number;
  onVote: (item: SwipeSixItem, vote: SwipeVote) => void;
}

function SwipeSixSwiping({ items, votedCount, onVote }: SwipeSixSwipingProps) {
  const stack = items.slice(votedCount);
  const current = stack[0];
  const cardsBehind = stack.slice(1, STACK_POSES.length);
  // Handles keyed by statement so a tap always reaches the card on top, never one that just flew off.
  const cardHandles = useRef(new Map<string, FlyerSwipeCardHandle>());
  const swipe = (vote: SwipeVote) => current && cardHandles.current.get(current.statement.id)?.swipe(vote);

  return (
    <>
      {current && <TopicSlider item={current} topicIndex={topicIndexAt(items, votedCount)} />}

      <div className="mt-5">
        <SwipeSixProgress votedCount={votedCount} total={items.length} />
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
    </>
  );
}

function SwipeSixProgress({ votedCount, total }: { votedCount: number; total: number }) {
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

// Pastel pill backgrounds, cycled per topic so back-to-back topics never share a color.
const TOPIC_PILL_COLORS = ["bg-amber-100", "bg-sky-100", "bg-rose-100", "bg-emerald-100", "bg-violet-100"];

// Which topic (0, 1, 2...) the card at this position belongs to, counting each change of post.
function topicIndexAt(items: SwipeSixItem[], position: number): number {
  return items.slice(1, position + 1).filter((item, i) => item.room.id !== items[i].room.id).length;
}

// A simulated horizontal scroller: when the topic changes, the old pill flies off left
// and the new one slides in from the right. The first topic slides in on open.
function TopicSlider({ item, topicIndex }: { item: SwipeSixItem; topicIndex: number }) {
  return (
    <>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide secondary-text">Topic</p>
      <div className="-mx-5 mt-1 overflow-hidden px-5">
        <AnimatePresence mode="popLayout" initial>
          <TopicPill
            key={item.room.id}
            item={item}
            colorClass={TOPIC_PILL_COLORS[topicIndex % TOPIC_PILL_COLORS.length]}
          />
        </AnimatePresence>
      </div>
    </>
  );
}

const TopicPill = forwardRef<HTMLDivElement, { item: SwipeSixItem; colorClass: string }>(function TopicPill(
  { item, colorClass },
  ref,
) {
  const { emoji, topic, subHeard } = item.room;
  return (
    <motion.div
      ref={ref}
      className={`rounded-xl px-3 py-2 ${colorClass}`}
      initial={{ x: "110%" }}
      animate={{ x: 0 }}
      exit={{ x: "-110%" }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      <p className="text-sm font-semibold leading-snug text-foreground">
        {emoji && <span className="mr-1">{emoji}</span>}
        {topic}
        {subHeard && <span className="font-medium secondary-text"> · {subHeard}</span>}
      </p>
    </motion.div>
  );
});

interface SwipeSixCelebrationProps {
  total: number;
  onAllDone: () => void;
  onBackToFeed: () => void;
}

function SwipeSixCelebration({ total, onAllDone, onBackToFeed }: SwipeSixCelebrationProps) {
  return (
    <div className="flex flex-1 flex-col">
      <RaindownConfetti />
      <div className="mt-5">
        <SwipeSixProgress votedCount={total} total={total} />
      </div>

      <div className="mt-10 text-center">
        <p className="text-3xl font-extrabold tracking-tight text-foreground">You did it!</p>
        <p className="mx-auto mt-3 max-w-72 text-base leading-snug secondary-text">
          Six swipes a day is all it takes to make your world a little brighter ☀️ See ya soon.
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-10">
        <Button size="lg" onClick={onAllDone}>
          All done for now
        </Button>
        <Button variant="outline" size="lg" onClick={onBackToFeed}>
          Back to feed
        </Button>
      </div>
    </div>
  );
}

function SwipeSixDone({ onBackToFeed }: { onBackToFeed: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="my-auto text-center">
        <p className="text-3xl font-extrabold tracking-tight text-foreground">You're done for today</p>
        <p className="mt-3 text-base secondary-text">That's all it takes. Go enjoy your day.</p>
      </div>
      <Button variant="link" size="sm" className="mx-auto secondary-text" onClick={onBackToFeed}>
        Back to feed
      </Button>
    </div>
  );
}
