import type { Message } from "../../types";
import { Mailbox } from "./Mailbox";
import "./stream-overlay.css";

interface SpeechBubbleProps {
  shownMessage: Message | null;
  shownMessageNumber: number;
  messageCount: number;
  unreadMessageCount: number;
  onTap: () => void;
}

export function SpeechBubble({
  shownMessage,
  shownMessageNumber,
  messageCount,
  unreadMessageCount,
  onTap,
}: SpeechBubbleProps) {
  const label = shownMessage
    ? `Message from ${shownMessage.nickname}. Tap for the next one.`
    : `${unreadMessageCount} new messages. Tap to read.`;

  return (
    <button
      type="button"
      className="speech-bubble"
      aria-label={label}
      onClick={onTap}
    >
      {shownMessage ? (
        <span className="flex w-[290px] flex-col gap-1.5">
          <span className="flex items-baseline justify-between">
            <span className="speech-bubble-nickname text-sm font-bold">
              {shownMessage.nickname}
            </span>
            <span className="speech-bubble-message-position text-xs font-semibold">
              {shownMessageNumber} of {messageCount}
            </span>
          </span>
          <span className="text-xl font-semibold leading-snug">
            {shownMessage.text}
          </span>
        </span>
      ) : (
        <span className="mailbox-bounce flex items-center gap-1">
          <Mailbox />
          <span className="unread-count-badge flex h-10 min-w-10 items-center justify-center rounded-full px-2.5 text-[22px] font-extrabold">
            {unreadMessageCount}
          </span>
        </span>
      )}
    </button>
  );
}
