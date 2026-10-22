import type { SwipeSixItem } from "../../types";
import { RaindownConfetti } from "../../RaindownConfetti";
import { Button } from "../ui/button";
import { FlyerHeader } from "../flyer/FlyerSwipeScreen";
import type { SwipeVote } from "../flyer/FlyerSwipeCard";
import { SwipeDeck, SwipeProgress } from "./SwipeDeck";

export type SwipeSixPhase = "swiping" | "celebrating" | "done";
export type SwipeSixSource = "lobby" | "flyer";

interface SwipeSixEndCopy {
  celebrationBody: string;
  doneTitle: string;
  doneBody: string;
  exitLabel: string;
}

const END_COPY: Record<SwipeSixSource, SwipeSixEndCopy> = {
  lobby: {
    celebrationBody: "Six swipes a day is all it takes to make your world a little brighter ☀️ See ya soon.",
    doneTitle: "You're done for today",
    doneBody: "That's all it takes. Go enjoy your day.",
    exitLabel: "Back to feed",
  },
  flyer: {
    celebrationBody: "That's how Heard works: a few swipes and your neighbors hear you.",
    doneTitle: "You're all set",
    doneBody: "Thanks for weighing in. Go enjoy your day.",
    exitLabel: "See the flyer results",
  },
};

interface SwipeSixScreenProps {
  source: SwipeSixSource;
  items: SwipeSixItem[];
  votedCount: number;
  phase: SwipeSixPhase;
  onVote: (item: SwipeSixItem, vote: SwipeVote) => void;
  onClose: () => void;
  onAllDone: () => void;
  onBackToFeed: () => void;
}

export function SwipeSixScreen({
  source,
  items,
  votedCount,
  phase,
  onVote,
  onClose,
  onAllDone,
  onBackToFeed,
}: SwipeSixScreenProps) {
  const copy = END_COPY[source];

  return (
    <div className="heard-feed-bg relative flex min-h-full flex-1 flex-col overflow-clip px-5 pt-4 pb-5">
      <FlyerHeader onClose={onClose} />
      {phase === "swiping" && <SwipeDeck items={items} votedCount={votedCount} onVote={onVote} />}
      {phase === "celebrating" && (
        <SwipeSixCelebration copy={copy} total={items.length} onAllDone={onAllDone} onBackToFeed={onBackToFeed} />
      )}
      {phase === "done" && <SwipeSixDone copy={copy} onBackToFeed={onBackToFeed} />}
    </div>
  );
}

interface SwipeSixCelebrationProps {
  copy: SwipeSixEndCopy;
  total: number;
  onAllDone: () => void;
  onBackToFeed: () => void;
}

function SwipeSixCelebration({ copy, total, onAllDone, onBackToFeed }: SwipeSixCelebrationProps) {
  return (
    <div className="flex flex-1 flex-col">
      <RaindownConfetti />
      <div className="mt-5">
        <SwipeProgress votedCount={total} total={total} />
      </div>

      <div className="mt-10 text-center">
        <p className="text-3xl font-extrabold tracking-tight text-foreground">You did it!</p>
        <p className="mx-auto mt-3 max-w-72 text-base leading-snug secondary-text">
          {copy.celebrationBody}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-10">
        <Button size="lg" onClick={onAllDone}>
          All done for now
        </Button>
        <Button variant="outline" size="lg" onClick={onBackToFeed}>
          {copy.exitLabel}
        </Button>
      </div>
    </div>
  );
}

function SwipeSixDone({ copy, onBackToFeed }: { copy: SwipeSixEndCopy; onBackToFeed: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="my-auto text-center">
        <p className="text-3xl font-extrabold tracking-tight text-foreground">{copy.doneTitle}</p>
        <p className="mt-3 text-base secondary-text">{copy.doneBody}</p>
      </div>
      <Button variant="link" size="sm" className="mx-auto secondary-text" onClick={onBackToFeed}>
        {copy.exitLabel}
      </Button>
    </div>
  );
}
