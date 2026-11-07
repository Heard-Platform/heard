import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../components/ui/button";
import {
  HangingMonkey,
  type MonkeyMotion,
} from "../components/stream-overlay/HangingMonkey";
import { MonkeyMessenger } from "../components/stream-overlay/MonkeyMessenger";
import { SpeechBubble } from "../components/stream-overlay/SpeechBubble";
import { Vine } from "../components/stream-overlay/Vine";
import type { StreamMessage } from "../types";

const STORY_MESSAGES: StreamMessage[] = [
  { nickname: "maya", text: "is the monkey union or a contractor" },
  { nickname: "dev_dan", text: "what are you building right now?" },
  { nickname: "hoya22", text: "see you at the event on the 12th!" },
];

const SECONDS_UNTIL_NEW_MAIL = 3;

const noop = () => {};

interface StoryStageProps {
  label: string;
  width: number;
  height: number;
  children: ReactNode;
  action?: ReactNode;
}

function StoryStage({
  label,
  width,
  height,
  children,
  action,
}: StoryStageProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">
          {label}
        </span>
        {action}
      </div>
      <div
        className="relative overflow-hidden rounded-xl bg-stone-900"
        style={{ width, height }}
      >
        {children}
      </div>
    </div>
  );
}

export function StreamOverlayStory() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <h2 className="text-xl font-semibold">Stream Overlay</h2>
      <FullOverlayStage />
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fill, 400px)" }}
      >
        <StoryStage label="Vine" width={400} height={420}>
          <Vine />
        </StoryStage>
        <ReplayableMonkeyStage
          label="Monkey, climbing up"
          motion="climbingUp"
        />
        <ReplayableMonkeyStage
          label="Monkey, climbing down"
          motion="climbingDown"
        />
      </div>
      <div className="flex flex-wrap items-start gap-6 rounded-xl bg-stone-900 p-6">
        <SpeechBubble
          shownMessage={null}
          shownMessageNumber={0}
          messageCount={1}
          unreadMessageCount={1}
          onTap={noop}
        />
        <SpeechBubble
          shownMessage={null}
          shownMessageNumber={0}
          messageCount={3}
          unreadMessageCount={3}
          onTap={noop}
        />
        <SpeechBubble
          shownMessage={null}
          shownMessageNumber={0}
          messageCount={12}
          unreadMessageCount={12}
          onTap={noop}
        />
        <SpeechBubble
          shownMessage={STORY_MESSAGES[0]}
          shownMessageNumber={1}
          messageCount={3}
          unreadMessageCount={2}
          onTap={noop}
        />
      </div>
    </div>
  );
}

function FullOverlayStage() {
  const [deliveryNumber, setDeliveryNumber] = useState(1);
  const [isMonkeyOnScreen, setIsMonkeyOnScreen] = useState(true);
  const newMailTimer = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  useEffect(() => () => clearTimeout(newMailTimer.current), []);

  const deliverNewMail = () => {
    clearTimeout(newMailTimer.current);
    setDeliveryNumber((number) => number + 1);
    setIsMonkeyOnScreen(true);
  };

  const handleAllMessagesRead = () => {
    setIsMonkeyOnScreen(false);
    newMailTimer.current = setTimeout(
      deliverNewMail,
      SECONDS_UNTIL_NEW_MAIL * 1000,
    );
  };

  return (
    <div className="overflow-x-auto">
      <StoryStage
        label="Full overlay: tap the bubble to read, new mail 3s after the monkey leaves"
        width={1280}
        height={720}
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={deliverNewMail}
          >
            Deliver mail now
          </Button>
        }
      >
        <Vine />
        {isMonkeyOnScreen && (
          <MonkeyMessenger
            key={deliveryNumber}
            messages={STORY_MESSAGES}
            onAllMessagesRead={handleAllMessagesRead}
          />
        )}
      </StoryStage>
    </div>
  );
}

interface ReplayableMonkeyStageProps {
  label: string;
  motion: MonkeyMotion;
}

function ReplayableMonkeyStage({
  label,
  motion,
}: ReplayableMonkeyStageProps) {
  const [replayNumber, setReplayNumber] = useState(0);

  const replay = () => setReplayNumber((number) => number + 1);

  return (
    <StoryStage
      label={label}
      width={400}
      height={420}
      action={
        <Button size="sm" variant="outline" onClick={replay}>
          Replay
        </Button>
      }
    >
      <Vine />
      <HangingMonkey
        key={replayNumber}
        motion={motion}
        speechBubble={
          <SpeechBubble
            shownMessage={null}
            shownMessageNumber={0}
            messageCount={3}
            unreadMessageCount={3}
            onTap={noop}
          />
        }
        onClimbDownEnd={noop}
      />
    </StoryStage>
  );
}
