import { motion } from "motion/react";
import type { SimpleVoteType } from "../../types";
import { getCrowdVerdict, type VoteEvent } from "../../utils/vote-result";
import { countVoterVotes, type VoterVote } from "../../utils/vote-reveal";

const HEADLINE_DELAY_SECONDS = 0.1;
const HEADLINE_FADE_SECONDS = 0.2;

const SIDE_COLUMN_CLASSES: Record<SimpleVoteType, string> = {
  disagree: "col-start-1",
  pass: "col-start-2",
  agree: "col-start-3",
};

interface VoteRevealHeadlineProps {
  voterVotes: VoterVote[];
  voteEvent: VoteEvent | null;
}

export function VoteRevealHeadline({ voterVotes, voteEvent }: VoteRevealHeadlineProps) {
  return (
    <motion.div
      className="grid w-full grid-cols-3"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: HEADLINE_DELAY_SECONDS, duration: HEADLINE_FADE_SECONDS }}
    >
      {voteEvent ? <VoteEventHeadline voteEvent={voteEvent} /> : <VerdictHeadline voterVotes={voterVotes} />}
    </motion.div>
  );
}

function VoteEventHeadline({ voteEvent }: { voteEvent: VoteEvent }) {
  return (
    <p className="col-span-3 text-center text-sm font-extrabold whitespace-nowrap celebrate-strip-text">
      {voteEvent.headline}
    </p>
  );
}

function VerdictHeadline({ voterVotes }: { voterVotes: VoterVote[] }) {
  const { headline, leadingSide } = getCrowdVerdict(countVoterVotes(voterVotes));
  const placementClass = leadingSide ? SIDE_COLUMN_CLASSES[leadingSide] : "col-span-3";
  const colorClass = leadingSide ? `${leadingSide}-text` : "secondary-text-strong";
  return (
    <p className={`text-center text-sm font-bold whitespace-nowrap ${placementClass} ${colorClass}`}>{headline}</p>
  );
}
