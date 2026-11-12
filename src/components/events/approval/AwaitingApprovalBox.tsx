import { Check, X } from "lucide-react";
import { useState } from "react";
import type { SupportViewAttendeeStatement } from "../../../types";
import {
  formatElapsed,
  orderSectionNumbersWithPinnedFirst,
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
import { SupportNote } from "../support/SupportParts";

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

const NO_PINNED_SECTION = "none";

interface AwaitingApprovalBoxProps {
  attendeeStatements: SupportViewAttendeeStatement[];
  updatingStatementIds: string[];
  now: number;
  onSetStatementHidden: (
    statement: SupportViewAttendeeStatement,
    isHidden: boolean,
  ) => void;
}

export function AwaitingApprovalBox({
  attendeeStatements,
  updatingStatementIds,
  now,
  onSetStatementHidden,
}: AwaitingApprovalBoxProps) {
  const [sectionCount, setSectionCount] = useState(1);
  const [pinnedSectionNumber, setPinnedSectionNumber] = useState<
    number | null
  >(null);
  const approvalSections = splitAwaitingApprovalIntoSections(
    attendeeStatements,
    sectionCount,
  );
  const awaitingApprovalCount = attendeeStatements.filter(
    (statement) => statement.isAwaitingApproval,
  ).length;
  const isPinnedSectionShown =
    pinnedSectionNumber !== null && pinnedSectionNumber <= sectionCount;
  const shownPinnedSectionNumber = isPinnedSectionShown
    ? pinnedSectionNumber
    : null;
  const orderedSectionNumbers = orderSectionNumbersWithPinnedFirst(
    sectionCount,
    shownPinnedSectionNumber,
  );

  const handleSectionCountChange = (value: string) =>
    setSectionCount(Number(value));

  const handlePinnedSectionChange = (value: string) =>
    setPinnedSectionNumber(
      value === NO_PINNED_SECTION ? null : Number(value),
    );

  return (
    <div className="attention-bg attention-border rounded-xl border px-3 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider attention-text">
          Waiting for approval · {awaitingApprovalCount}
        </h3>
        <div className="flex items-center gap-3">
          {sectionCount > 1 && (
            <PinnedSectionSelect
              sectionCount={sectionCount}
              pinnedSectionNumber={shownPinnedSectionNumber}
              onPinnedSectionChange={handlePinnedSectionChange}
            />
          )}
          <SectionCountSelect
            sectionCount={sectionCount}
            onSectionCountChange={handleSectionCountChange}
          />
        </div>
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
          {orderedSectionNumbers.map((sectionNumber) => (
            <ApprovalSection
              key={sectionNumber}
              sectionNumber={sectionNumber}
              isPinned={sectionNumber === shownPinnedSectionNumber}
              sectionColorClass={
                APPROVAL_SECTION_COLOR_CLASSES[sectionNumber - 1]
              }
              awaitingApprovalStatements={
                approvalSections[sectionNumber - 1]
              }
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

interface PinnedSectionSelectProps {
  sectionCount: number;
  pinnedSectionNumber: number | null;
  onPinnedSectionChange: (value: string) => void;
}

function PinnedSectionSelect({
  sectionCount,
  pinnedSectionNumber,
  onPinnedSectionChange,
}: PinnedSectionSelectProps) {
  const sectionNumbers = APPROVAL_SECTION_COUNT_OPTIONS.slice(
    0,
    sectionCount,
  );
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs secondary-text">My section</span>
      <Select
        value={
          pinnedSectionNumber === null
            ? NO_PINNED_SECTION
            : String(pinnedSectionNumber)
        }
        onValueChange={onPinnedSectionChange}
      >
        <SelectTrigger
          size="sm"
          className="w-20"
          aria-label="My section"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_PINNED_SECTION}>None</SelectItem>
          {sectionNumbers.map((sectionNumber) => (
            <SelectItem key={sectionNumber} value={String(sectionNumber)}>
              {sectionNumber}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface ApprovalSectionProps {
  sectionNumber: number;
  isPinned: boolean;
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
  isPinned,
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
        Section {sectionNumber}
        {isPinned && " · yours"} · {waitingSummary}
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
