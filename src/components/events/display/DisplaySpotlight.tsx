import { motion } from "motion/react";
import type { Statement } from "../../../types";
import { getVoteShares } from "../../../utils/event-display";
import { DisplayEyebrow } from "./DisplayParts";

interface DisplaySpotlightProps {
  statement: Statement;
  eyebrow: string;
  onClose: () => void;
}

export function DisplaySpotlight({ statement, eyebrow, onClose }: DisplaySpotlightProps) {
  const voteShares = getVoteShares(statement);
  const voteCountLabel = `${voteShares.total} ${voteShares.total === 1 ? "vote" : "votes"}`;

  return (
    <motion.button
      type="button"
      onClick={onClose}
      aria-label="Back to the board"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="display-screen-bg absolute inset-0 grid cursor-pointer content-center gap-[2.4cqw] px-[7cqw] py-[5cqw] text-left"
    >
      <DisplayEyebrow>
        {eyebrow} · {voteCountLabel}
      </DisplayEyebrow>
      <p className="text-[4.6cqw] font-extrabold leading-[1.1] tracking-tight text-balance">{statement.text}</p>
      <div className="flex h-[5.4cqw] gap-[0.25cqw] overflow-hidden rounded-[1cqw]">
        <SpotlightVoteShare
          className="agree-tint-bg shadow-[inset_0.5cqw_0_0_var(--color-green-500)]"
          sharePercent={voteShares.agree}
          label="agree"
        />
        <SpotlightVoteShare className="pass-tint-bg" sharePercent={voteShares.pass} />
        <SpotlightVoteShare
          className="disagree-tint-bg shadow-[inset_-0.5cqw_0_0_var(--color-red-500)]"
          sharePercent={voteShares.disagree}
          label="disagree"
        />
      </div>
    </motion.button>
  );
}

interface SpotlightVoteShareProps {
  className: string;
  sharePercent: number;
  label?: string;
}

function SpotlightVoteShare({ className, sharePercent, label }: SpotlightVoteShareProps) {
  if (sharePercent === 0) return null;
  return (
    <span
      className={`grid min-w-0 place-items-center overflow-hidden whitespace-nowrap text-[2.2cqw] font-extrabold transition-[width] duration-700 ${className}`}
      style={{ width: `${sharePercent}%` }}
    >
      {label && `${Math.round(sharePercent)}% ${label}`}
    </span>
  );
}
