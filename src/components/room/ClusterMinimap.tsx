import { useEffect, useRef, useState } from "react";
import { motion, useAnimate } from "motion/react";
import { getClusterDisplayName } from "../../utils/colors";
import {
  clusterAnchors,
  clusterRadius,
  LeaningStatus,
  centerOf,
  gravityPoints,
  leaningStatus,
  memberDotCount,
  memberDotOffsets,
  userDotPosition,
} from "../../utils/minimap-layout";

export interface MinimapCluster {
  stableId: string;
  slot: number;
  name: string | null;
  size: number;
}

interface ClusterMinimapProps {
  clusters: MinimapCluster[];
  clusterProbabilities: number[] | null;
}

const MAP_SIZE = 112;
const CARD_WIDTH = 148;
const MEMBER_DOT_SIZE = 3.5;
const USER_DOT_SIZE = 11;
const SLOT_COLORS = ["#a78bfa", "#2dd4bf", "#fbbf24", "#f472b6"];
const USER_DOT_COLOR = "#f97316";
const LEVEL_WORDS = {
  leaning: "Leaning",
  firmly: "Firmly",
  deeply: "Deeply",
};
const ENTER_GLOW_DELAY_S = 0.35;
const ENTER_GLOW_DURATION_S = 1;

function slotColor(slot: number): string {
  return SLOT_COLORS[slot % SLOT_COLORS.length];
}

function toUserDotOffset(position: { x: number; y: number }) {
  return {
    x: position.x * MAP_SIZE - USER_DOT_SIZE / 2,
    y: position.y * MAP_SIZE - USER_DOT_SIZE / 2,
  };
}

export function ClusterMinimap({
  clusters,
  clusterProbabilities,
}: ClusterMinimapProps) {
  const anchors = clusterAnchors(clusters.map((c) => c.slot));
  const largestSize = Math.max(...clusters.map((c) => c.size));
  const radii = clusters.map((cluster) =>
    clusterRadius(cluster.size, largestSize),
  );
  const gravity = gravityPoints(anchors, radii);
  const userDotFraction = clusterProbabilities
    ? userDotPosition(gravity, clusterProbabilities)
    : centerOf(anchors);
  const status = leaningStatus(
    clusterProbabilities ? userDotFraction : null,
    anchors,
    gravity,
    radii,
  );
  const leadingIndex =
    status.kind === "unplaced" || status.kind === "between"
      ? null
      : status.clusterIndex;
  const leadingStableId =
    leadingIndex === null ? null : clusters[leadingIndex].stableId;
  const userDot = toUserDotOffset(userDotFraction);
  const [memberDotSeed] = useState(() => Math.random().toString(36));

  const [userDotScope, animate] = useAnimate();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    const pulseThenMove = async () => {
      await animate(
        userDotScope.current,
        { scale: 1.6 },
        { duration: 0.15, ease: "easeOut" },
      );
      await animate(
        userDotScope.current,
        { x: userDot.x, y: userDot.y, scale: 1 },
        { type: "spring", stiffness: 170, damping: 18 },
      );
    };
    pulseThenMove();
  }, [clusterProbabilities]);

  const [enterGlow, setEnterGlow] = useState<{
    stableId: string;
    key: number;
  } | null>(null);
  const previousLeadingStableId = useRef(leadingStableId);

  useEffect(() => {
    if (
      leadingStableId &&
      leadingStableId !== previousLeadingStableId.current
    ) {
      setEnterGlow({ stableId: leadingStableId, key: Date.now() });
    }
    previousLeadingStableId.current = leadingStableId;
  }, [leadingStableId]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        backgroundColor: "#1c1a2b",
        width: CARD_WIDTH,
        height: MAP_SIZE,
        boxShadow:
          "0 6px 18px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div
        className="absolute top-0"
        style={{
          left: (CARD_WIDTH - MAP_SIZE) / 2,
          width: MAP_SIZE,
          height: MAP_SIZE,
        }}
      >
        {clusters.map((cluster, i) => {
          const radius = radii[i] * MAP_SIZE;
          const color = slotColor(cluster.slot);
          const isLeading = cluster.stableId === leadingStableId;
          return (
            <div
              key={cluster.stableId}
              className="absolute rounded-full transition-all duration-500"
              style={{
                left: anchors[i].x * MAP_SIZE - radius,
                top: anchors[i].y * MAP_SIZE - radius,
                width: radius * 2,
                height: radius * 2,
                border: `${isLeading ? 1.5 : 1}px solid ${color}${isLeading ? "" : "99"}`,
                backgroundColor: `${color}${isLeading ? "59" : "1f"}`,
              }}
            >
              {enterGlow?.stableId === cluster.stableId && (
                <motion.div
                  key={enterGlow.key}
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{ boxShadow: `0 0 12px 4px ${color}` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{
                    duration: ENTER_GLOW_DURATION_S,
                    delay: ENTER_GLOW_DELAY_S,
                    times: [0, 0.3, 1],
                  }}
                />
              )}
              {memberDotOffsets(
                `${memberDotSeed}-${cluster.stableId}`,
                memberDotCount(cluster.size, largestSize),
              ).map((offset, dotIndex) => (
                <div
                  key={dotIndex}
                  className="absolute rounded-full"
                  style={{
                    left:
                      radius * (1 + offset.x) - MEMBER_DOT_SIZE / 2,
                    top:
                      radius * (1 + offset.y) - MEMBER_DOT_SIZE / 2,
                    width: MEMBER_DOT_SIZE,
                    height: MEMBER_DOT_SIZE,
                    backgroundColor: color,
                  }}
                />
              ))}
            </div>
          );
        })}

        <motion.div
          ref={userDotScope}
          className="absolute left-0 top-0 z-20 rounded-full"
          initial={{ x: userDot.x, y: userDot.y }}
          style={{
            width: USER_DOT_SIZE,
            height: USER_DOT_SIZE,
            backgroundColor: USER_DOT_COLOR,
            border: "2px solid white",
            boxShadow: `0 0 0 4px ${USER_DOT_COLOR}55`,
          }}
        />
      </div>

      <MinimapLabel status={status} clusters={clusters} />
    </div>
  );
}

interface MinimapLabelProps {
  status: LeaningStatus;
  clusters: MinimapCluster[];
}

const LABEL_CLASS =
  "absolute bottom-1.5 left-2.5 right-2.5 z-10 truncate text-[10px] leading-tight";
const LABEL_STYLE = { textShadow: "0 1px 2px rgba(0, 0, 0, 0.7)" };

function MinimapLabel({ status, clusters }: MinimapLabelProps) {
  if (status.kind === "unplaced") {
    return (
      <p
        className={`${LABEL_CLASS} text-white/70`}
        style={LABEL_STYLE}
      >
        Where do you fit?
      </p>
    );
  }
  if (status.kind === "between") {
    return (
      <p
        className={`${LABEL_CLASS} text-white/70`}
        style={LABEL_STYLE}
      >
        Somewhere in between
      </p>
    );
  }

  const cluster = clusters[status.clusterIndex];
  return (
    <p className={`${LABEL_CLASS} text-white/90`} style={LABEL_STYLE}>
      {LEVEL_WORDS[status.kind]}{" "}
      <span
        className="font-semibold"
        style={{ color: slotColor(cluster.slot) }}
      >
        {getClusterDisplayName(cluster.slot, cluster.name)}
      </span>
    </p>
  );
}
