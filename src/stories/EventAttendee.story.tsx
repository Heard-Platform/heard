import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { DebateRoom, Statement } from "../types";
import type { EmailOtpFlow, EmailOtpStep } from "../hooks/useEmailOtpFlow";
import { EventLobby } from "../components/events/attendee/EventLobby";
import { EventSwipeScreen } from "../components/events/attendee/EventSwipeScreen";
import { EventEndScreen } from "../components/events/attendee/EventEndScreen";
import { Button } from "../components/ui/button";
import { StoryContainer } from "./StoryContainer";
import { PhoneFrame } from "./PhoneFrame";

const HOST_ID = "host";
const STORY_DELAY_MS = 800;

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
          <EventLobby
            moment="waiting"
            peopleHere={52}
            finishedCurrentPost={44}
            onAddStatement={addStatementInStory}
          />
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

const addStatementInStory = (text: string) =>
  new Promise<void>((resolve) => {
    console.log("[Story] add statement", text);
    setTimeout(resolve, STORY_DELAY_MS);
  });

function useStoryEmailFlow(initialStep: EmailOtpStep, initialEmail: string, onComplete: () => void): EmailOtpFlow {
  const [step, setStep] = useState<EmailOtpStep>(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const afterDelay = (then: () => void) => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      then();
    }, STORY_DELAY_MS);
  };

  return {
    step,
    email,
    otp,
    error,
    submitting,
    setEmail: (value: string) => {
      setEmail(value);
      setError(null);
    },
    setOtp: (value: string) => {
      setOtp(value.toUpperCase());
      setError(null);
    },
    submitEmail: async () => {
      if (!email.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
      afterDelay(() => (email.startsWith("taken") ? setStep("otp") : onComplete()));
    },
    submitOtp: async () => {
      if (otp.length !== 6) {
        setError("Enter the 6-character code from your email.");
        return;
      }
      afterDelay(onComplete);
    },
    goBackToEmail: () => {
      setStep("email");
      setOtp("");
      setError(null);
    },
  };
}

function EndDemo({ initialStep, initialEmail, initialSent }: { initialStep: EmailOtpStep; initialEmail: string; initialSent: boolean }) {
  const [isSent, setIsSent] = useState(initialSent);
  const emailFlow = useStoryEmailFlow(initialStep, initialEmail, () => setIsSent(true));

  return (
    <PhoneFrame>
      <EventEndScreen emailFlow={emailFlow} isSent={isSent} />
    </PhoneFrame>
  );
}

export function EventAttendeeStory() {
  return (
    <StoryContainer
      title="Event Attendee"
      description="What a phone shows during an event, in the Swipe Six layout. The pill shows the post's question without its community. The lobby has three wordings (starting soon, paused, waiting for the others). Swiping counts this post's statements only; finishing them lands on waiting for the others, where you can add a statement. On the end screen, an email starting with 'taken' goes to the code step; any 6 characters log in."
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
              <EventLobby moment="waiting" peopleHere={52} finishedCurrentPost={44} onAddStatement={addStatementInStory} />
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
          id: "end-email",
          label: "End, email",
          children: <EndDemo key="end-email" initialStep="email" initialEmail="" initialSent={false} />,
        },
        {
          id: "end-code",
          label: "End, code",
          children: <EndDemo key="end-code" initialStep="otp" initialEmail="taken@agency.com" initialSent={false} />,
        },
        {
          id: "end-sent",
          label: "End, sent",
          children: <EndDemo key="end-sent" initialStep="email" initialEmail="gabor@agency.com" initialSent />,
        },
      ]}
    />
  );
}
