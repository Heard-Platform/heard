import _ from "lodash";
import { Check, Eye, EyeOff, X } from "lucide-react";
import type { SupportViewAttendeeStatement } from "../../../types";
import {
  formatElapsed,
  getTotalVotes,
  getVoteMixPercents,
  orderNewestFirst,
  orderOldestFirst,
} from "../../../utils/event-support";
import { Button } from "../../ui/button";
import { AGREE_COLOR, DISAGREE_COLOR, PASS_COLOR, StackedBar, SupportNote, SupportPanel } from "./SupportParts";

interface AttendeeStatementsPanelProps {
  attendeeStatements: SupportViewAttendeeStatement[];
  updatingStatementIds: string[];
  now: number;
  onSetStatementHidden: (statement: SupportViewAttendeeStatement, isHidden: boolean) => void;
}

export function AttendeeStatementsPanel({
  attendeeStatements,
  updatingStatementIds,
  now,
  onSetStatementHidden,
}: AttendeeStatementsPanelProps) {
  const [awaitingApprovalStatements, decidedStatements] = _.partition(
    attendeeStatements,
    (statement) => statement.isAwaitingApproval,
  );
  const hiddenCount = decidedStatements.filter(
    (statement) => statement.isHidden,
  ).length;

  return (
    <SupportPanel title={`Statements from the room · ${attendeeStatements.length}`}>
      {attendeeStatements.length === 0 ? (
        <SupportNote>Nobody has added a statement yet.</SupportNote>
      ) : (
        <>
          {awaitingApprovalStatements.length > 0 && (
            <AwaitingApprovalSection
              awaitingApprovalStatements={awaitingApprovalStatements}
              updatingStatementIds={updatingStatementIds}
              now={now}
              onSetStatementHidden={onSetStatementHidden}
            />
          )}
          {hiddenCount > 0 && <SupportNote>{hiddenCount} hidden from phones and the display</SupportNote>}
          <ul className="divide-y">
            {orderNewestFirst(decidedStatements).map((statement) => (
              <AttendeeStatementRow
                key={statement.id}
                statement={statement}
                isUpdating={updatingStatementIds.includes(statement.id)}
                now={now}
                onSetStatementHidden={onSetStatementHidden}
              />
            ))}
          </ul>
        </>
      )}
    </SupportPanel>
  );
}

interface AwaitingApprovalSectionProps {
  awaitingApprovalStatements: SupportViewAttendeeStatement[];
  updatingStatementIds: string[];
  now: number;
  onSetStatementHidden: (
    statement: SupportViewAttendeeStatement,
    isHidden: boolean,
  ) => void;
}

function AwaitingApprovalSection({
  awaitingApprovalStatements,
  updatingStatementIds,
  now,
  onSetStatementHidden,
}: AwaitingApprovalSectionProps) {
  return (
    <div className="attention-bg attention-border rounded-xl border px-3 pt-3">
      <h3 className="text-xs font-bold uppercase tracking-wider attention-text">
        Waiting for approval · {awaitingApprovalStatements.length}
      </h3>
      <ul className="divide-y">
        {orderOldestFirst(awaitingApprovalStatements).map(
          (statement) => (
            <AwaitingApprovalRow
              key={statement.id}
              statement={statement}
              isUpdating={updatingStatementIds.includes(
                statement.id,
              )}
              now={now}
              onSetStatementHidden={onSetStatementHidden}
            />
          ),
        )}
      </ul>
    </div>
  );
}

interface AwaitingApprovalRowProps {
  statement: SupportViewAttendeeStatement;
  isUpdating: boolean;
  now: number;
  onSetStatementHidden: (
    statement: SupportViewAttendeeStatement,
    isHidden: boolean,
  ) => void;
}

function AwaitingApprovalRow({
  statement,
  isUpdating,
  now,
  onSetStatementHidden,
}: AwaitingApprovalRowProps) {
  const handleApprove = () => onSetStatementHidden(statement, false);
  const handleReject = () => onSetStatementHidden(statement, true);

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
      <div className="min-w-0 space-y-1.5">
        <p className="font-semibold leading-snug">{statement.text}</p>
        <SupportNote>
          Q{statement.postNumber} ·{" "}
          {formatElapsed(now - statement.createdAt)} ago
        </SupportNote>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isUpdating}
          onClick={handleReject}
        >
          <X className="h-4 w-4" />
          Reject
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={isUpdating}
          onClick={handleApprove}
        >
          <Check className="h-4 w-4" />
          Approve
        </Button>
      </div>
    </li>
  );
}

interface AttendeeStatementRowProps {
  statement: SupportViewAttendeeStatement;
  isUpdating: boolean;
  now: number;
  onSetStatementHidden: (statement: SupportViewAttendeeStatement, isHidden: boolean) => void;
}

function AttendeeStatementRow({ statement, isUpdating, now, onSetStatementHidden }: AttendeeStatementRowProps) {
  const totalVotes = getTotalVotes(statement);
  const voteMixPercents = getVoteMixPercents(statement);

  return (
    <li className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 ${statement.isHidden ? "opacity-50" : ""}`}>
      <div className="min-w-0 space-y-1.5">
        <p className="font-semibold leading-snug">
          {statement.isHidden && <span className="mr-2 text-xs font-bold uppercase tracking-wider secondary-text">Hidden</span>}
          {statement.text}
        </p>
        <SupportNote>
          Q{statement.postNumber} · {formatElapsed(now - statement.createdAt)} ago · {totalVotes} votes
        </SupportNote>
        {totalVotes > 0 && (
          <div className="max-w-md space-y-1">
            <StackedBar
              label={`${voteMixPercents.agree}% agree, ${voteMixPercents.pass}% pass, ${voteMixPercents.disagree}% disagree`}
              segments={[
                { key: "agree", percent: voteMixPercents.agree, color: AGREE_COLOR },
                { key: "pass", percent: voteMixPercents.pass, color: PASS_COLOR },
                { key: "disagree", percent: voteMixPercents.disagree, color: DISAGREE_COLOR },
              ]}
            />
            <SupportNote>
              {`${statement.agreeVotes} agree (${voteMixPercents.agree}%) · ${statement.passVotes} pass (${voteMixPercents.pass}%) · ${statement.disagreeVotes} disagree (${voteMixPercents.disagree}%)`}
            </SupportNote>
          </div>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={isUpdating}
        onClick={() => onSetStatementHidden(statement, !statement.isHidden)}
      >
        {statement.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        {statement.isHidden ? "Unhide" : "Hide"}
      </Button>
    </li>
  );
}
