import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { DebateRoom, Statement, SwipeSixItem } from "../types";
import { SwipeSixBanner } from "../components/swipe-six/SwipeSixBanner";
import { SwipeSixScreen, type SwipeSixPhase } from "../components/swipe-six/SwipeSixScreen";
import { SwipeSixFunnelChart } from "../components/devtools/feature-tracker/SwipeSixFunnelChart";
import { Button } from "../components/ui/button";
import { StoryContainer } from "./StoryContainer";

export default {
  title: "SwipeSix/SwipeSix",
};

const HOST_ID = "host";

const room = (id: string, topic: string, subHeard: string, emoji: string) =>
  ({ id, topic, subHeard, emoji, hostId: HOST_ID, createdAt: Date.now() }) as DebateRoom;

const statement = (id: string, roomId: string, text: string, author = HOST_ID) =>
  ({ id, roomId, text, author, agrees: 0, disagrees: 0, passes: 0, superAgrees: 0, timestamp: 0, round: 1, voters: {} }) as Statement;

const DC_BUSES = room("dc-buses", "Should DC add dedicated bus lanes on 16th Street, even if it means losing street parking and a lane for cars?", "washington-dc", "🚌");
const DC_METRO = room("dc-metro", "How should Metro close its budget gap?", "washington-dc", "🚇");
const COOKING = room("cooking", "Pineapple belongs on pizza", "cooking", "🍕");
const MUSIC = room("music", "The best decade for music was the 90s", "music", "🎸");

const SWIPE_SIX_ITEMS: SwipeSixItem[] = [
  { room: DC_BUSES, statement: statement("s1", DC_BUSES.id, "Bus lanes on 16th St would get me to work faster.") },
  { room: DC_BUSES, statement: statement("s2", DC_BUSES.id, "Losing parking on 16th St hurts local businesses.", "participant") },
  { room: COOKING, statement: statement("s3", COOKING.id, "Sweet and savory together is the whole point.") },
  { room: DC_METRO, statement: statement("s4", DC_METRO.id, "Maryland and Virginia should pay a bigger share.") },
  { room: DC_METRO, statement: statement("s5", DC_METRO.id, "Fare hikes are fine if service gets more frequent.", "participant") },
  { room: MUSIC, statement: statement("s6", MUSIC.id, "Nothing since has topped the 90s for albums start to finish.") },
];

// Repeats a realistic sentence and cuts it at a word boundary near the target length.
const LONG_SOURCE =
  "Bus lanes would speed up commutes for thousands of riders, but the city needs to talk to the small businesses along the corridor first, because losing parking and loading zones could hurt the shops that make the neighborhood worth visiting. ";
const textOfLength = (length: number) => {
  const repeated = LONG_SOURCE.repeat(Math.ceil(length / LONG_SOURCE.length) + 1);
  return `${repeated.slice(0, repeated.lastIndexOf(" ", length)).trim()}.`;
};

const LONG_STATEMENT_ITEMS: SwipeSixItem[] = [60, 120, 200, 300, 500, 1000].map((length, i) => {
  const postRoom = [DC_BUSES, COOKING, DC_METRO, MUSIC][i % 4];
  return { room: postRoom, statement: statement(`long-${length}`, postRoom.id, textOfLength(length)) };
});

const FUNNEL = { bannerShown: 1, started: 1, swipes: [1, 1, 1, 1, 1, 1], completed: 1, allDoneClicked: 1 };
const DAILY = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(Date.UTC(2026, 9, 6 + i)).toISOString().slice(0, 10),
  count: i % 3 === 0 ? 0 : 1,
}));

export function SwipeSixStory() {
  return (
    <StoryContainer
      title="Swipe Six"
      description="Dev-only daily six. The banner sits at the top of the feed until today's six is done. Swiping walks through all six, then the celebration, then the done screen. The pill glows gold when the topic changes. Long statements shows text shrinking to fit at 60 to 1000 characters."
      variants={[
        { id: "flow", label: "Full flow", children: <SwipeSixFlowDemo initialPhase="swiping" /> },
        {
          id: "long",
          label: "Long statements",
          children: <SwipeSixFlowDemo initialPhase="swiping" items={LONG_STATEMENT_ITEMS} />,
        },
        { id: "celebrating", label: "Celebration", children: <SwipeSixFlowDemo initialPhase="celebrating" /> },
        { id: "done", label: "Done", children: <SwipeSixFlowDemo initialPhase="done" /> },
        { id: "banner", label: "Feed banner", children: <BannerDemo /> },
        { id: "funnel", label: "Tracker funnel", children: <SwipeSixFunnelChart funnel={FUNNEL} daily={DAILY} /> },
      ]}
    />
  );
}

interface SwipeSixFlowDemoProps {
  initialPhase: SwipeSixPhase;
  items?: SwipeSixItem[];
}

function SwipeSixFlowDemo({ initialPhase, items = SWIPE_SIX_ITEMS }: SwipeSixFlowDemoProps) {
  const [votedCount, setVotedCount] = useState(initialPhase === "swiping" ? 0 : items.length);
  const [phase, setPhase] = useState<SwipeSixPhase>(initialPhase);

  const handleReplay = () => {
    setVotedCount(0);
    setPhase("swiping");
  };

  const handleVote = () => {
    const next = votedCount + 1;
    setVotedCount(next);
    if (next >= items.length) setPhase("celebrating");
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" className="gap-2" onClick={handleReplay}>
        <RotateCcw className="h-4 w-4" />
        Replay
      </Button>

      <div className="mx-auto flex h-195 w-97.5 max-w-full flex-col overflow-y-auto rounded-4xl border-8 [scrollbar-width:none] border-slate-900 shadow-2xl">
        <SwipeSixScreen
          items={items}
          votedCount={votedCount}
          phase={phase}
          onVote={handleVote}
          onClose={() => console.log("[Story] close")}
          onAllDone={() => setPhase("done")}
          onBackToFeed={() => console.log("[Story] back to feed")}
        />
      </div>
    </div>
  );
}

function BannerDemo() {
  return (
    <div className="heard-feed-bg mx-auto flex w-97.5 max-w-full justify-center rounded-2xl px-2 py-6">
      <SwipeSixBanner onStart={() => console.log("[Story] start swipe six")} />
    </div>
  );
}
