import type { MotionValue } from "motion/react";
import { motion } from "motion/react";
import { ExternalLink, X, Check } from "lucide-react";

interface CommitCardProps {
  action: string;
  learnMoreUrl?: string;
  isTopCard: boolean;
  ignoreOpacity: MotionValue<number>;
  commitOpacity: MotionValue<number>;
}

export function CommitCard({
  action,
  learnMoreUrl,
  isTopCard,
  ignoreOpacity,
  commitOpacity,
}: CommitCardProps) {
  return (
    <>
      <div className="absolute inset-0 bg-slate-300 pointer-events-none" />

      <div className="relative">
        <div className="heard-between mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 normal-text text-xs font-medium shadow-sm">
            Proposed action
          </span>
        </div>

        <div className="flex flex-col gap-3 min-h-[180px] justify-center">
          <p className="text-base italic text-slate-600">I commit to</p>
          <p className="text-2xl leading-snug font-semibold text-slate-900">
            {action}
          </p>
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800 underline underline-offset-2 w-fit"
            >
              Learn more
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-400/50 flex items-center justify-between text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" />
            Swipe left to ignore
          </span>
          <span className="inline-flex items-center gap-1.5">
            Swipe right to commit
            <Check className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {isTopCard && (
        <>
          <motion.div
            className="absolute top-6 left-6 px-3 py-1.5 rounded-lg disagree-bg-soft normal-text text-sm font-bold uppercase tracking-wide -rotate-15 shadow-lg pointer-events-none flex items-center gap-1"
            style={{ opacity: ignoreOpacity }}
          >
            <X className="w-4 h-4" />
            Ignore
          </motion.div>
          <motion.div
            className="absolute top-6 right-6 px-3 py-1.5 rounded-lg positive-bg normal-text text-sm font-bold uppercase tracking-wide rotate-15 shadow-lg pointer-events-none flex items-center gap-1"
            style={{ opacity: commitOpacity }}
          >
            <Check className="w-4 h-4" />
            Commit
          </motion.div>
        </>
      )}
    </>
  );
}
