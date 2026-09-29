import { useState } from "react";
import { RotateCcw, Shuffle } from "lucide-react";
import { FlyerSwipeScreen } from "../components/flyer/FlyerSwipeScreen";
import type { SwipeVote } from "../components/flyer/FlyerSwipeCard";
import type { FlyerVote } from "../components/flyer/FlyerVoteIntroCard";
import type { MinimapCluster } from "../components/room/ClusterMinimap";
import { Button } from "../components/ui/button";
import { estimateClusterProbabilities } from "../utils/cluster-estimation";
import { summarizeTribe } from "../utils/tribe-summary";
import type { DeckOrder, Statement, VoteRates } from "../types";
import { StoryContainer } from "./StoryContainer";

export default {
  title: "Flyer/FlyerSwipeScreen",
};

const TOPIC = "Should DC let driverless cars on its streets?";

const MOSTLY_AGREES: VoteRates = [0.85, 0.1, 0.05];
const MOSTLY_DISAGREES: VoteRates = [0.1, 0.85, 0.05];
const SPLIT: VoteRates = [0.45, 0.45, 0.1];

const CLUSTERS: MinimapCluster[] = [
  { stableId: "fast", slot: 0, name: "Full Speed Ahead", size: 42 },
  { stableId: "brakes", slot: 1, name: "Hit the Brakes", size: 30 },
  { stableId: "data", slot: 2, name: "Show Me the Data", size: 18 },
];

const STATEMENTS: { id: string; text: string; rates: VoteRates[] }[] = [
  {
    id: "safer-streets",
    text: "Driverless cars will make streets safer for people walking and biking.",
    rates: [MOSTLY_AGREES, MOSTLY_DISAGREES, SPLIT],
  },
  {
    id: "pilot-first",
    text: "DC should run a small pilot before allowing driverless cars citywide.",
    rates: [MOSTLY_DISAGREES, SPLIT, MOSTLY_AGREES],
  },
  {
    id: "jobs",
    text: "Protecting rideshare and taxi jobs matters more than faster adoption.",
    rates: [MOSTLY_DISAGREES, MOSTLY_AGREES, SPLIT],
  },
  {
    id: "public-data",
    text: "Companies should have to publish all their crash data before expanding.",
    rates: [SPLIT, MOSTLY_AGREES, MOSTLY_AGREES],
  },
  {
    id: "traffic",
    text: "Driverless cars will make traffic worse, not better.",
    rates: [MOSTLY_DISAGREES, MOSTLY_AGREES, SPLIT],
  },
  {
    id: "night-service",
    text: "Late-night driverless rides would make it easier to get home safely.",
    rates: [MOSTLY_AGREES, SPLIT, SPLIT],
  },
];

const DECK_ORDER: DeckOrder = {
  leadStatementIds: STATEMENTS.map((s) => s.id),
  consensusStatementId: null,
  longStatementIds: [],
  clusters: CLUSTERS.map((cluster, clusterIndex) => ({
    stableId: cluster.stableId,
    size: cluster.size,
    voteRates: Object.fromEntries(STATEMENTS.map((s) => [s.id, s.rates[clusterIndex]])),
  })),
};

const STORY_STATEMENTS: Statement[] = STATEMENTS.map((s) => ({
  id: s.id,
  text: s.text,
  author: "story-author",
  roomId: "flyer-room",
  timestamp: Date.now(),
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  voters: {},
  round: 1,
}));

export function FlyerSwipeScreenStory() {
  return (
    <StoryContainer
      title="Flyer Swipe Screen"
      description="Opens by replaying the flyer vote (vote 1 of 6), then you swipe the other 5. Drag right to agree, left to disagree, up to pass; the minimap moves using the real cluster estimate."
      variants={[
        { id: "agree", label: "Scanned Agree", children: <FlyerSwipeScreenDemo flyerVote="agree" /> },
        { id: "disagree", label: "Scanned Disagree", children: <FlyerSwipeScreenDemo flyerVote="disagree" /> },
      ]}
    />
  );
}

export const ScannedAgree = () => <FlyerSwipeScreenDemo flyerVote="agree" />;
export const ScannedDisagree = () => <FlyerSwipeScreenDemo flyerVote="disagree" />;

function FlyerSwipeScreenDemo({ flyerVote }: { flyerVote: FlyerVote }) {
  const [replayKey, setReplayKey] = useState(0);
  const [roomId, setRoomId] = useState(randomRoomId);
  const statements = STORY_STATEMENTS.map((statement) => ({ ...statement, roomId }));
  const [votes, setVotes] = useState<Record<string, SwipeVote>>({});
  const clusterProbabilities =
    Object.keys(votes).length > 0 ? estimateClusterProbabilities(DECK_ORDER, votes) : null;
  const tribeSummary =
    clusterProbabilities && Object.keys(votes).length === STATEMENTS.length
      ? summarizeTribe(DECK_ORDER, votes, clusterProbabilities)
      : null;

  const handleReplay = () => {
    setVotes({});
    setReplayKey((key) => key + 1);
  };

  const handleNewRoom = () => {
    setRoomId(randomRoomId());
    handleReplay();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={handleReplay}>
          <RotateCcw className="h-4 w-4" />
          Replay
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleNewRoom}>
          <Shuffle className="h-4 w-4" />
          New room
        </Button>
        <span className="font-mono text-xs text-muted-foreground">{roomId}</span>
      </div>

      <div className="mx-auto h-195 w-97.5 max-w-full overflow-y-auto rounded-4xl border-8 [scrollbar-width:none] border-slate-900 shadow-2xl">
        <FlyerSwipeScreen
          key={replayKey}
          topic={TOPIC}
          flyerStatement={statements[0]}
          flyerVote={flyerVote}
          statements={statements.slice(1)}
          clusters={CLUSTERS}
          clusterProbabilities={clusterProbabilities}
          tribeSummary={tribeSummary}
          onVote={(statementId, vote) => setVotes((current) => ({ ...current, [statementId]: vote }))}
          onClose={() => console.log("[Story] close")}
          onSendCode={(email) => console.log("[Story] send code", email)}
          onJustLooking={() => console.log("[Story] just looking")}
        />
      </div>
    </div>
  );
}

function randomRoomId(): string {
  return `room-${Math.random().toString(36).slice(2, 8)}`;
}
