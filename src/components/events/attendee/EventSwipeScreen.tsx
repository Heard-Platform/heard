import { useMemo } from "react";
import type { DebateRoom, Statement, SwipeSixItem } from "../../../types";
import { FeatureFlags, isFeatureEnabled } from "../../../utils/constants/feature-flags";
import type { SwipeVote } from "../../flyer/FlyerSwipeCard";
import { SwipeDeck } from "../../swipe-six/SwipeDeck";
import { AddStatementField } from "./AddStatementField";
import { AttendeeFrame } from "./AttendeeFrame";

interface EventSwipeScreenProps {
  room: DebateRoom;
  statements: Statement[];
  votedCount: number;
  onVote: (statement: Statement, vote: SwipeVote) => void;
  onSuperAgree: (statement: Statement) => void;
  onAddStatement: (text: string) => Promise<boolean>;
}

export function EventSwipeScreen({
  room,
  statements,
  votedCount,
  onVote,
  onSuperAgree,
  onAddStatement,
}: EventSwipeScreenProps) {
  const items = useMemo(() => statements.map((statement) => ({ room, statement })), [room, statements]);
  const canSuperAgree = isFeatureEnabled(FeatureFlags.SUPER_AGREE);
  const handleSuperAgree = (item: SwipeSixItem) => onSuperAgree(item.statement);

  return (
    <AttendeeFrame>
      <SwipeDeck
        items={items}
        votedCount={votedCount}
        onVote={(item, vote) => onVote(item.statement, vote)}
        onSuperAgree={canSuperAgree ? handleSuperAgree : undefined}
      />
      <div className="mt-auto pt-5">
        <AddStatementField onAddStatement={onAddStatement} />
      </div>
    </AttendeeFrame>
  );
}
