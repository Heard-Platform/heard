import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { EventFlyerFlow } from "../components/flyer/EventFlyerFlow";
import { Button } from "../components/ui/button";
import type {
  FlyerIntro,
  StampedVote,
  Statement,
  VoteType,
} from "../types";
import { CAMPUS_EVENT_QUESTIONS } from "./EventOnboarding.story";
import { mockRooms, withVotersFromCounts } from "./mockData";
import { PhoneFrame } from "./PhoneFrame";
import { StoryContainer } from "./StoryContainer";

const STORY_ROOM = mockRooms[0];
const STORY_USER_ID = "story-scanner";

const storyStatement = (
  id: string,
  text: string,
  agrees: number,
  disagrees: number,
  passes: number,
): Statement =>
  withVotersFromCounts({
    id,
    text,
    author: STORY_ROOM.hostId,
    agrees,
    disagrees,
    passes,
    superAgrees: 0,
    roomId: STORY_ROOM.id,
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    round: 1,
    voters: {},
  });

const FLYER_STATEMENT = storyStatement(
  "flyer",
  "I support the US' current approach to Israel and Palestine",
  4,
  7,
  2,
);

const STORY_STATEMENTS = [
  FLYER_STATEMENT,
  storyStatement(
    "talk-more",
    "I want more opportunities to talk about these issues",
    8,
    2,
    1,
  ),
  storyStatement(
    "events-helped",
    "Events have helped me understand the Israel/Palestine issue better",
    5,
    5,
    2,
  ),
  storyStatement(
    "divest",
    "My university should divest from companies tied to the conflict",
    6,
    6,
    3,
  ),
];

const flyerIntroFor = (vote: StampedVote): FlyerIntro => ({
  statement: FLYER_STATEMENT,
  vote,
});

const logVote = async (statement: Statement, voteType: VoteType) =>
  console.log("[Story] vote", statement.id, voteType);
const logStatement = async (text: string) =>
  console.log("[Story] statement", text);
const logAccountSetup = (featureText: string) =>
  console.log("[Story] account setup", featureText);
const logAnswer = (questionId: string, answers: string[]) =>
  console.log("[Story] answer", questionId, answers);

function EventFlyerFlowDemo({
  vote,
  answeredQuestionIds,
}: {
  vote: StampedVote;
  answeredQuestionIds: string[];
}) {
  const [replayCount, setReplayCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleReplay = () => {
    setIsFinished(false);
    setReplayCount((count) => count + 1);
  };

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
        {isFinished ? (
          <p className="m-auto text-lg font-bold secondary-text">
            The feed
          </p>
        ) : (
          <EventFlyerFlow
            key={replayCount}
            room={STORY_ROOM}
            flyerIntro={flyerIntroFor(vote)}
            statements={STORY_STATEMENTS}
            currentUserId={STORY_USER_ID}
            questions={CAMPUS_EVENT_QUESTIONS}
            answeredQuestionIds={answeredQuestionIds}
            onVote={logVote}
            onSubmitStatement={logStatement}
            onShowAccountSetupModal={logAccountSetup}
            onAnswer={logAnswer}
            onFinished={() => setIsFinished(true)}
          />
        )}
      </PhoneFrame>
    </div>
  );
}

export function EventFlyerFlowStory() {
  return (
    <StoryContainer
      title="Event Flyer Flow"
      description="The whole flow a flyer scanner gets when the post has an event invite. Their flyer statement with their vote stamped on it, then its vote reveal, then it flies off by itself. Then 2 statements from the post with the vote reveal, then the event invite card. The progress bar counts the 3 votes only. Go to event opens registration in a new tab and this screen stays put. Keep voting runs the event's questions with the keep-voting welcome, then the feed."
      variants={[
        {
          id: "agree",
          label: "Scanned Agree",
          description:
            "Checks the stamp's pause, landing and hold, then the reveal on the flyer card before it flies right, the progress bar at 1 of 3 from the start, the reveal on cards 2 and 3, the invite card after the third vote (it can't be swiped), and Keep voting leading to the questions and then the feed. Votes and answers log to the console.",
          children: (
            <EventFlyerFlowDemo
              key="agree"
              vote="agree"
              answeredQuestionIds={[]}
            />
          ),
        },
        {
          id: "disagree",
          label: "Scanned Disagree",
          description:
            "Same flow from the Disagree QR. Checks the red stamp and that the flyer card flies left.",
          children: (
            <EventFlyerFlowDemo
              key="disagree"
              vote="disagree"
              answeredQuestionIds={[]}
            />
          ),
        },
        {
          id: "already-answered",
          label: "Questions already answered",
          description:
            "Someone who already answered the event's questions (at the event, or on another flyer). Checks that Keep voting goes straight to the feed with no questions.",
          children: (
            <EventFlyerFlowDemo
              key="already-answered"
              vote="agree"
              answeredQuestionIds={CAMPUS_EVENT_QUESTIONS.map(
                (question) => question.id,
              )}
            />
          ),
        },
      ]}
    />
  );
}
