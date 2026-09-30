import { useState } from "react";
import { RotateCcw, Shuffle } from "lucide-react";
import { FlyerSwipeScreen } from "../components/flyer/FlyerSwipeScreen";
import type { SwipeVote } from "../components/flyer/FlyerSwipeCard";
import type { FlyerVote } from "../components/flyer/FlyerVoteIntroCard";
import { Button } from "../components/ui/button";
import { estimateClusterProbabilities } from "../utils/cluster-estimation";
import { summarizeTribe } from "../utils/tribe-summary";
import { FLYER_CLUSTERS, FLYER_DECK_ORDER, FLYER_STATEMENTS, FLYER_TOPIC } from "./flyer-fixtures";
import { StoryContainer } from "./StoryContainer";

export default {
  title: "Flyer/FlyerSwipeScreen",
};

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
  const statements = FLYER_STATEMENTS.map((statement) => ({ ...statement, roomId }));
  const [votes, setVotes] = useState<Record<string, SwipeVote>>({});
  const clusterProbabilities =
    Object.keys(votes).length > 0 ? estimateClusterProbabilities(FLYER_DECK_ORDER, votes) : null;
  const tribeSummary =
    clusterProbabilities && Object.keys(votes).length === FLYER_STATEMENTS.length
      ? summarizeTribe(FLYER_DECK_ORDER, votes, clusterProbabilities)
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
          topic={FLYER_TOPIC}
          flyerStatement={statements[0]}
          flyerVote={flyerVote}
          statements={statements.slice(1)}
          clusters={FLYER_CLUSTERS}
          clusterProbabilities={clusterProbabilities}
          tribeSummary={tribeSummary}
          onVote={(statementId, vote) => setVotes((current) => ({ ...current, [statementId]: vote }))}
          onClose={() => console.log("[Story] close")}
          onSaveSpot={() => console.log("[Story] save my spot")}
          onJustLooking={() => console.log("[Story] just looking")}
        />
      </div>
    </div>
  );
}

function randomRoomId(): string {
  return `room-${Math.random().toString(36).slice(2, 8)}`;
}
