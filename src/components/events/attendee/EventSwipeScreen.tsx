import { useMemo } from "react";
import type { DebateRoom, Statement } from "../../../types";
import type { SwipeVote } from "../../flyer/FlyerSwipeCard";
import { SwipeDeck } from "../../swipe-six/SwipeDeck";
import { AddStatementField } from "./AddStatementField";
import { AttendeeFrame } from "./AttendeeFrame";

interface EventSwipeScreenProps {
  room: DebateRoom;
  statements: Statement[];
  votedCount: number;
  onVote: (statement: Statement, vote: SwipeVote) => void;
  onAddStatement: (text: string) => Promise<boolean>;
}

export function EventSwipeScreen({
  room,
  statements,
  votedCount,
  onVote,
  onAddStatement,
}: EventSwipeScreenProps) {
  const items = useMemo(() => statements.map((statement) => ({ room, statement })), [room, statements]);

  return (
    <AttendeeFrame>
      <SwipeDeck
        items={items}
        votedCount={votedCount}
        onVote={(item, vote) => onVote(item.statement, vote)}
      />
      <div className="mt-auto pt-5">
        <AddStatementField onAddStatement={onAddStatement} />
      </div>
    </AttendeeFrame>
  );
}
