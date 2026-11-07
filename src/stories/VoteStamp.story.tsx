import { useState } from "react";
import { useMotionValue } from "motion/react";
import { RotateCcw } from "lucide-react";
import { StatementCard } from "../components/room/StatementCard";
import { Button } from "../components/ui/button";
import type { StampedVote, Statement } from "../types";
import { getPastelColor } from "../utils/colors";
import { mockRooms } from "./mockData";
import { PhoneFrame } from "./PhoneFrame";
import { StoryContainer } from "./StoryContainer";

const FLYER_STATEMENT: Statement = {
  id: "flyer-statement",
  text: "I support the US' current approach to Israel and Palestine",
  author: "host",
  agrees: 4,
  disagrees: 7,
  passes: 2,
  superAgrees: 0,
  roomId: mockRooms[0].id,
  timestamp: Date.now() - 2 * 60 * 60 * 1000,
  round: 1,
  voters: {},
};

const noop = () => {};

function StampedStatementDemo({ vote }: { vote: StampedVote }) {
  const [replayCount, setReplayCount] = useState(0);
  const disagreeOpacity = useMotionValue(0);
  const agreeOpacity = useMotionValue(0);
  const superAgreeOpacity = useMotionValue(0);
  const passOpacity = useMotionValue(0);

  const handleReplay = () => setReplayCount((count) => count + 1);

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleReplay}
      >
        <RotateCcw className="h-4 w-4" />
        Replay
      </Button>
      <PhoneFrame>
        <div className="p-5">
          <div
            key={replayCount}
            className={`relative rounded-xl border-2 p-6 shadow-xl ${getPastelColor(FLYER_STATEMENT.id)}`}
          >
            <StatementCard
              statement={FLYER_STATEMENT}
              room={mockRooms[0]}
              isTopCard
              currentIndex={1}
              totalStatements={3}
              voteReveal={null}
              stampedVote={vote}
              disagreeOpacity={disagreeOpacity}
              agreeOpacity={agreeOpacity}
              superAgreeOpacity={superAgreeOpacity}
              passOpacity={passOpacity}
              getTypeIcon={() => null}
              onAgree={noop}
              onDisagree={noop}
              onPass={noop}
              onSuperAgree={noop}
              onFlag={noop}
            />
          </div>
        </div>
      </PhoneFrame>
    </div>
  );
}

export function VoteStampStory() {
  return (
    <StoryContainer
      title="Vote Stamp"
      description="A flyer scanner's first card: the statement they voted on by scanning, with their vote stamped onto it. The stamp drops in after a pause, lands with a bounce and holds, slow enough for someone who has never seen Heard. The vote buttons are hidden but keep their space, In the deck the vote reveal then plays on this card, and it flies off in the vote's direction."
      variants={[
        {
          id: "agree",
          label: "Agree",
          description:
            "Scanned the Agree QR. Checks the green AGREE stamp tilted left, the pause before it drops, and that the buttons' space stays empty.",
          children: <StampedStatementDemo key="agree" vote="agree" />,
        },
        {
          id: "disagree",
          label: "Disagree",
          description:
            "Scanned the Disagree QR. Checks the red DISAGREE stamp tilted right.",
          children: (
            <StampedStatementDemo key="disagree" vote="disagree" />
          ),
        },
      ]}
    />
  );
}
