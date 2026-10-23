import { useState } from "react";
import type { SupportViewAttendeeStatement, SupportViewMinute, SupportViewPost, SupportViewStats } from "../types";
import { EventSupportView } from "../components/events/support/EventSupportView";
import { StoryContainer } from "./StoryContainer";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const RELOAD_DELAY_MS = 1200;
const HIDE_DELAY_MS = 600;
const STORY_NOW = Date.now();
const SESSION_MINUTES = 25;
const NEXT_PRESSED_AT_MINUTES = [6, 13, 19];
const ENDED_SESSION_MINUTES = 36;
const ENDED_NEXT_PRESSED_AT_MINUTES = [6, 13, 19, 23, 26, 28, 30, 32, 34];
const ENDED_MINUTES_AGO = 3;
const PEOPLE_HERE = 61;

const buildSessionMinutes = (sessionMinutes: number, nextPressedAtMinutes: number[]): SupportViewMinute[] =>
  Array.from({ length: sessionMinutes }, (_, minuteSinceStart) => {
    const minutesSinceLastNext = minuteSinceStart - Math.max(0, ...nextPressedAtMinutes.filter((next) => next <= minuteSinceStart));
    const votes = Math.max(4, 48 - minutesSinceLastNext * 9 + (minuteSinceStart % 3) * 4);
    const peopleJoined = Math.min(PEOPLE_HERE, 14 + minuteSinceStart * 11);
    return { minuteSinceStart, votes, peopleJoined };
  });

const POSTS_BEFORE_CURRENT: SupportViewPost[] = [
  { roomId: "hourly-headaches", postNumber: 1, voterCount: 58, secondsOnPost: 6 * 60 + 10 },
  { roomId: "keeps-us-hourly", postNumber: 2, voterCount: 56, secondsOnPost: 7 * 60 + 40 },
  { roomId: "value-pricing", postNumber: 3, voterCount: 54, secondsOnPost: 5 * 60 + 25 },
];

const attendeeStatement = (
  id: string,
  postNumber: number,
  text: string,
  [agreeVotes, disagreeVotes, passVotes]: [number, number, number],
  minutesAgo: number,
  isHidden = false,
): SupportViewAttendeeStatement => ({
  id,
  roomId: `post-${postNumber}`,
  postNumber,
  text,
  agreeVotes,
  disagreeVotes,
  passVotes,
  isHidden,
  createdAt: STORY_NOW - minutesAgo * MINUTE_MS,
});

const ATTENDEE_STATEMENTS: SupportViewAttendeeStatement[] = [
  attendeeStatement("r1", 1, "Procurement teams are the real blocker, not clients.", [41, 9, 6], 21),
  attendeeStatement("r2", 2, "We bill hourly because our software only tracks hours.", [18, 22, 14], 15),
  attendeeStatement("r3", 2, "this is dumb lol", [2, 19, 5], 14, true),
  attendeeStatement("r4", 3, "Value pricing only works if you trust the client.", [33, 12, 8], 9),
  attendeeStatement("r5", 4, "AI will make hourly billing impossible to defend.", [11, 6, 3], 1),
  attendeeStatement("r6", 4, "Clients will expect AI savings passed straight to them.", [0, 0, 0], 0.2),
];

const CURRENT_TOPIC = "Will AI change how agencies price their work in the next two years?";

const MID_QUESTION: SupportViewStats = {
  eventName: "PRGN Session 1",
  status: "live",
  votingPaused: false,
  postCount: 10,
  peopleHere: PEOPLE_HERE,
  activeNow: 57,
  votes: 842,
  statementsFromRoom: 6,
  phoneCountsByState: { swiping: 38, waiting: 19, lobby: 0, end: 0, idle: 4 },
  currentPost: {
    postNumber: 4,
    topic: CURRENT_TOPIC,
    finishedCount: 19,
    swipingCount: 38,
    agreeVotes: 118,
    disagreeVotes: 77,
    passVotes: 32,
    medianSecondsToFinish: 65,
    startedAt: STORY_NOW - (MINUTE_MS + 50 * SECOND_MS),
  },
  postsSoFar: [...POSTS_BEFORE_CURRENT, { roomId: "ai-and-price", postNumber: 4, voterCount: 38, secondsOnPost: 110 }],
  attendeeStatements: ATTENDEE_STATEMENTS,
  minutes: buildSessionMinutes(SESSION_MINUTES, NEXT_PRESSED_AT_MINUTES),
  nextPressedAtMinutes: NEXT_PRESSED_AT_MINUTES,
  startedAt: STORY_NOW - (SESSION_MINUTES * MINUTE_MS - 30 * SECOND_MS),
  endedAt: null,
};

const LATE_IN_POST: SupportViewStats = {
  ...MID_QUESTION,
  activeNow: 55,
  votes: 1013,
  statementsFromRoom: 8,
  phoneCountsByState: { swiping: 4, waiting: 51, lobby: 0, end: 0, idle: 6 },
  currentPost: {
    ...MID_QUESTION.currentPost!,
    finishedCount: 51,
    swipingCount: 4,
    agreeVotes: 231,
    disagreeVotes: 140,
    passVotes: 55,
    medianSecondsToFinish: 82,
    startedAt: STORY_NOW - 4 * MINUTE_MS,
  },
  postsSoFar: [...POSTS_BEFORE_CURRENT, { roomId: "ai-and-price", postNumber: 4, voterCount: 55, secondsOnPost: 240 }],
};

const LATER_POSTS: SupportViewPost[] = [
  { roomId: "ai-and-price", postNumber: 4, voterCount: 55, secondsOnPost: 4 * 60 },
  { roomId: "retainers", postNumber: 5, voterCount: 53, secondsOnPost: 3 * 60 + 20 },
  { roomId: "procurement", postNumber: 6, voterCount: 52, secondsOnPost: 2 * 60 + 10 },
  { roomId: "pricing-pages", postNumber: 7, voterCount: 50, secondsOnPost: 2 * 60 },
  { roomId: "discounting", postNumber: 8, voterCount: 49, secondsOnPost: 2 * 60 + 5 },
  { roomId: "success-fees", postNumber: 9, voterCount: 48, secondsOnPost: 1 * 60 + 55 },
  { roomId: "next-year", postNumber: 10, voterCount: 47, secondsOnPost: 2 * 60 + 15 },
];

const ENDED: SupportViewStats = {
  ...MID_QUESTION,
  status: "ended",
  peopleHere: 58,
  activeNow: 12,
  votes: 2187,
  statementsFromRoom: 11,
  phoneCountsByState: { swiping: 0, waiting: 0, lobby: 0, end: 47, idle: 11 },
  currentPost: null,
  postsSoFar: [...POSTS_BEFORE_CURRENT, ...LATER_POSTS],
  minutes: buildSessionMinutes(ENDED_SESSION_MINUTES, ENDED_NEXT_PRESSED_AT_MINUTES),
  nextPressedAtMinutes: ENDED_NEXT_PRESSED_AT_MINUTES,
  startedAt: STORY_NOW - (ENDED_MINUTES_AGO + ENDED_SESSION_MINUTES) * MINUTE_MS,
  endedAt: STORY_NOW - ENDED_MINUTES_AGO * MINUTE_MS,
};

function SupportViewDemo({ initialStats }: { initialStats: SupportViewStats }) {
  const [stats, setStats] = useState(initialStats);
  const [updatingStatementIds, setUpdatingStatementIds] = useState<string[]>([]);
  const [isReloadingPhones, setIsReloadingPhones] = useState(false);

  const setStatementHiddenInStory = (statement: SupportViewAttendeeStatement, isHidden: boolean) => {
    console.log("[Story] set statement hidden", statement.id, isHidden);
    setUpdatingStatementIds((current) => [...current, statement.id]);
    setTimeout(() => {
      setStats((current) => ({
        ...current,
        attendeeStatements: current.attendeeStatements.map((existing) =>
          existing.id === statement.id ? { ...existing, isHidden } : existing,
        ),
      }));
      setUpdatingStatementIds((current) => current.filter((statementId) => statementId !== statement.id));
    }, HIDE_DELAY_MS);
  };

  const reloadAllPhonesInStory = () => {
    console.log("[Story] reload all phones");
    setIsReloadingPhones(true);
    setTimeout(() => setIsReloadingPhones(false), RELOAD_DELAY_MS);
  };

  return (
    <div className="overflow-hidden rounded-2xl border">
      <EventSupportView
        stats={stats}
        updatingStatementIds={updatingStatementIds}
        isReloadingPhones={isReloadingPhones}
        onSetStatementHidden={setStatementHiddenInStory}
        onReloadAllPhones={reloadAllPhonesInStory}
      />
    </div>
  );
}

export function EventSupportViewStory() {
  return (
    <StoryContainer
      title="Event Support View"
      description="Alex's laptop during a live session: who's here, where every phone is, how the current post is landing, and how the session has gone so far. Clocks tick on their own; after End the header shows how long the session ran, most phones sit on the end screen, and the charts cover the whole session. Statements from the room are listed newest first; Hide drops one from phones and the display, and hidden ones stay listed, dimmed, with Unhide. Reload all phones asks to confirm first. Running the room stays on the display."
      variants={[
        {
          id: "mid-question",
          label: "Mid-question",
          children: <SupportViewDemo key="mid-question" initialStats={MID_QUESTION} />,
        },
        {
          id: "late-in-post",
          label: "Late in a post",
          children: <SupportViewDemo key="late-in-post" initialStats={LATE_IN_POST} />,
        },
        {
          id: "ended",
          label: "Ended",
          children: <SupportViewDemo key="ended" initialStats={ENDED} />,
        },
      ]}
    />
  );
}
