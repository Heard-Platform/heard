import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { DebateRoom, Statement } from "../types";
import { EventLobby } from "../components/events/attendee/EventLobby";
import { EventSwipeScreen } from "../components/events/attendee/EventSwipeScreen";
import { Button } from "../components/ui/button";
import { StoryContainer } from "./StoryContainer";
import { PhoneFrame } from "./PhoneFrame";

const HOST_ID = "host";
const STORY_DELAY_MS = 800;
const NEW_STATEMENTS_ARRIVE_MS = 3000;

const ROOM = {
  id: "hourly",
  topic: "What are the biggest headaches hourly billing causes for your agency and your clients?",
  subHeard: "prgn",
  emoji: "⏱️",
  hostId: HOST_ID,
  createdAt: Date.now(),
} as DebateRoom;

const statement = (id: string, text: string, author = HOST_ID) =>
  ({ id, roomId: ROOM.id, text, author, agrees: 0, disagrees: 0, passes: 0, superAgrees: 0, timestamp: 0, round: 1, voters: {} }) as Statement;

const STATEMENTS: Statement[] = [
  statement("s1", "Our staff hate tracking time."),
  statement("s2", "Hourly billing punishes us for doing great work fast."),
  statement("s3", "Clients auditing our timesheets is a real headache."),
  statement("s4", "Hourly billing makes our revenue unpredictable."),
  statement("s5", "Clients ask for hourly breakdowns even on fixed fees.", "participant"),
];

function SwipeDemo({ initialVotedCount }: { initialVotedCount: number }) {
  const [votedCount, setVotedCount] = useState(initialVotedCount);
  const isFinished = votedCount >= STATEMENTS.length;

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setVotedCount(initialVotedCount)}>
        <RotateCcw className="h-4 w-4" />
        Replay
      </Button>
      <PhoneFrame>
        {isFinished ? (
          <WaitingDemo initialStatementText="" arrivingStatementCount={0} />
        ) : (
          <EventSwipeScreen
            room={ROOM}
            statements={STATEMENTS}
            votedCount={votedCount}
            onVote={(voted, vote) => {
              console.log("[Story] vote", voted.id, vote);
              setVotedCount((count) => count + 1);
            }}
          />
        )}
      </PhoneFrame>
    </div>
  );
}

function WaitingDemo({
  initialStatementText,
  arrivingStatementCount,
}: {
  initialStatementText: string;
  arrivingStatementCount: number;
}) {
  const [statementText, setStatementText] = useState(initialStatementText);
  const [newStatementCount, setNewStatementCount] = useState(0);

  useEffect(() => {
    if (arrivingStatementCount === 0) return;
    const timer = setTimeout(() => setNewStatementCount(arrivingStatementCount), NEW_STATEMENTS_ARRIVE_MS);
    return () => clearTimeout(timer);
  }, [arrivingStatementCount]);

  const addStatementInStory = (text: string) =>
    new Promise<boolean>((resolve) => {
      console.log("[Story] add statement", text);
      setTimeout(() => {
        setStatementText("");
        resolve(true);
      }, STORY_DELAY_MS);
    });

  const voteOnNewStatementsInStory = () => {
    console.log("[Story] vote on new statements, typed text cleared");
    setStatementText("");
    setNewStatementCount(0);
  };

  return (
    <EventLobby
      moment="waiting"
      peopleHere={52}
      finishedCurrentPost={44}
      statementText={statementText}
      newStatementCount={newStatementCount}
      onStatementTextChange={setStatementText}
      onAddStatement={addStatementInStory}
      onVoteOnNewStatements={voteOnNewStatementsInStory}
    />
  );
}

export function EventAttendeeStory() {
  return (
    <StoryContainer
      title="Event Attendee"
      description="What a phone shows during an event, in the Swipe Six layout. The pill shows the post's question without its community. The lobby has four wordings (starting soon, paused, waiting for the others, ended). Swiping counts this post's statements only; finishing them lands on waiting for the others, where you can add a statement. New statements never interrupt someone writing: the phone stays on the text box and offers to vote on them, which clears what was typed. Submitting goes back to voting."
      variants={[
        {
          id: "starting",
          label: "Starting soon",
          children: (
            <PhoneFrame>
              <EventLobby moment="starting" peopleHere={23} />
            </PhoneFrame>
          ),
        },
        { id: "first-card", label: "First card", children: <SwipeDemo key="first-card" initialVotedCount={0} /> },
        { id: "mid-post", label: "Mid-post", children: <SwipeDemo key="mid-post" initialVotedCount={2} /> },
        { id: "last-card", label: "Last card", children: <SwipeDemo key="last-card" initialVotedCount={STATEMENTS.length - 1} /> },
        {
          id: "waiting",
          label: "Waiting for the others",
          children: (
            <PhoneFrame>
              <WaitingDemo initialStatementText="" arrivingStatementCount={0} />
            </PhoneFrame>
          ),
        },
        {
          id: "new-statements-while-writing",
          label: "New statements while writing",
          children: (
            <PhoneFrame>
              <WaitingDemo initialStatementText="Clients want flat fees but still ask" arrivingStatementCount={3} />
            </PhoneFrame>
          ),
        },
        {
          id: "paused",
          label: "Paused",
          children: (
            <PhoneFrame>
              <EventLobby moment="paused" />
            </PhoneFrame>
          ),
        },
        {
          id: "ended",
          label: "Ended",
          children: (
            <PhoneFrame>
              <EventLobby moment="ended" />
            </PhoneFrame>
          ),
        },
      ]}
    />
  );
}
