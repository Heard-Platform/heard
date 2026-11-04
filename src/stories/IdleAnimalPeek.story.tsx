import { useRef, useState, type ReactNode } from "react";
import {
  AnimalPeekLayer,
  IdleAnimalPeek,
  PEEK_VISIBLE_MS,
  randomPeek,
  type Peek,
} from "../components/room/IdleAnimalPeek";
import { VoteButtonRow } from "../components/VoteButton";
import { Button } from "../components/ui/button";
import { getPastelColor } from "../utils/colors";

const STORY_STATEMENT_ID = "idle-peek-story";

function StoryCard({ children }: { children: ReactNode }) {
  return (
    <div className={`relative p-6 rounded-xl border-2 shadow-xl ${getPastelColor(STORY_STATEMENT_ID)}`}>
      <div className="flex min-h-190px items-center justify-center">
        <p className="text-lg leading-relaxed text-center">
          Public transportation reduces traffic congestion and improves air quality
        </p>
      </div>
      {children}
    </div>
  );
}

export function IdleAnimalPeekStory() {
  return (
    <div className="p-6 flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Idle Animal Peek</h2>
      <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, 375px)" }}>
        <ManualPeekCard />
        <IdlePeekCard />
      </div>
    </div>
  );
}

function ManualPeekCard() {
  const [peek, setPeek] = useState<Peek | null>(null);
  const peekCountRef = useRef(0);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const peekNow = () => {
    peekCountRef.current++;
    setPeek(randomPeek(peekCountRef.current));
    clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setPeek(null), PEEK_VISIBLE_MS);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Manual</span>
        <Button size="sm" variant="outline" onClick={peekNow}>
          Peek now
        </Button>
      </div>
      <StoryCard>
        <AnimalPeekLayer peek={peek}>
          <VoteButtonRow onAgree={() => {}} onDisagree={() => {}} onPass={() => {}} />
        </AnimalPeekLayer>
      </StoryCard>
    </div>
  );
}

function IdlePeekCard() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-500">
        Real timer: leave the page alone for 6 seconds. Repeats every 10 seconds while idle.
        Any tap, key, scroll or wheel restarts the wait. Hidden with reduced motion or when the buttons
        aren't fully on screen.
      </p>
      <StoryCard>
        <IdleAnimalPeek>
          <VoteButtonRow onAgree={() => {}} onDisagree={() => {}} onPass={() => {}} />
        </IdleAnimalPeek>
      </StoryCard>
    </div>
  );
}
