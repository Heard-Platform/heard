import { useEffect, useMemo, useState, type ReactElement } from "react";
import type { Statement } from "../../../types";
import {
  findMostSplitStatementId,
  getLatestAttendeeStatement,
  isAttendeeStatement,
  pickBoardStatements,
  sortByAgreeShare,
  splitIntoConsensusColumns,
  type DisplayView,
} from "../../../utils/event-display";
import { DisplayBrand, DisplayChip, DisplayEyebrow, DisplayQr } from "./DisplayParts";
import { NewStatementStrip } from "./NewStatementStrip";
import { StatementRow } from "./StatementRow";

export interface DisplayBoardProps {
  eyebrow: string;
  title: string;
  statements: Statement[];
  startedAt: number | null;
  view: DisplayView;
  votingPaused: boolean;
  peopleHere: number;
  joinUrl: string;
  joinLabel: string;
  onSelectStatement: (statementId: string) => void;
}

export function DisplayBoard({
  eyebrow,
  title,
  statements,
  startedAt,
  view,
  votingPaused,
  peopleHere,
  joinUrl,
  joinLabel,
  onSelectStatement,
}: DisplayBoardProps) {
  const boardStatements = pickBoardStatements(statements, startedAt);
  const attendeeStatementIdsOnBoard = boardStatements
    .filter((statement) => isAttendeeStatement(statement, startedAt))
    .map((statement) => statement.id);
  const newlyOnBoardStatementIds = useNewlyAddedIds(attendeeStatementIdsOnBoard);
  const mostSplitStatementId = view === "agree-vs-disagree" ? findMostSplitStatementId(boardStatements) : null;
  const latestAttendeeStatement = getLatestAttendeeStatement(statements, startedAt);

  const renderStatementRow = (statement: Statement) => (
    <StatementRow
      key={statement.id}
      statement={statement}
      view={view}
      isAttendeeStatement={attendeeStatementIdsOnBoard.includes(statement.id)}
      isMostSplit={statement.id === mostSplitStatementId}
      isNewlyOnBoard={newlyOnBoardStatementIds.has(statement.id)}
      onSelect={onSelectStatement}
    />
  );

  return (
    <div className="absolute inset-0 grid grid-rows-[auto_minmax(0,1fr)_auto] gap-[1.3cqw] px-[3.6cqw] pt-[2.8cqw] pb-[2.2cqw]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-[2cqw]">
        <div>
          <DisplayEyebrow>{eyebrow}</DisplayEyebrow>
          <h1 className="mt-[0.5cqw] text-[3.4cqw] font-extrabold leading-[1.05] tracking-tight text-balance">{title}</h1>
          <DisplayLegend view={view} />
        </div>
        <div className="flex items-center gap-[1.4cqw]">
          <div className="text-right text-[1.25cqw] font-semibold secondary-text">
            <p className="text-[2.6cqw] font-extrabold leading-none tabular-nums">{peopleHere}</p>
            <p>{votingPaused ? "people voted" : "people voting"}</p>
            {votingPaused && <DisplayChip tone="paused">Voting paused</DisplayChip>}
          </div>
          <DisplayQr joinUrl={joinUrl} caption={joinLabel} className="w-[8cqw]" />
        </div>
      </div>

      {view === "agree-split" ? (
        <ConsensusColumns statements={boardStatements} renderStatementRow={renderStatementRow} />
      ) : (
        <div className="grid content-start gap-[0.5cqw]">{sortByAgreeShare(boardStatements).map(renderStatementRow)}</div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[1.6cqw]">
        <NewStatementStrip
          latestAttendeeStatement={latestAttendeeStatement}
          isLatestOnBoard={!!latestAttendeeStatement && attendeeStatementIdsOnBoard.includes(latestAttendeeStatement.id)}
          joinLabel={joinLabel}
        />
        <DisplayBrand />
      </div>
    </div>
  );
}

interface ConsensusColumnsProps {
  statements: Statement[];
  renderStatementRow: (statement: Statement) => ReactElement;
}

function ConsensusColumns({ statements, renderStatementRow }: ConsensusColumnsProps) {
  const { agreeStatements, splitStatements } = splitIntoConsensusColumns(statements);
  return (
    <div className="grid grid-cols-2 content-start gap-[2.4cqw]">
      <ConsensusColumn heading="Most consensus" note="either way" statementRows={agreeStatements.map(renderStatementRow)} />
      <ConsensusColumn heading="Where the room splits" note="let's talk" statementRows={splitStatements.map(renderStatementRow)} />
    </div>
  );
}

interface ConsensusColumnProps {
  heading: string;
  note: string;
  statementRows: ReactElement[];
}

function ConsensusColumn({ heading, note, statementRows }: ConsensusColumnProps) {
  return (
    <div>
      <h2 className="mb-[0.8cqw] flex items-baseline gap-[0.8cqw] text-[1.7cqw] font-extrabold">
        {heading}
        <span className="text-[1.15cqw] font-semibold secondary-text">{note}</span>
      </h2>
      <div className="grid gap-[0.5cqw]">{statementRows}</div>
    </div>
  );
}

interface LegendItem {
  label: string;
  swatchClassName: string;
}

const AGREE_PASS_DISAGREE_LEGEND: LegendItem[] = [
  { label: "Agree", swatchClassName: "agree-bg" },
  { label: "Pass", swatchClassName: "pass-tint-bg border border-slate-400" },
  { label: "Disagree", swatchClassName: "disagree-bg" },
];

const LEGEND_ITEMS_BY_VIEW: Record<DisplayView, LegendItem[]> = {
  "agree-only": [{ label: "Agree", swatchClassName: "agree-bg" }],
  "agree-vs-disagree": AGREE_PASS_DISAGREE_LEGEND,
  "agree-split": AGREE_PASS_DISAGREE_LEGEND,
};

function DisplayLegend({ view }: { view: DisplayView }) {
  return (
    <div className="mt-[0.8cqw] flex gap-[1.6cqw] text-[1.15cqw] font-semibold secondary-text">
      {LEGEND_ITEMS_BY_VIEW[view].map(({ label, swatchClassName }) => (
        <span key={label} className="inline-flex items-center gap-[0.5cqw]">
          <span className={`inline-block h-[1.1cqw] w-[1.1cqw] rounded-[0.25cqw] ${swatchClassName}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

function useNewlyAddedIds(currentIds: string[]): Set<string> {
  const [seenIds, setSeenIds] = useState(() => new Set(currentIds));
  const newIdsKey = currentIds.filter((id) => !seenIds.has(id)).join(",");

  useEffect(() => {
    if (newIdsKey) setSeenIds((previousSeenIds) => new Set([...previousSeenIds, ...newIdsKey.split(",")]));
  }, [newIdsKey]);

  return useMemo(() => new Set(newIdsKey ? newIdsKey.split(",") : []), [newIdsKey]);
}
