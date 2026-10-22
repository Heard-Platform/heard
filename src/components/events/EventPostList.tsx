import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import { moveInOrder } from "../../utils/live-event";
import type { EventSetupRoom } from "../../types";

export type EventPostBadge = "Live" | "Paused";

const BADGE_TONE: Record<EventPostBadge, string> = {
  Live: "text-white heard-primary-gradient",
  Paused: "attention-bg attention-text",
};

interface EventPostListProps {
  rooms: EventSetupRoom[];
  currentIndex: number | null;
  currentBadge: EventPostBadge;
  onReorder?: (roomOrder: string[]) => void;
}

export function EventPostList({ rooms, currentIndex, currentBadge, onReorder }: EventPostListProps) {
  const handleMove = (index: number, offset: -1 | 1) => {
    onReorder?.(moveInOrder(rooms.map((room) => room.id), index, offset));
  };

  return (
    <ol className="space-y-1.5">
      {rooms.map((room, index) => {
        const isCurrent = index === currentIndex;
        const isDone = currentIndex !== null && index < currentIndex;
        const rowTone = isCurrent ? "bg-primary/10 ring-1 ring-primary/40" : "bg-background/70";

        return (
          <li
            key={room.id}
            className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${rowTone} ${isDone ? "opacity-50" : ""}`}
            aria-current={isCurrent ? "step" : undefined}
          >
            <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground tabular-nums">
              {index + 1}
            </span>
            <span className="shrink-0 w-6 text-center text-base leading-none">
              {room.emoji ?? <MessageSquare className="w-4 h-4 mx-auto text-muted-foreground" />}
            </span>
            <span className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate">{room.topic}</span>
            {isCurrent && (
              <span
                className={`shrink-0 text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${BADGE_TONE[currentBadge]}`}
              >
                {currentBadge}
              </span>
            )}
            {onReorder && (
              <span className="shrink-0 flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Move ${room.topic} up`}
                  disabled={index === 0}
                  onClick={() => handleMove(index, -1)}
                >
                  <ChevronUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Move ${room.topic} down`}
                  disabled={index === rooms.length - 1}
                  onClick={() => handleMove(index, 1)}
                >
                  <ChevronDown />
                </Button>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
