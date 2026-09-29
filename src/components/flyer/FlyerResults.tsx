import { motion } from "motion/react";
import { Star } from "lucide-react";
import type { Statement } from "../../types";
import { getClusterDisplayName } from "../../utils/colors";
import type { TribeSummary } from "../../utils/tribe-summary";
import { ClusterMinimap, slotTextColorOnLight, type MinimapCluster } from "../room/ClusterMinimap";

export const FLYER_MINIMAP_LAYOUT_ID = "flyer-minimap";
const REVEAL_DELAY_S = 0.5;

interface FlyerResultsProps {
  clusters: MinimapCluster[];
  clusterProbabilities: number[] | null;
  summary: TribeSummary;
  statements: Statement[];
  onSaveSpot: () => void;
  onJustLooking: () => void;
}

export function FlyerResults({
  clusters,
  clusterProbabilities,
  summary,
  statements,
  onSaveSpot,
  onJustLooking,
}: FlyerResultsProps) {
  const tribe = clusters[summary.clusterIndex];
  const crossoverStatement = summary.crossover
    ? statements.find((s) => s.id === summary.crossover!.statementId)
    : undefined;
  const crossoverCluster = summary.crossover ? clusters[summary.crossover.clusterIndex] : undefined;

  return (
    <div className="flex flex-col items-center">
      <ClusterMinimap
        clusters={clusters}
        clusterProbabilities={clusterProbabilities}
        variant="full"
        layoutId={FLYER_MINIMAP_LAYOUT_ID}
      />

      <motion.div
        className="mt-4 flex w-full flex-col gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: REVEAL_DELAY_S, ease: "easeOut" }}
      >
        <BadgeUnlocked />

        <div>
          <h2
            className="text-4xl font-extrabold leading-tight tracking-tight"
            style={{ color: slotTextColorOnLight(tribe.slot) }}
          >
            {getClusterDisplayName(tribe.slot, tribe.name)}
          </h2>
          <p className="mt-1 text-base text-[#4A463F]">
            In this conversation you vibed with them on{" "}
            <strong className="text-[#1C1B1F]">
              {summary.sidedWithCount} of {summary.votedCount}
            </strong>{" "}
            statements.
          </p>
        </div>

        {crossoverStatement && crossoverCluster && (
          <CrossoverCard statement={crossoverStatement} cluster={crossoverCluster} />
        )}

        <button
          className="mt-1 w-full rounded-2xl px-4 py-3 text-center"
          style={{ backgroundColor: "#1c1a2b" }}
          onClick={onSaveSpot}
        >
          <span className="block text-lg font-extrabold text-white">Save my spot</span>
          <span className="block text-xs text-white/70">Your dot keeps moving as more people weigh in</span>
        </button>
        <button className="text-sm font-semibold text-[#4A463F]" onClick={onJustLooking}>
          Just looking around
        </button>
      </motion.div>
    </div>
  );
}

function BadgeUnlocked() {
  return (
    <span
      className="flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-white"
      style={{ backgroundColor: "#1c1a2b" }}
    >
      <Star className="h-3.5 w-3.5 text-[#fbbf24]" />
      Badge unlocked: First Six
    </span>
  );
}

interface CrossoverCardProps {
  statement: Statement;
  cluster: MinimapCluster;
}

function CrossoverCard({ statement, cluster }: CrossoverCardProps) {
  return (
    <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 6px 18px rgba(28, 27, 31, 0.08)" }}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A857C]">Where you cross over</p>
      <p className="mt-1 text-base font-bold leading-snug text-[#1C1B1F]">{statement.text}</p>
      <p className="mt-1 text-sm text-[#6B6760]">
        On this one you're with{" "}
        <span className="font-bold" style={{ color: slotTextColorOnLight(cluster.slot) }}>
          {getClusterDisplayName(cluster.slot, cluster.name)}
        </span>
        .
      </p>
    </div>
  );
}
