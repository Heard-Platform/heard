import { useState } from "react";
import type { StreamMessage } from "../../types";
import { HangingMonkey } from "./HangingMonkey";
import { SpeechBubble } from "./SpeechBubble";

interface MonkeyMessengerProps {
  messages: StreamMessage[];
  onAllMessagesRead: () => void;
}

export function MonkeyMessenger({
  messages,
  onAllMessagesRead,
}: MonkeyMessengerProps) {
  const [readMessageCount, setReadMessageCount] = useState(0);
  const [isClimbingDown, setIsClimbingDown] = useState(false);

  const shownMessage =
    readMessageCount > 0 ? messages[readMessageCount - 1] : null;
  const unreadMessageCount = messages.length - readMessageCount;

  const handleBubbleTap = () => {
    if (isClimbingDown) return;
    if (unreadMessageCount === 0) {
      setIsClimbingDown(true);
      return;
    }
    setReadMessageCount(readMessageCount + 1);
  };

  return (
    <HangingMonkey
      motion={isClimbingDown ? "climbingDown" : "climbingUp"}
      speechBubble={
        <SpeechBubble
          shownMessage={shownMessage}
          shownMessageNumber={readMessageCount}
          messageCount={messages.length}
          unreadMessageCount={unreadMessageCount}
          onTap={handleBubbleTap}
        />
      }
      onClimbDownEnd={onAllMessagesRead}
    />
  );
}
