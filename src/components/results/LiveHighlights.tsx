import { motion } from "motion/react";
import { RenderedStatement } from "../RenderedStatement";
import type { Statement } from "../../types";
import { isDefined } from "../../utils/array";
import { getAllAgrees, getDecisiveVotes } from "../../utils/statement";
import { getLiveHighlights } from "./utils";

export type LiveHighlightKind = "topAgreed" | "topDisagreed" | "mostSplit";

export interface LiveHighlight {
  kind: LiveHighlightKind;
  statement: Statement;
  label: string;
  icon: string;
}

export function buildLiveHighlights(statements: Statement[]): LiveHighlight[] {
  const { topAgreed, topDisagreed, mostSplit } = getLiveHighlights(statements);

  return [
    topAgreed && { kind: "topAgreed" as const, statement: topAgreed, label: "Top Agreed", icon: "🏆" },
    topDisagreed && {
      kind: "topDisagreed" as const,
      statement: topDisagreed,
      label: "Top Disagreed",
      icon: "👎",
    },
    mostSplit && { kind: "mostSplit" as const, statement: mostSplit, label: "Most Split", icon: "⚖️" },
  ].filter(isDefined);
}

function TugBar({
  side,
  percentage,
}: {
  side: "agree" | "disagree";
  percentage: number;
}) {
  const isAgree = side === "agree";
  return (
    <motion.div
      className={
        isAgree
          ? "absolute left-0 top-0 h-full bg-gradient-to-r agree-gradient-from agree-gradient-to"
          : "absolute right-0 top-0 h-full bg-gradient-to-l disagree-gradient-from disagree-gradient-to"
      }
      initial={{ width: 0 }}
      animate={{ width: `${percentage}%` }}
      transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
    />
  );
}

interface LiveHighlightsProps {
  highlights: LiveHighlight[];
}

export function LiveHighlights({ highlights }: LiveHighlightsProps) {
  return (
    <div className="space-y-3 md:space-y-4">
      {highlights.map(({ statement: s, label, icon }, index) => {
        const agrees = getAllAgrees(s);
        const disagrees = s.disagrees;
        const decisive = getDecisiveVotes(s);
        const agreePct = (agrees / decisive) * 100;
        const disagreePct = 100 - agreePct;

        return (
          <motion.div
            key={s.id}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-1.5"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-semibold text-orange-700">
                {icon} {label}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] sm:text-xs truncate min-w-0 flex-1">
                <RenderedStatement text={s.text} />
              </p>
              <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                {decisive} vote{decisive === 1 ? "" : "s"}
              </span>
            </div>

            <div className="relative h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden">
              <TugBar side="agree" percentage={agreePct} />
              <TugBar side="disagree" percentage={disagreePct} />
              <div className="absolute left-1/2 top-0 h-full w-px bg-white/80 -translate-x-1/2 z-10" />
            </div>

            <div className="flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-emerald-700 font-medium">
                ✅ {agrees} agree{agrees === 1 ? "" : "s"}
              </span>
              <span className="text-rose-700 font-medium">
                {disagrees} disagree{disagrees === 1 ? "" : "s"} ❌
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
