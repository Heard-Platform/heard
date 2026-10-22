import { useState, type ReactNode } from "react";
import { ModeratorControls } from "../components/events/moderator-controls/ModeratorControls";
import { ModeratorControlsEnded } from "../components/events/moderator-controls/ModeratorControlsEnded";
import { ModeratorControlsRefusal } from "../components/events/moderator-controls/ModeratorControlsRefusal";
import type { ModeratorAction, EventSetupRoom, LiveEventView, EventTotals } from "../types";
import { StoryContainer } from "./StoryContainer";

const EVENT_NAME = "PRGN Session 1";
const BUSY_MS = 600;

const ROOMS: EventSetupRoom[] = [
  { id: "billing", topic: "Main billing model?", emoji: "💵" },
  { id: "hourly", topic: "Hourly headaches", emoji: "⏱️" },
  { id: "mayor", topic: "The mayor's office text", emoji: undefined },
  { id: "clients", topic: "What clients ask for that we can't deliver on a fixed fee", emoji: "🤝" },
  { id: "retainer", topic: "Monthly retainer minimum?", emoji: "📅" },
];

const TOTALS: EventTotals = {
  people: 61,
  votes: 1204,
  statementsFromRoom: 7,
  stayedToEndPercent: 58,
};

const eventState = (overrides: Partial<LiveEventView>): LiveEventView => ({
  roomOrder: ROOMS.map((room) => room.id),
  currentIndex: null,
  status: "setup",
  votingPaused: false,
  reloadNonce: 0,
  totals: null,
  startedAt: null,
  currentRoomId: null,
  peopleHere: 23,
  finishedCurrentPost: 0,
  updatedAt: Date.now(),
  ...overrides,
});

const applyAction = (state: LiveEventView, action: ModeratorAction): LiveEventView => {
  const index = state.currentIndex ?? 0;
  switch (action) {
    case "start":
      return { ...state, status: "live", currentIndex: 0, peopleHere: 52, finishedCurrentPost: 0 };
    case "next":
      return { ...state, currentIndex: index + 1, votingPaused: false, finishedCurrentPost: 0 };
    case "back":
      return { ...state, currentIndex: Math.max(0, index - 1), votingPaused: false };
    case "pause":
      return { ...state, votingPaused: true };
    case "resume":
      return { ...state, votingPaused: false };
    case "end":
      return { ...state, status: "ended" };
  }
};

function Frames({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 items-start">
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1">Phone, 375×560</p>
        <div className="heard-feed-bg rounded-2xl border overflow-hidden" style={{ width: 375, height: 560 }}>
          {children}
        </div>
      </div>
      <div className="w-full">
        <p className="text-xs font-semibold text-slate-500 mb-1">Laptop, 1024×640</p>
        <div className="heard-feed-bg rounded-2xl border overflow-hidden max-w-full" style={{ width: 1024, height: 640 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ModeratorControlsDemo({ initial }: { initial: LiveEventView }) {
  const [state, setState] = useState(initial);
  const [isBusy, setIsBusy] = useState(false);

  const handleAction = (action: ModeratorAction) => {
    console.log("[Story] moderator action", action);
    setIsBusy(true);
    setTimeout(() => {
      setState((prev) => applyAction(prev, action));
      setIsBusy(false);
    }, BUSY_MS);
  };

  const content =
    state.status === "ended" ? (
      <ModeratorControlsEnded eventName={EVENT_NAME} postCount={ROOMS.length} totals={TOTALS} />
    ) : (
      <ModeratorControls eventName={EVENT_NAME} rooms={ROOMS} eventState={state} isBusy={isBusy} onAction={handleAction} />
    );

  return <Frames>{content}</Frames>;
}

export function ModeratorControlsStory() {
  return (
    <StoryContainer
      title="Moderator Controls"
      description="Runs an event as it happens. Buttons work in the story (with a short busy state) so you can click from Start to End. On the last post, End session opens the in-page confirm."
      variants={[
        {
          id: "not-started",
          label: "Not started",
          children: <ModeratorControlsDemo initial={eventState({})} />,
        },
        {
          id: "live-first",
          label: "Live, first post",
          children: <ModeratorControlsDemo initial={eventState({ status: "live", currentIndex: 0, peopleHere: 52, finishedCurrentPost: 12 })} />,
        },
        {
          id: "live-middle",
          label: "Live, middle",
          children: <ModeratorControlsDemo initial={eventState({ status: "live", currentIndex: 1, peopleHere: 52, finishedCurrentPost: 31 })} />,
        },
        {
          id: "last-post",
          label: "Last post (tap End)",
          children: <ModeratorControlsDemo initial={eventState({ status: "live", currentIndex: 4, peopleHere: 61, finishedCurrentPost: 49 })} />,
        },
        {
          id: "paused",
          label: "Paused",
          children: (
            <ModeratorControlsDemo
              initial={eventState({ status: "live", currentIndex: 1, votingPaused: true, peopleHere: 52, finishedCurrentPost: 47 })}
            />
          ),
        },
        {
          id: "ended",
          label: "Ended",
          children: (
            <Frames>
              <ModeratorControlsEnded eventName={EVENT_NAME} postCount={ROOMS.length} totals={TOTALS} />
            </Frames>
          ),
        },
        {
          id: "not-a-moderator",
          label: "Not a moderator",
          children: (
            <Frames>
              <ModeratorControlsRefusal communityName="prgn" />
            </Frames>
          ),
        },
      ]}
    />
  );
}
