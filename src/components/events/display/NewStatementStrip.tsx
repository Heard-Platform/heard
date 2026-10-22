import { motion } from "motion/react";
import type { Statement } from "../../../types";
import { useNow } from "../../../hooks/useNow";
import { getNewStatementStripMode, getVoteShares, type NewStatementStripMode } from "../../../utils/event-display";

const STRIP_CLOCK_INTERVAL_MS = 1000;

interface NewStatementStripProps {
  latestAttendeeStatement: Statement | null;
  isLatestOnBoard: boolean;
  joinLabel: string;
}

interface StripClassNames {
  strip: string;
  label: string;
  text: string;
}

const STRIP_CLASS_NAMES_BY_MODE: Record<NewStatementStripMode, StripClassNames> = {
  empty: { strip: "new-statement-strip-bg", label: "secondary-text", text: "secondary-text" },
  celebrating: { strip: "celebrate-strip-bg", label: "celebrate-strip-text", text: "text-[1.75cqw]" },
  "collecting-votes": { strip: "new-statement-strip-bg", label: "new-statement-strip-text", text: "" },
  invite: { strip: "new-statement-strip-bg", label: "secondary-text", text: "secondary-text" },
};

export function NewStatementStrip({ latestAttendeeStatement, isLatestOnBoard, joinLabel }: NewStatementStripProps) {
  const now = useNow(STRIP_CLOCK_INTERVAL_MS);
  const stripMode = getNewStatementStripMode(latestAttendeeStatement, isLatestOnBoard, now);
  const stripClassNames = STRIP_CLASS_NAMES_BY_MODE[stripMode];
  const stripText = getStripText(stripMode, latestAttendeeStatement);

  return (
    <div
      aria-live="polite"
      className={`grid min-h-[3.4cqw] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[1.2cqw] rounded-[0.7cqw] px-[1.3cqw] py-[0.75cqw] transition-colors duration-500 ${stripClassNames.strip}`}
    >
      <span
        className={`inline-flex items-center gap-[0.5cqw] whitespace-nowrap text-[1cqw] font-bold uppercase leading-none tracking-widest ${stripClassNames.label}`}
      >
        <span className="h-[0.8cqw] w-[0.8cqw] rounded-full bg-current" />
        {stripMode === "invite" ? "Something missing?" : "New from the room"}
      </span>
      <motion.span
        key={stripText}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`min-w-0 truncate text-[1.6cqw] font-semibold leading-tight ${stripClassNames.text}`}
      >
        {stripText}
      </motion.span>
      <span className="whitespace-nowrap text-[1.1cqw] font-semibold tabular-nums secondary-text">
        {getStripDetail(stripMode, latestAttendeeStatement, isLatestOnBoard, joinLabel)}
      </span>
    </div>
  );
}

function getStripText(stripMode: NewStatementStripMode, latestAttendeeStatement: Statement | null): string {
  if (stripMode === "empty" || !latestAttendeeStatement) return "Nothing yet. Add your own statement on your phone.";
  if (stripMode === "invite") return "Add your own statement. The room votes on it live.";
  return latestAttendeeStatement.text;
}

function getStripDetail(
  stripMode: NewStatementStripMode,
  latestAttendeeStatement: Statement | null,
  isLatestOnBoard: boolean,
  joinLabel: string,
): string {
  if (stripMode === "invite") return joinLabel;
  if (stripMode === "empty" || !latestAttendeeStatement) return "";
  if (isLatestOnBoard) return "On the board";
  const voteCount = getVoteShares(latestAttendeeStatement).total;
  return `${voteCount} ${voteCount === 1 ? "vote" : "votes"} so far`;
}
