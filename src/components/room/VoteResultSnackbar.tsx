import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
// @ts-ignore
import { toast } from "sonner@2.0.3";
import { Share } from "lucide-react";
import { RenderedStatement } from "../RenderedStatement";
import { api } from "../../utils/api";
import { share } from "../../utils/share";
import { createStatementShareableLink } from "../../utils/url";
import type { VoteEventType } from "../../utils/vote-result";
import type { VoteReveal } from "../../utils/vote-reveal";
import { VoteRevealCrowd } from "./VoteRevealCrowd";
import { VoteRevealHeadline } from "./VoteRevealHeadline";

const VOTE_RESULT_SNACKBAR_DURATION_MS = 2500;
const VOTE_EVENT_SNACKBAR_DURATION_MS = 5000;

interface ShareCopy {
  title: string;
  invitation: string;
  clickedEventName: string;
}

const VOTE_RESULT_SEEN_EVENT_NAME = "vote_result_seen";

const VOTE_RESULT_SHARE_COPY: ShareCopy = {
  title: "Come vote on this",
  invitation: "Where do you land on this?",
  clickedEventName: "vote_result_share_clicked",
};

const SEEN_EVENT_NAME_BY_VOTE_EVENT: Record<VoteEventType, string> = {
  first_vote: "first_vote_seen",
  swung_vote: "vote_swing_seen",
};

const SHARE_COPY_BY_VOTE_EVENT: Record<VoteEventType, ShareCopy> = {
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

const shareVoteReveal = async ({ statement, voteEvent }: VoteReveal) => {
  const shareCopy = voteEvent ? SHARE_COPY_BY_VOTE_EVENT[voteEvent.type] : VOTE_RESULT_SHARE_COPY;

  api.trackEvent(shareCopy.clickedEventName, statement.roomId);
  const link = createStatementShareableLink(statement);
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

interface VoteResultSnackbarProps {
  voteReveal: VoteReveal | null;
  onDismiss: () => void;
}

export function VoteResultSnackbar({ voteReveal, onDismiss }: VoteResultSnackbarProps) {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!voteReveal) return;

    const { statement, voteEvent } = voteReveal;
    api.trackEvent(voteEvent ? SEEN_EVENT_NAME_BY_VOTE_EVENT[voteEvent.type] : VOTE_RESULT_SEEN_EVENT_NAME, statement.roomId);

    const durationMs = voteEvent ? VOTE_EVENT_SNACKBAR_DURATION_MS : VOTE_RESULT_SNACKBAR_DURATION_MS;
    const dismissTimeoutId = setTimeout(() => onDismissRef.current(), durationMs);
    return () => clearTimeout(dismissTimeoutId);
  }, [voteReveal]);

  return createPortal(
    <AnimatePresence>
      {voteReveal && (
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
          <VoteRevealPanel
            key={voteReveal.statement.id}
            voteReveal={voteReveal}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function VoteRevealPanel({ voteReveal }: { voteReveal: VoteReveal }) {
  const { statement, voterVotes, currentVoterId, voteEvent } = voteReveal;

  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl px-4 pt-3 shadow-2xl normal-bg ${voteEvent ? "celebrate-outline" : ""}`}
    >
      <div className="flex min-h-7 items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-[13px] leading-snug secondary-text">
          “<RenderedStatement text={statement.text} />”
        </p>
        <VoteRevealShareButton voteReveal={voteReveal} />
      </div>
      <VoteRevealHeadline
        voterVotes={voterVotes}
        voteEvent={voteEvent}
      />
      <VoteRevealCrowd
        statementId={statement.id}
        voterVotes={voterVotes}
        currentVoterId={currentVoterId}
      />
    </div>
  );
}

function VoteRevealShareButton({ voteReveal }: { voteReveal: VoteReveal }) {
  const colorClasses = voteReveal.voteEvent ? "celebrate-bg dark-text" : "dark-bg normal-text";
  return (
    <button
      type="button"
      onClick={() => shareVoteReveal(voteReveal)}
      className={`flex min-h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-extrabold ${colorClasses}`}
    >
      <Share className="h-3.5 w-3.5" />
      Share
    </button>
  );
}
