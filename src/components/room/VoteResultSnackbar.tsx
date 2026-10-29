import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
// @ts-ignore
import { toast } from "sonner@2.0.3";
import { Flag, Share, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { RenderedStatement } from "../RenderedStatement";
import { api } from "../../utils/api";
import { share } from "../../utils/share";
import { createShareableLink } from "../../utils/url";
import {
  getEmphasizedSide,
  getVoteResultDetail,
  getVoteResultHeadline,
  type DecisiveVoteSide,
  type VoteResult,
  type VoteResultKind,
} from "../../utils/vote-result";
import type { Statement } from "../../types";

export const VOTE_RESULT_SNACKBAR_DURATION_MS = 2500;
export const VOTE_RESULT_SNACKBAR_WITH_SHARE_DURATION_MS = 5000;
const BAR_SEGMENT_MIN_PERCENT_FOR_LABEL = 16;

export interface LatestVote {
  statement: Statement;
  result: VoteResult;
}

interface VoteResultSnackbarProps {
  latestVote: LatestVote | null;
  onDismiss: () => void;
}

interface ShareCopy {
  title: string;
  invitation: string;
  clickedEventName: string;
}

type PanelTone = "agree_majority" | "disagree_majority" | "split";

const SEEN_EVENT_NAME_BY_KIND: Record<VoteResultKind, string> = {
  first_vote: "first_vote_seen",
  swung_vote: "vote_swing_seen",
  nearly_split: "vote_result_seen",
  with_majority: "vote_result_seen",
  in_minority: "vote_result_seen",
};

const SHARE_COPY_BY_KIND: Partial<Record<VoteResultKind, ShareCopy>> = {
  first_vote: {
    title: "I cast the first vote!",
    invitation: "Be the next to weigh in:",
    clickedEventName: "first_vote_share_clicked",
  },
  swung_vote: {
    title: "You swung the vote!",
    invitation: "Know anyone else who wants to weigh in?",
    clickedEventName: "vote_swing_share_clicked",
  },
};

const PANEL_TONE_CLASSES: Record<PanelTone, { background: string; emphasizedText: string }> = {
  agree_majority: {
    background: "strong-agree-bg",
    emphasizedText: "strong-agree-text",
  },
  disagree_majority: {
    background: "strong-disagree-bg",
    emphasizedText: "strong-disagree-text",
  },
  split: {
    background: "strong-split-bg",
    emphasizedText: "strong-split-text",
  },
};

const isShareOffered = (kind: VoteResultKind) => SHARE_COPY_BY_KIND[kind] !== undefined;

const getMajorityTone = (majoritySide: DecisiveVoteSide): PanelTone =>
  majoritySide === "agree" ? "agree_majority" : "disagree_majority";

const getPanelTone = (result: VoteResult, hasBarSettled: boolean): PanelTone => {
  if (result.kind === "nearly_split") return "split";
  if (result.kind === "swung_vote" && !hasBarSettled) return "split";
  return getMajorityTone(result.majoritySide);
};

const clampBarSegmentPercent = (percent: number) =>
  Math.min(
    Math.max(percent, BAR_SEGMENT_MIN_PERCENT_FOR_LABEL),
    100 - BAR_SEGMENT_MIN_PERCENT_FOR_LABEL,
  );

const shareLatestVote = async ({ statement, result }: LatestVote) => {
  const shareCopy = SHARE_COPY_BY_KIND[result.kind];
  if (!shareCopy) return;

  api.trackEvent(shareCopy.clickedEventName, statement.roomId);
  const link = `${createShareableLink(statement.roomId)}?statement=${statement.id}`;
  await share({
    url: link,
    title: shareCopy.title,
    text: `${shareCopy.invitation} "${statement.text}" ${link}`,
    onSuccess: () => toast.success("Link copied to clipboard!"),
    onError: (error) => {
      toast.error("Failed to share link");
      console.error("Share error:", error);
    },
  });
};

export function VoteResultSnackbar({ latestVote, onDismiss }: VoteResultSnackbarProps) {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!latestVote) return;

    const { statement, result } = latestVote;
    api.trackEvent(SEEN_EVENT_NAME_BY_KIND[result.kind], statement.roomId);

    const durationMs = isShareOffered(result.kind)
      ? VOTE_RESULT_SNACKBAR_WITH_SHARE_DURATION_MS
      : VOTE_RESULT_SNACKBAR_DURATION_MS;
    const dismissTimeoutId = setTimeout(() => onDismissRef.current(), durationMs);
    return () => clearTimeout(dismissTimeoutId);
  }, [latestVote]);

  return createPortal(
    <AnimatePresence>
      {latestVote && (
        <motion.div
          key="vote-result-snackbar"
          role="status"
          aria-live="polite"
          className="fixed inset-x-3 top-2.5 alert-layer mx-auto max-w-[var(--room-card-max-width)]"
          initial={{ y: "-160%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-160%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        >
          {latestVote.result.kind === "first_vote" ? (
            <FirstVotePanel key={latestVote.statement.id} latestVote={latestVote} />
          ) : (
            <TallyPanel key={latestVote.statement.id} latestVote={latestVote} />
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function FirstVotePanel({ latestVote }: { latestVote: LatestVote }) {
  const { statement, result } = latestVote;

  return (
    <div className="flex items-center gap-3 rounded-2xl p-3.5 shadow-2xl celebrate-bg dark-text">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full dark-bg celebrate-text">
        <Flag className="h-6 w-6" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[21px] font-extrabold leading-tight">
          {getVoteResultHeadline(result)}
        </p>
        <StatementLine
          statement={statement}
          prefix="You set the tone on"
          className="dark-text-soft"
        />
      </div>
      <VoteResultShareButton
        latestVote={latestVote}
        className="dark-bg celebrate-text"
      />
    </div>
  );
}

function TallyPanel({ latestVote }: { latestVote: LatestVote }) {
  const { statement, result } = latestVote;
  const [hasBarSettled, setHasBarSettled] = useState(false);
  const isSwungVote = result.kind === "swung_vote";
  const toneClasses = PANEL_TONE_CLASSES[getPanelTone(result, hasBarSettled)];

  return (
    <div
      className={`flex flex-col gap-2.5 rounded-2xl px-4 pt-3.5 pb-3 text-white shadow-2xl transition-colors duration-500 ${toneClasses.background} ${isSwungVote ? "celebrate-outline" : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <p className="flex min-w-0 flex-1 items-center gap-2 text-[19px] font-extrabold leading-tight">
          {isSwungVote && <Sparkles className="h-5 w-5 shrink-0 celebrate-text" />}
          {getVoteResultHeadline(result)}
        </p>
        {isSwungVote && (
          <VoteResultShareButton
            latestVote={latestVote}
            className="celebrate-bg dark-text"
          />
        )}
      </div>
      <VoteResultBar
        result={result}
        emphasizedTextClass={toneClasses.emphasizedText}
        showsHalfwayMark={isSwungVote}
        onSettled={() => setHasBarSettled(true)}
      />
      <StatementLine
        statement={statement}
        detail={getVoteResultDetail(result)}
        className="translucent-light-text"
      />
    </div>
  );
}

interface VoteResultBarProps {
  result: VoteResult;
  emphasizedTextClass: string;
  showsHalfwayMark: boolean;
  onSettled: () => void;
}

function VoteResultBar({
  result,
  emphasizedTextClass,
  showsHalfwayMark,
  onSettled,
}: VoteResultBarProps) {
  const emphasizedSide = getEmphasizedSide(result);
  const getSegmentClass = (side: DecisiveVoteSide) =>
    side === emphasizedSide
      ? `normal-bg ${emphasizedTextClass}`
      : "translucent-light-bg text-white";

  return (
    <div className="relative flex h-[30px] gap-[3px]">
      {showsHalfwayMark && (
        <div className="absolute -top-1 -bottom-1 left-1/2 z-10 w-0.5 -translate-x-1/2 rounded-full celebrate-bg" />
      )}
      <motion.div
        className={`flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-l-full rounded-r-sm pl-2.5 text-sm font-extrabold transition-colors duration-500 ${getSegmentClass("agree")}`}
        initial={{ width: `${clampBarSegmentPercent(result.agreePercentBeforeVote)}%` }}
        animate={{ width: `${clampBarSegmentPercent(result.agreePercent)}%` }}
        transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
        onAnimationComplete={onSettled}
      >
        <ThumbsUp className="h-[15px] w-[15px] shrink-0" />
        {result.agreePercent}%
      </motion.div>
      <div
        className={`flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-hidden whitespace-nowrap rounded-l-sm rounded-r-full pr-2.5 text-sm font-extrabold transition-colors duration-500 ${getSegmentClass("disagree")}`}
      >
        {result.disagreePercent}%
        <ThumbsDown className="h-[15px] w-[15px] shrink-0" />
      </div>
    </div>
  );
}

interface StatementLineProps {
  statement: Statement;
  prefix?: string;
  detail?: string;
  className: string;
}

function StatementLine({ statement, prefix, detail, className }: StatementLineProps) {
  return (
    <p className={`flex min-w-0 text-[13px] leading-snug ${className}`}>
      {prefix && <span className="shrink-0 whitespace-pre">{`${prefix} `}</span>}
      <span className="min-w-0 truncate">
        “<RenderedStatement text={statement.text} />”
      </span>
      {detail && <span className="shrink-0 whitespace-pre">{` · ${detail}`}</span>}
    </p>
  );
}

function VoteResultShareButton({
  latestVote,
  className,
}: {
  latestVote: LatestVote;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={() => shareLatestVote(latestVote)}
      className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-extrabold ${className}`}
    >
      <Share className="h-3.5 w-3.5" />
      Share
    </button>
  );
}
