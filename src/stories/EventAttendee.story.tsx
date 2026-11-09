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

const LONG_STATEMENTS: Statement[] = [
  statement(
    "l1",
    "When a client sees an hourly invoice, they start questioning every line instead of the value we delivered.",
  ),
  statement("l2", "Fixed fees are better.", "participant"),
  statement(
    "l3",
    "Hourly billing rewards the slowest person on the team, and it quietly teaches everyone that looking busy matters more than finishing early, which is the opposite of what clients actually want from an agency.",
    "participant",
  ),
  statement(
    "l4",
    "Tracking time in six-minute increments eats an hour of my week that nobody pays for.",
  ),
  statement(
    "l5",
    "We moved two retainer clients to value pricing last year, and both renewed at a higher rate, but our finance team still asks for timesheets so they can check margins, so in practice we are doing both systems at once and getting the overhead of each without fully getting the benefit of either one.",
    "participant",
  ),
];

interface SwipeDemoProps {
  statements: Statement[];
  initialVotedCount: number;
}

function SwipeDemo({ statements, initialVotedCount }: SwipeDemoProps) {
  const [votedCount, setVotedCount] = useState(initialVotedCount);
  const isFinished = votedCount >= statements.length;

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
            statements={statements}
            votedCount={votedCount}
            onVote={(voted, vote) => {
              console.log("[Story] vote", voted.id, vote);
              setVotedCount((count) => count + 1);
            }}
            onAddStatement={addStatementMidDeckInStory}
          />
        )}
      </PhoneFrame>
    </div>
  );
}

const addStatementMidDeckInStory = (text: string) =>
  new Promise<boolean>((resolve) => {
    console.log("[Story] add statement mid-deck", text);
    setTimeout(() => resolve(true), STORY_DELAY_MS);
  });

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
      description="What a phone shows during an event, in the Swipe Six layout. The pill shows the post's question without its community. Before the doors open, the link says the event hasn't started yet. The lobby has four wordings (starting soon, paused, waiting for the others, ended). Swiping counts this post's statements only, with a field under the deck to add a statement at any point. Finishing them lands on waiting for the others, where you can add a statement. New statements never interrupt someone writing: the phone stays on the text box and offers to vote on them, which clears what was typed. Submitting goes back to voting."
      variants={[
        {
          id: "closed",
          label: "Doors closed",
          children: (
            <PhoneFrame>
              <EventLobby moment="closed" />
            </PhoneFrame>
          ),
        },
        {
          id: "starting",
          label: "Starting soon",
          children: (
            <PhoneFrame>
              <EventLobby moment="starting" peopleHere={23} />
            </PhoneFrame>
          ),
        },
        {
          id: "first-card",
          label: "First card",
          children: (
            <SwipeDemo
              key="first-card"
              statements={STATEMENTS}
              initialVotedCount={0}
            />
          ),
        },
        {
          id: "mid-post",
          label: "Mid-post",
          children: (
            <SwipeDemo
              key="mid-post"
              statements={STATEMENTS}
              initialVotedCount={2}
            />
          ),
        },
        {
          id: "last-card",
          label: "Last card",
          children: (
            <SwipeDemo
              key="last-card"
              statements={STATEMENTS}
              initialVotedCount={STATEMENTS.length - 1}
            />
          ),
        },
        {
          id: "long-statements",
          label: "Long statements",
          children: (
            <SwipeDemo
              key="long-statements"
              statements={LONG_STATEMENTS}
              initialVotedCount={0}
            />
          ),
        },
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
