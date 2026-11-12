import { useState } from "react";
import type { SupportViewAttendeeStatement } from "../types";
import { EventApproval } from "../components/events/approval/EventApproval";
import { useNow } from "../hooks/useNow";
import { StoryContainer } from "./StoryContainer";

const MINUTE_MS = 60 * 1000;
const CLOCK_REFRESH_MS = 1000;
const UPDATE_DELAY_MS = 600;
const STORY_NOW = Date.now();
const EVENT_NAME = "Georgetown: Sharing Views";

type StoryVisibility = "visible" | "hidden" | "awaiting approval";

const attendeeStatement = (
  id: string,
  postNumber: number,
  text: string,
  minutesAgo: number,
  visibility: StoryVisibility = "visible",
): SupportViewAttendeeStatement => ({
  id,
  roomId: `post-${postNumber}`,
  postNumber,
  text,
  agreeVotes: 0,
  disagreeVotes: 0,
  passVotes: 0,
  isAwaitingApproval: visibility === "awaiting approval",
  isHidden: visibility !== "visible",
  createdAt: STORY_NOW - minutesAgo * MINUTE_MS,
});

const REVIEWED_STATEMENTS = [
  attendeeStatement("r1", 1, "Campus speech rules should be written by students too.", 21),
  attendeeStatement("r2", 2, "Most of us avoid politics in class to keep the peace.", 15),
  attendeeStatement("r3", 2, "this is dumb lol", 14, "hidden"),
  attendeeStatement("r4", 3, "I've changed my mind after a real conversation before.", 9),
];

const WAITING_STATEMENTS = [
  attendeeStatement("w1", 4, "Professors should share their own views less.", 0.8, "awaiting approval"),
  attendeeStatement("w2", 4, "Disagreeing in public costs too much socially here.", 0.3, "awaiting approval"),
];

const BUSY_WAITING_STATEMENTS = Array.from({ length: 18 }, (_, index) =>
  attendeeStatement(
    `busy-${index + 1}`,
    4,
    `Statement ${index + 1} from the room, waiting for a moderator.`,
    6 * (1 - index / 18),
    "awaiting approval",
  ),
);

function EventApprovalDemo({
  initialStatements,
}: {
  initialStatements: SupportViewAttendeeStatement[];
}) {
  const now = useNow(CLOCK_REFRESH_MS);
  const [attendeeStatements, setAttendeeStatements] = useState(initialStatements);
  const [updatingStatementIds, setUpdatingStatementIds] = useState<string[]>([]);

  const setStatementHiddenInStory = (
    statement: SupportViewAttendeeStatement,
    isHidden: boolean,
  ) => {
    console.log("[Story] set statement hidden", statement.id, isHidden);
    setUpdatingStatementIds((current) => [...current, statement.id]);
    setTimeout(() => {
      setAttendeeStatements((current) =>
        current.map((existing) =>
          existing.id === statement.id
            ? { ...existing, isHidden, isAwaitingApproval: false }
            : existing,
        ),
      );
      setUpdatingStatementIds((current) =>
        current.filter((statementId) => statementId !== statement.id),
      );
    }, UPDATE_DELAY_MS);
  };

  return (
    <div className="overflow-hidden rounded-2xl border">
      <EventApproval
        eventName={EVENT_NAME}
        attendeeStatements={attendeeStatements}
        updatingStatementIds={updatingStatementIds}
        now={now}
        onSetStatementHidden={setStatementHiddenInStory}
      />
    </div>
  );
}

export function EventApprovalStory() {
  return (
    <StoryContainer
      title="Event Approval"
      description="The moderators' approval page, opened from the event setup panel with the display key. Statements waiting for approval sit at the top, oldest first; the Sections dropdown splits them so several moderators can share the queue, and My section pins your own section to the top (just on your screen). Approve shows one on phones and the display, Reject keeps it hidden. Everything already reviewed is listed below, newest first, with Hide and Unhide. No vote counts: the page never loads votes, so it stays light with many moderators open."
      variants={[
        {
          id: "a-few-waiting",
          label: "A few waiting",
          children: (
            <EventApprovalDemo
              key="a-few-waiting"
              initialStatements={[...REVIEWED_STATEMENTS, ...WAITING_STATEMENTS]}
            />
          ),
        },
        {
          id: "busy-queue",
          label: "Busy queue",
          children: (
            <EventApprovalDemo
              key="busy-queue"
              initialStatements={[...REVIEWED_STATEMENTS, ...BUSY_WAITING_STATEMENTS]}
            />
          ),
        },
        {
          id: "nothing-waiting",
          label: "Nothing waiting",
          children: (
            <EventApprovalDemo
              key="nothing-waiting"
              initialStatements={REVIEWED_STATEMENTS}
            />
          ),
        },
      ]}
    />
  );
}
