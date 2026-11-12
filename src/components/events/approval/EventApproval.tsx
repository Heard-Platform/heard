import _ from "lodash";
import { Eye, EyeOff } from "lucide-react";
import type { SupportViewAttendeeStatement } from "../../../types";
import { formatElapsed, orderNewestFirst } from "../../../utils/event-support";
import { Button } from "../../ui/button";
import { AwaitingApprovalBox } from "./AwaitingApprovalBox";
import { SupportNote, SupportPanel } from "../support/SupportParts";

interface EventApprovalProps {
  eventName: string;
  attendeeStatements: SupportViewAttendeeStatement[];
  updatingStatementIds: string[];
  now: number;
  onSetStatementHidden: (
    statement: SupportViewAttendeeStatement,
    isHidden: boolean,
  ) => void;
}

export function EventApproval({
  eventName,
  attendeeStatements,
  updatingStatementIds,
  now,
  onSetStatementHidden,
}: EventApprovalProps) {
  const [awaitingApprovalStatements, reviewedStatements] = _.partition(
    attendeeStatements,
    (statement) => statement.isAwaitingApproval,
  );

  return (
    <div className="display-screen-bg min-h-dvh">
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {eventName}
          </h1>
          <p className="text-sm secondary-text">Statement approval</p>
        </header>
        {awaitingApprovalStatements.length > 0 ? (
          <AwaitingApprovalBox
            attendeeStatements={attendeeStatements}
            updatingStatementIds={updatingStatementIds}
            now={now}
            onSetStatementHidden={onSetStatementHidden}
          />
        ) : (
          <SupportNote>Nothing waiting for approval.</SupportNote>
        )}
        <SupportPanel
          title={`Reviewed · ${reviewedStatements.length}`}
        >
          {reviewedStatements.length === 0 ? (
            <SupportNote>Nothing reviewed yet.</SupportNote>
          ) : (
            <ul className="divide-y">
              {orderNewestFirst(reviewedStatements).map((statement) => (
                <ReviewedStatementRow
                  key={statement.id}
                  statement={statement}
                  isUpdating={updatingStatementIds.includes(statement.id)}
                  now={now}
                  onSetStatementHidden={onSetStatementHidden}
                />
              ))}
            </ul>
          )}
        </SupportPanel>
      </div>
    </div>
  );
}

interface ReviewedStatementRowProps {
  statement: SupportViewAttendeeStatement;
  isUpdating: boolean;
  now: number;
  onSetStatementHidden: (
    statement: SupportViewAttendeeStatement,
    isHidden: boolean,
  ) => void;
}

function ReviewedStatementRow({
  statement,
  isUpdating,
  now,
  onSetStatementHidden,
}: ReviewedStatementRowProps) {
  const handleToggleHidden = () =>
    onSetStatementHidden(statement, !statement.isHidden);

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 ${statement.isHidden ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 space-y-1.5">
        <p className="font-semibold leading-snug">
          {statement.isHidden && (
            <span className="mr-2 text-xs font-bold uppercase tracking-wider secondary-text">
              Hidden
            </span>
          )}
          {statement.text}
        </p>
        <SupportNote>
          Q{statement.postNumber} ·{" "}
          {formatElapsed(now - statement.createdAt)} ago
        </SupportNote>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={isUpdating}
        onClick={handleToggleHidden}
      >
        {statement.isHidden ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
        {statement.isHidden ? "Unhide" : "Hide"}
      </Button>
    </li>
  );
}
