import { useState } from "react";
import { motion } from "motion/react";
import type { Statement } from "../../../types";
import { getVoteShares, type DisplayView, type VoteShares } from "../../../utils/event-display";
import { DisplayChip } from "./DisplayParts";

interface StatementRowProps {
  statement: Statement;
  view: DisplayView;
  isAttendeeStatement: boolean;
  isMostSplit: boolean;
  isNewlyOnBoard: boolean;
  onSelect: (statementId: string) => void;
}

export function StatementRow({
  statement,
  view,
  isAttendeeStatement,
  isMostSplit,
  isNewlyOnBoard,
  onSelect,
}: StatementRowProps) {
  const [glowsOnFirstRender] = useState(isNewlyOnBoard);
  const voteShares = getVoteShares(statement);
  const isTwoColumnView = view === "agree-split";

  return (
    <motion.button
      layoutId={statement.id}
      type="button"
      onClick={() => onSelect(statement.id)}
      aria-label={`${statement.text}. ${describeVoteShares(voteShares)}`}
      className={`pass-tint-bg relative grid min-h-[3.7cqw] w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-[1.4cqw] overflow-hidden rounded-[0.7cqw] px-[1.3cqw] py-[0.7cqw] text-left ${glowsOnFirstRender ? "display-row-arrive" : ""}`}
    >
      <VoteShareBar voteShares={voteShares} showsDisagree={view !== "agree-only"} />
      <span
        className={`relative flex min-w-0 items-center font-semibold leading-tight ${isTwoColumnView ? "text-[1.55cqw]" : "text-[1.75cqw]"}`}
      >
        <span className="min-w-0 truncate">{statement.text}</span>
        {isAttendeeStatement && <DisplayChip tone="attendee">From the room</DisplayChip>}
        {isMostSplit && <DisplayChip tone="split">Split</DisplayChip>}
      </span>
      <VoteSharePercents voteShares={voteShares} view={view} />
    </motion.button>
  );
}

function VoteShareBar({ voteShares, showsDisagree }: { voteShares: VoteShares; showsDisagree: boolean }) {
  const disagreeWidthPercent = showsDisagree ? voteShares.disagree : 0;
  return (
    <span aria-hidden className="absolute inset-0 flex">
      <span
        className="agree-tint-bg relative h-full transition-[width] duration-700 ease-out"
        style={{ width: `${voteShares.agree}%` }}
      >
        {voteShares.agree > 0 && <span className="agree-bg absolute inset-y-0 left-0 w-[0.35cqw]" />}
      </span>
      <span className="h-full flex-1" />
      <span
        className="disagree-tint-bg relative h-full transition-[width] duration-700 ease-out"
        style={{ width: `${disagreeWidthPercent}%` }}
      >
        {disagreeWidthPercent > 0 && <span className="disagree-bg absolute inset-y-0 right-0 w-[0.35cqw]" />}
      </span>
    </span>
  );
}

function VoteSharePercents({ voteShares, view }: { voteShares: VoteShares; view: DisplayView }) {
  if (voteShares.total === 0) {
    return <span className="relative whitespace-nowrap text-[1.15cqw] font-semibold secondary-text">waiting for votes</span>;
  }
  const agreePercentLabel = `${Math.round(voteShares.agree)}%`;
  return (
    <span
      className={`relative whitespace-nowrap text-right font-extrabold leading-none tabular-nums ${view === "agree-split" ? "text-[1.7cqw]" : "text-[1.9cqw]"}`}
    >
      {view === "agree-only" ? agreePercentLabel : `${agreePercentLabel} · ${Math.round(voteShares.disagree)}%`}
    </span>
  );
}

const describeVoteShares = (voteShares: VoteShares): string =>
  voteShares.total === 0
    ? "No votes yet."
    : `${Math.round(voteShares.agree)}% agree, ${Math.round(voteShares.disagree)}% disagree, ${Math.round(voteShares.pass)}% pass.`;
