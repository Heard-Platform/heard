import _ from "lodash";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { useState } from "react";
import type { SupportViewAttendeeStatement } from "../../../types";
import {
  formatElapsed,
  getTotalVotes,
  getVoteMixPercents,
  orderNewestFirst,
  splitAwaitingApprovalIntoSections,
} from "../../../utils/event-support";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
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
            <AwaitingApprovalBox
              attendeeStatements={attendeeStatements}
              awaitingApprovalCount={awaitingApprovalStatements.length}
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

const APPROVAL_SECTION_COLOR_CLASSES = [
  "approval-section-color-1",
  "approval-section-color-2",
  "approval-section-color-3",
  "approval-section-color-4",
  "approval-section-color-5",
  "approval-section-color-6",
];

const APPROVAL_SECTION_COUNT_OPTIONS =
  APPROVAL_SECTION_COLOR_CLASSES.map((_, index) => index + 1);

interface AwaitingApprovalBoxProps {
  attendeeStatements: SupportViewAttendeeStatement[];
  awaitingApprovalCount: number;
  updatingStatementIds: string[];
  now: number;
  onSetStatementHidden: (
    statement: SupportViewAttendeeStatement,
    isHidden: boolean,
  ) => void;
}

function AwaitingApprovalBox({
  attendeeStatements,
  awaitingApprovalCount,
  updatingStatementIds,
  now,
  onSetStatementHidden,
}: AwaitingApprovalBoxProps) {
  const [sectionCount, setSectionCount] = useState(1);
  const approvalSections = splitAwaitingApprovalIntoSections(
    attendeeStatements,
    sectionCount,
  );

  const handleSectionCountChange = (value: string) =>
    setSectionCount(Number(value));

  return (
    <div className="attention-bg attention-border rounded-xl border px-3 pt-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider attention-text">
          Waiting for approval · {awaitingApprovalCount}
        </h3>
        <SectionCountSelect
          sectionCount={sectionCount}
          onSectionCountChange={handleSectionCountChange}
        />
      </div>
      {sectionCount === 1 ? (
        <AwaitingApprovalList
          awaitingApprovalStatements={approvalSections[0]}
          updatingStatementIds={updatingStatementIds}
          now={now}
          onSetStatementHidden={onSetStatementHidden}
        />
      ) : (
        <div className="space-y-3 pb-3 pt-2">
          {approvalSections.map((sectionStatements, sectionIndex) => (
            <ApprovalSection
              key={sectionIndex}
              sectionNumber={sectionIndex + 1}
              sectionColorClass={
                APPROVAL_SECTION_COLOR_CLASSES[sectionIndex]
              }
              awaitingApprovalStatements={sectionStatements}
              updatingStatementIds={updatingStatementIds}
              now={now}
              onSetStatementHidden={onSetStatementHidden}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SectionCountSelectProps {
  sectionCount: number;
  onSectionCountChange: (value: string) => void;
}

function SectionCountSelect({
  sectionCount,
  onSectionCountChange,
}: SectionCountSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs secondary-text">Sections</span>
      <Select
        value={String(sectionCount)}
        onValueChange={onSectionCountChange}
      >
        <SelectTrigger
          size="sm"
          className="w-16"
          aria-label="Sections"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {APPROVAL_SECTION_COUNT_OPTIONS.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface ApprovalSectionProps {
  sectionNumber: number;
  sectionColorClass: string;
  awaitingApprovalStatements: SupportViewAttendeeStatement[];
  updatingStatementIds: string[];
  now: number;
  onSetStatementHidden: (
    statement: SupportViewAttendeeStatement,
    isHidden: boolean,
  ) => void;
}

function ApprovalSection({
  sectionNumber,
  sectionColorClass,
  awaitingApprovalStatements,
  updatingStatementIds,
  now,
  onSetStatementHidden,
}: ApprovalSectionProps) {
  const waitingSummary =
    awaitingApprovalStatements.length === 0
      ? "all clear"
      : `${awaitingApprovalStatements.length} waiting`;

  return (
    <div
      className={`${sectionColorClass} approval-section-bg approval-section-border rounded-lg border border-l-4 px-3 py-2`}
    >
      <h4 className="text-xs font-bold uppercase tracking-wider approval-section-text">
        Section {sectionNumber} · {waitingSummary}
      </h4>
      <AwaitingApprovalList
        awaitingApprovalStatements={awaitingApprovalStatements}
        updatingStatementIds={updatingStatementIds}
        now={now}
        onSetStatementHidden={onSetStatementHidden}
      />
    </div>
  );
}

interface AwaitingApprovalListProps {
  awaitingApprovalStatements: SupportViewAttendeeStatement[];
  updatingStatementIds: string[];
  now: number;
  onSetStatementHidden: (
    statement: SupportViewAttendeeStatement,
    isHidden: boolean,
  ) => void;
}

function AwaitingApprovalList({
  awaitingApprovalStatements,
  updatingStatementIds,
  now,
  onSetStatementHidden,
}: AwaitingApprovalListProps) {
  return (
    <ul className="divide-y">
      {awaitingApprovalStatements.map((statement) => (
        <AwaitingApprovalRow
          key={statement.id}
          statement={statement}
          isUpdating={updatingStatementIds.includes(statement.id)}
          now={now}
          onSetStatementHidden={onSetStatementHidden}
        />
      ))}
    </ul>
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
