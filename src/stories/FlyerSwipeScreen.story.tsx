import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { FlyerSwipeScreen } from "../components/flyer/FlyerSwipeScreen";
import type { FlyerVote } from "../components/flyer/FlyerVoteIntroCard";
import { Button } from "../components/ui/button";
import { Toaster } from "../components/ui/sonner";
import type { DebateRoom, Statement, VoteType } from "../types";
import { StoryContainer } from "./StoryContainer";

const FLYER_STATEMENT_ID = "flyer-stmt";

const mockRoom: DebateRoom = {
  id: "flyer-room",
  topic: "Should we close Q Street to cars?",
  description: "A conversation about the future of Q Street in Dupont Circle.",
  phase: "lobby",
  subPhase: "voting",
  gameNumber: 1,
  roundStartTime: Date.now(),
  participants: [],
  hostId: "story-host",
  isActive: true,
  createdAt: Date.now(),
  mode: "realtime",
  demographicQuestions: [],
  subHeard: "dupont-circle-neighborhoods",
  allowAnonymous: true,
};

const mockStatement = (
  id: string,
  text: string,
  agrees: number,
  disagrees: number,
  hoursAgo: number,
): Statement => ({
  id,
  text,
  author: "story-author",
  roomId: mockRoom.id,
  timestamp: Date.now() - hoursAgo * 60 * 60 * 1000,
  agrees,
  disagrees,
  passes: 4,
  superAgrees: 0,
  voters: {},
  round: 1,
});

const mockStatements: Statement[] = [
  mockStatement(FLYER_STATEMENT_ID, "Close Q Street to cars between Connecticut and 17th.", 62, 28, 30),
  mockStatement("stmt-2", "The city should add protected bike lanes before closing any streets.", 48, 15, 20),
  mockStatement("stmt-3", "Local businesses on Q Street would benefit from more foot traffic.", 41, 22, 12),
  mockStatement("stmt-4", "Closing Q Street would push traffic onto already-busy side streets.", 37, 31, 8),
  mockStatement("stmt-5", "We should try a weekend-only closure as a pilot first.", 55, 9, 3),
  mockStatement("stmt-6", "Deliveries and accessibility vehicles must keep access no matter what.", 60, 5, 1),
];

export function FlyerSwipeScreenStory() {
  return (
    <StoryContainer
      title="Flyer Swipe Screen"
      description="Replaces the QR scan result dialog. Drops the user straight into swiping the flyer's post, replaying their flyer vote as a pre-tilted card that swipes away after 750ms. No bottom nav, community locked to the flyer's."
      variants={[
        { id: "agree", label: "Scanned Agree", children: <FlyerSwipeScreenDemo vote="agree" /> },
        { id: "disagree", label: "Scanned Disagree", children: <FlyerSwipeScreenDemo vote="disagree" /> },
      ]}
    />
  );
}

function FlyerSwipeScreenDemo({ vote }: { vote: FlyerVote }) {
  const [replayKey, setReplayKey] = useState(0);

  const handleVote = async (statement: Statement, voteType: VoteType) => {
    console.log("[Story] vote", { statementId: statement.id, voteType });
  };

  const handleSubmitStatement = async (text: string) => {
    console.log("[Story] submit statement", text);
  };

  return (
    <div className="space-y-4">
      <Toaster />
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setReplayKey((k) => k + 1)}>
        <RotateCcw className="w-4 h-4" />
        Replay
      </Button>

      <div className="mx-auto h-[780px] w-[390px] max-w-full overflow-y-auto rounded-[32px] border-8 border-slate-900 shadow-2xl">
        <FlyerSwipeScreen
          key={replayKey}
          room={mockRoom}
          statements={mockStatements}
          flyerStatementId={FLYER_STATEMENT_ID}
          flyerVote={vote}
          currentUserId="story-user"
          isAnonymous={true}
          onWordmarkClick={() => console.log("[Story] wordmark clicked")}
          onVote={handleVote}
          onSubmitStatement={handleSubmitStatement}
          onShowAccountSetupModal={(featureText) => console.log("[Story] account setup", featureText)}
        />
      </div>
    </div>
  );
}
