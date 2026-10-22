import { useMemo } from "react";
import type { DebateRoom, Statement } from "../../../types";
import type { SwipeVote } from "../../flyer/FlyerSwipeCard";
import { SwipeDeck } from "../../swipe-six/SwipeDeck";
import { AttendeeFrame } from "./AttendeeFrame";

interface EventSwipeScreenProps {
  room: DebateRoom;
  statements: Statement[];
  votedCount: number;
  onVote: (statement: Statement, vote: SwipeVote) => void;
}

export function EventSwipeScreen({ room, statements, votedCount, onVote }: EventSwipeScreenProps) {
  const items = useMemo(() => statements.map((statement) => ({ room, statement })), [room, statements]);

  return (
    <AttendeeFrame>
      <SwipeDeck
        items={items}
        votedCount={votedCount}
        hideCommunity
        onVote={(item, vote) => onVote(item.statement, vote)}
      />
    </AttendeeFrame>
  );
}
