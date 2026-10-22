import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { DebateRoom, LiveEventView, Statement } from "../types";
import type { EventPost } from "../hooks/useEventPost";
import { EventDisplay } from "../components/events/display/EventDisplay";
import { DisplayBoard } from "../components/events/display/DisplayBoard";
import { DisplaySpotlight } from "../components/events/display/DisplaySpotlight";
import type { DisplayAction } from "../components/events/display/DisplayControls";
import type { DisplayView } from "../utils/event-display";
import { Button } from "../components/ui/button";
import { StoryContainer } from "./StoryContainer";
import { ProjectorFrame } from "./ProjectorFrame";

const JOIN_URL = "https://heard.vote/prgn";
const JOIN_LABEL = "heard.vote/prgn";
const BUSY_MS = 600;
const TICK_MS = 700;
const VOTES_PER_TICK = 3;
const ATTENDEE_STATEMENT_ARRIVES_AT_TICK = 6;
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;

interface VoteLean {
  agree: number;
  disagree: number;
}

interface StoryStatement {
  id: string;
  text: string;
  lean: VoteLean;
  votes: number;
}

interface StoryPost {
  room: DebateRoom;
  seeds: StoryStatement[];
}

const storyRoom = (id: string, topic: string) => ({ id, topic, subHeard: "prgn", hostId: "host", createdAt: 0 }) as DebateRoom;

const HOURLY_HEADACHES: StoryPost = {
  room: storyRoom("hourly-headaches", "What are the biggest headaches hourly billing causes for your agency and your clients?"),
  seeds: [
    { id: "h1", text: "Clients auditing our timesheets is a real headache.", lean: { agree: 0.44, disagree: 0.41 }, votes: 46 },
    { id: "h2", text: "Hourly billing punishes us for doing great work fast.", lean: { agree: 0.64, disagree: 0.22 }, votes: 47 },
    { id: "h3", text: "Our staff hate tracking time.", lean: { agree: 0.71, disagree: 0.18 }, votes: 48 },
    { id: "h4", text: "We over-service retainer clients just to fill the hours.", lean: { agree: 0.22, disagree: 0.61 }, votes: 44 },
    { id: "h5", text: "Hourly billing makes our revenue unpredictable.", lean: { agree: 0.38, disagree: 0.47 }, votes: 45 },
  ],
};

const KEEPS_US_HOURLY: StoryPost = {
  room: storyRoom(
    "keeps-us-hourly",
    "What's really keeping your agency on hourly billing, even when you'd rather move away from it?",
  ),
  seeds: [
    { id: "k1", text: "Clients and procurement expect hours, so we're stuck with them.", lean: { agree: 0.66, disagree: 0.26 }, votes: 44 },
    { id: "k2", text: "Without hourly billing, scope creep would eat us alive.", lean: { agree: 0.47, disagree: 0.45 }, votes: 44 },
    { id: "k3", text: "We don't know how to put a number on value.", lean: { agree: 0.53, disagree: 0.39 }, votes: 43 },
    {
      id: "k4",
      text: "Our staffing model is built around hours, so changing pricing means changing everything.",
      lean: { agree: 0.6, disagree: 0.31 },
      votes: 43,
    },
    { id: "k5", text: "Switching away from hourly would cost us legacy clients.", lean: { agree: 0.34, disagree: 0.56 }, votes: 42 },
    { id: "k6", text: "Honestly, hourly works fine for us.", lean: { agree: 0.21, disagree: 0.72 }, votes: 42 },
  ],
};

const DEMO_POSTS = [HOURLY_HEADACHES, KEEPS_US_HOURLY];
const POST_COUNT = 10;

const ATTENDEE_STATEMENTS: StoryStatement[] = [
  {
    id: "r1",
    text: "Procurement teams are the real blocker, not clients. They need a line item they can compare across agencies.",
    lean: { agree: 0.74, disagree: 0.18 },
    votes: 24,
  },
  {
    id: "r2",
    text: "Our clients ask for hourly breakdowns even when we've already agreed on a fixed fee.",
    lean: { agree: 0.58, disagree: 0.33 },
    votes: 9,
  },
  { id: "r3", text: "We'd drop hourly tomorrow if our biggest competitor did it first.", lean: { agree: 0.49, disagree: 0.45 }, votes: 31 },
  {
    id: "r4",
    text: "Our best clients would happily pay for outcomes. It's the mid-sized accounts that fight us on it.",
    lean: { agree: 0.62, disagree: 0.27 },
    votes: 28,
  },
  { id: "r5", text: "Value pricing only works if you have a clear niche and real proof of results.", lean: { agree: 0.55, disagree: 0.38 }, votes: 26 },
  { id: "r6", text: "Finance teams on the client side are trained to distrust anything that isn't hours.", lean: { agree: 0.6, disagree: 0.3 }, votes: 22 },
  { id: "r7", text: "Hourly protects junior staff from being blamed when a project runs long.", lean: { agree: 0.35, disagree: 0.5 }, votes: 19 },
  { id: "r8", text: "We moved to retainers two years ago and never looked back.", lean: { agree: 0.3, disagree: 0.4 }, votes: 17 },
  { id: "r9", text: "Nobody on our team knows how to sell anything other than time.", lean: { agree: 0.52, disagree: 0.41 }, votes: 15 },
  { id: "r10", text: "Clients say they want value pricing until they see the number.", lean: { agree: 0.69, disagree: 0.22 }, votes: 7 },
];

const findAttendeeStatement = (id: string) => ATTENDEE_STATEMENTS.find((attendeeStatement) => attendeeStatement.id === id)!;

const withVotes = (statement: Statement, lean: VoteLean, votes: number): Statement => {
  const agrees = Math.round(lean.agree * votes);
  const disagrees = Math.round(lean.disagree * votes);
  return { ...statement, agrees, disagrees, passes: votes - agrees - disagrees };
};

const toStatement = (storyStatement: StoryStatement, roomId: string, timestamp: number, votes = storyStatement.votes): Statement =>
  withVotes(
    { id: storyStatement.id, roomId, text: storyStatement.text, author: "host", agrees: 0, disagrees: 0, passes: 0, superAgrees: 0, timestamp, round: 1, voters: {} } as Statement,
    storyStatement.lean,
    votes,
  );

const seedStatements = (post: StoryPost, votesScale = 1): Statement[] =>
  post.seeds.map((seed) => toStatement(seed, post.room.id, 0, Math.round(seed.votes * votesScale)));

const eventState = (overrides: Partial<LiveEventView>): LiveEventView => ({
  roomOrder: Array.from({ length: POST_COUNT }, (_, postNumber) => `post-${postNumber}`),
  currentIndex: 5,
  status: "live",
  votingPaused: false,
  reloadNonce: 0,
  totals: null,
  startedAt: 1,
  currentRoomId: KEEPS_US_HOURLY.room.id,
  peopleHere: 52,
  finishedCurrentPost: 31,
  updatedAt: 0,
  ...overrides,
});

const findVoteLean = (statement: Statement): VoteLean =>
  [...DEMO_POSTS.flatMap((post) => post.seeds), ...ATTENDEE_STATEMENTS].find((storyStatement) => storyStatement.id === statement.id)?.lean ?? {
    agree: 0.5,
    disagree: 0.4,
  };

const castVote = (statement: Statement): Statement => {
  const lean = findVoteLean(statement);
  const roll = Math.random();
  if (roll < lean.agree) return { ...statement, agrees: statement.agrees + 1 };
  if (roll < lean.agree + lean.disagree) return { ...statement, disagrees: statement.disagrees + 1 };
  return { ...statement, passes: statement.passes + 1 };
};

const castVotes = (statements: Statement[]): Statement[] =>
  Array.from({ length: VOTES_PER_TICK }).reduce<Statement[]>((statementsSoFar) => {
    const votedIndex = Math.floor(Math.random() * statementsSoFar.length);
    return statementsSoFar.map((statement, statementIndex) => (statementIndex === votedIndex ? castVote(statement) : statement));
  }, statements);

const applyAction = (state: LiveEventView, action: DisplayAction): LiveEventView => {
  const index = state.currentIndex ?? 0;
  switch (action) {
    case "start":
      return { ...state, status: "live", currentIndex: 0, startedAt: Date.now(), peopleHere: 52 };
    case "next":
      return { ...state, currentIndex: index + 1, votingPaused: false };
    case "back":
      return { ...state, currentIndex: Math.max(0, index - 1), votingPaused: false };
    case "pause":
      return { ...state, votingPaused: true };
    case "resume":
      return { ...state, votingPaused: false };
  }
};

function LiveDemo() {
  const [runKey, setRunKey] = useState(0);
  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setRunKey((key) => key + 1)}>
        <RotateCcw className="h-4 w-4" />
        Replay
      </Button>
      <LiveDemoRun key={runKey} />
    </div>
  );
}

function LiveDemoRun() {
  const [state, setState] = useState(() =>
    eventState({ status: "setup", currentIndex: null, startedAt: null, roomOrder: [], peopleHere: 23 }),
  );
  const [statementsByPost, setStatementsByPost] = useState(() =>
    DEMO_POSTS.map((post) => seedStatements(post, 0.3)),
  );
  const [isBusy, setIsBusy] = useState(false);
  const [voteTick, setVoteTick] = useState(0);
  const postIndex = (state.currentIndex ?? 0) % DEMO_POSTS.length;
  const isVoting = state.status === "live" && !state.votingPaused;

  useEffect(() => {
    if (!isVoting) return;
    const timer = setInterval(() => setVoteTick((tickCount) => tickCount + 1), TICK_MS);
    return () => clearInterval(timer);
  }, [isVoting]);

  useEffect(() => {
    if (voteTick === 0) return;
    setStatementsByPost((current) =>
      current.map((statements, demoPostIndex) => {
        if (demoPostIndex !== postIndex) return statements;
        const statementsWithNewOne =
          voteTick === ATTENDEE_STATEMENT_ARRIVES_AT_TICK ? [...statements, toStatement(findAttendeeStatement("r2"), DEMO_POSTS[demoPostIndex].room.id, Date.now(), 0)] : statements;
        return castVotes(statementsWithNewOne);
      }),
    );
  }, [voteTick]);

  const handleAction = (action: DisplayAction) => {
    console.log("[Story] display action", action);
    setIsBusy(true);
    setTimeout(() => {
      setState((current) =>
        applyAction(action === "start" ? { ...current, roomOrder: Array.from({ length: POST_COUNT }, (_, postNumber) => `post-${postNumber}`) } : current, action),
      );
      setIsBusy(false);
    }, BUSY_MS);
  };

  return (
    <ProjectorFrame>
      <EventDisplay
        eventState={state}
        post={{ room: DEMO_POSTS[postIndex].room, statements: statementsByPost[postIndex] }}
        joinUrl={JOIN_URL}
        joinLabel={JOIN_LABEL}
        isBusy={isBusy}
        onAction={handleAction}
      />
    </ProjectorFrame>
  );
}

interface BoardStoryProps {
  view: DisplayView;
  votingPaused?: boolean;
  attendeeStatements?: (now: number) => Statement[];
}

const attendeeStatementWrittenAt = (id: string, writtenAt: number, votes?: number) =>
  toStatement(findAttendeeStatement(id), KEEPS_US_HOURLY.room.id, writtenAt, votes);

function Board({ view, votingPaused = false, attendeeStatements }: BoardStoryProps) {
  const [now] = useState(() => Date.now());
  const statements = [...seedStatements(KEEPS_US_HOURLY), ...(attendeeStatements?.(now) ?? [])];

  return (
    <DisplayBoard
      eyebrow={`Question 6 of ${POST_COUNT}`}
      title={KEEPS_US_HOURLY.room.topic}
      statements={statements}
      startedAt={now - 20 * MINUTE_MS}
      view={view}
      votingPaused={votingPaused}
      peopleHere={52}
      joinUrl={JOIN_URL}
      joinLabel={JOIN_LABEL}
      onSelectStatement={(id) => console.log("[Story] spotlight", id)}
    />
  );
}

function BoardStory(props: BoardStoryProps) {
  return (
    <ProjectorFrame>
      <Board {...props} />
    </ProjectorFrame>
  );
}

const withProcurementStatementOnBoard = (now: number) => [attendeeStatementWrittenAt("r1", now - 3 * MINUTE_MS)];

const manyAttendeeStatements = (now: number) =>
  ATTENDEE_STATEMENTS.map((attendeeStatement, index) => attendeeStatementWrittenAt(attendeeStatement.id, now - (ATTENDEE_STATEMENTS.length - index) * 40 * SECOND_MS));

function StaticDisplay({ state, post }: { state: LiveEventView; post: EventPost | null }) {
  return (
    <ProjectorFrame>
      <EventDisplay
        eventState={state}
        post={post}
        joinUrl={JOIN_URL}
        joinLabel={JOIN_LABEL}
        isBusy={false}
        onAction={(action) => console.log("[Story] display action", action)}
      />
    </ProjectorFrame>
  );
}

function SpotlightStory() {
  const [isOpen, setIsOpen] = useState(true);
  const statement = seedStatements(KEEPS_US_HOURLY)[3];
  return (
    <ProjectorFrame>
      <Board view="agree-vs-disagree" />
      {isOpen ? (
        <DisplaySpotlight statement={statement} eyebrow="Question 6" onClose={() => setIsOpen(false)} />
      ) : (
        <button type="button" className="absolute inset-0" onClick={() => setIsOpen(true)} aria-label="Spotlight again" />
      )}
    </ProjectorFrame>
  );
}

export function EventDisplayStory() {
  return (
    <StoryContainer
      title="Event Display"
      description="The projector screen for a live event. Move the mouse over the screen to show the controls; they hide after half a second. Live starts on the join screen: press Start, then votes move and a statement from the room arrives (gold strip for 15s, joins the board at 5 votes). Back, Next and Pause work. The view only changes when the moderator picks one. Tap a row to spotlight it."
      variants={[
        {
          id: "join",
          label: "Join screen",
          children: <StaticDisplay state={eventState({ status: "setup", currentIndex: null, startedAt: null, peopleHere: 23 })} post={null} />,
        },
        { id: "live", label: "Live (Start, votes moving)", children: <LiveDemo /> },
        { id: "agree-only", label: "Agree only", children: <BoardStory view="agree-only" attendeeStatements={withProcurementStatementOnBoard} /> },
        {
          id: "agree-vs-disagree",
          label: "Agree vs disagree",
          children: <BoardStory view="agree-vs-disagree" attendeeStatements={withProcurementStatementOnBoard} />,
        },
        { id: "agree-split", label: "Agree / Split", children: <BoardStory view="agree-split" attendeeStatements={withProcurementStatementOnBoard} /> },
        {
          id: "paused",
          label: "Paused",
          children: <BoardStory view="agree-vs-disagree" votingPaused attendeeStatements={withProcurementStatementOnBoard} />,
        },
        { id: "spotlight", label: "Spotlight", children: <SpotlightStory /> },
        {
          id: "many-from-room",
          label: "Many from the room",
          children: <BoardStory view="agree-vs-disagree" attendeeStatements={manyAttendeeStatements} />,
        },
        { id: "strip-empty", label: "Strip: nothing yet", children: <BoardStory view="agree-vs-disagree" /> },
        {
          id: "strip-new",
          label: "Strip: just written",
          children: (
            <BoardStory
              view="agree-vs-disagree"
              attendeeStatements={(now) => [...withProcurementStatementOnBoard(now), attendeeStatementWrittenAt("r2", now - 2 * SECOND_MS, 2)]}
            />
          ),
        },
        {
          id: "strip-collecting",
          label: "Strip: collecting votes",
          children: (
            <BoardStory
              view="agree-vs-disagree"
              attendeeStatements={(now) => [...withProcurementStatementOnBoard(now), attendeeStatementWrittenAt("r2", now - 30 * SECOND_MS, 3)]}
            />
          ),
        },
        {
          id: "strip-invite",
          label: "Strip: something missing?",
          children: (
            <BoardStory
              view="agree-vs-disagree"
              attendeeStatements={(now) => [...withProcurementStatementOnBoard(now), attendeeStatementWrittenAt("r2", now - MINUTE_MS)]}
            />
          ),
        },
        {
          id: "end",
          label: "End card",
          children: (
            <StaticDisplay
              state={eventState({
                status: "ended",
                currentIndex: POST_COUNT - 1,
                totals: { people: 61, votes: 1204, statementsFromRoom: 7, stayedToEndPercent: 58 },
              })}
              post={null}
            />
          ),
        },
      ]}
    />
  );
}
