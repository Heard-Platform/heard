import { Eye, EyeOff } from "lucide-react";
import type { SupportViewAttendeeStatement } from "../../../types";
import { formatElapsed, getTotalVotes, getVoteMixPercents, orderNewestFirst } from "../../../utils/event-support";
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
  const hiddenCount = attendeeStatements.filter((statement) => statement.isHidden).length;

  return (
    <SupportPanel title={`Statements from the room · ${attendeeStatements.length}`}>
      {attendeeStatements.length === 0 ? (
        <SupportNote>Nobody has added a statement yet.</SupportNote>
      ) : (
        <>
          {hiddenCount > 0 && <SupportNote>{hiddenCount} hidden from phones and the display</SupportNote>}
          <ul className="divide-y">
            {orderNewestFirst(attendeeStatements).map((statement) => (
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
