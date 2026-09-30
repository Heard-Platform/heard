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
  Point,
  userDotPosition,
} from "../../utils/minimap-layout";

export interface MinimapCluster {
  stableId: string;
  slot: number;
  name: string | null;
  size: number;
}

export type MinimapVariant = "mini" | "full";

interface ClusterMinimapProps {
  seed: string;
  clusters: MinimapCluster[];
  clusterProbabilities: number[] | null;
  variant?: MinimapVariant;
  layoutId?: string;
}

interface MinimapDimensions {
  mapSize: number;
  cardWidth: number;
  memberDotSize: number;
  userDotSize: number;
}

const DIMENSIONS: Record<MinimapVariant, MinimapDimensions> = {
  mini: { mapSize: 112, cardWidth: 148, memberDotSize: 3.5, userDotSize: 11 },
  full: { mapSize: 220, cardWidth: 290, memberDotSize: 6, userDotSize: 16 },
};
const SLOT_COLORS = ["#a78bfa", "#2dd4bf", "#fbbf24", "#f472b6"];
const SLOT_TEXT_COLORS_ON_LIGHT = ["#6D4BD8", "#0F8A7E", "#B7791F", "#DB2777"];
const USER_DOT_COLOR = "#f97316";
const LEVEL_WORDS = {
  leaning: "Leaning",
  firmly: "Firmly",
  deeply: "Deeply",
};
const ENTER_GLOW_DELAY_S = 0.35;
const ENTER_GLOW_DURATION_S = 1;
const CLUSTER_LABEL_HEIGHT = 14;
export const MIN_CLUSTERS = 2;

export function slotColor(slot: number): string {
  return SLOT_COLORS[slot % SLOT_COLORS.length];
}

export function slotTextColorOnLight(slot: number): string {
  return SLOT_TEXT_COLORS_ON_LIGHT[slot % SLOT_TEXT_COLORS_ON_LIGHT.length];
}

export function ClusterMinimap(props: ClusterMinimapProps) {
  if (props.clusters.length < MIN_CLUSTERS) {
    return <FormingMinimap variant={props.variant} layoutId={props.layoutId} />;
  }
  return <ClusterMap {...props} />;
}

function FormingMinimap({ variant = "mini", layoutId }: { variant?: MinimapVariant; layoutId?: string }) {
  const { mapSize, cardWidth } = DIMENSIONS[variant];
  return (
    <motion.div
      layoutId={layoutId}
      className="flex items-center justify-center rounded-2xl px-4 text-center"
      style={{
        backgroundColor: "#1c1a2b",
        width: cardWidth,
        height: mapSize,
        boxShadow:
          "0 6px 18px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.2)",
      }}
    >
      <p className="text-xs font-semibold text-white/70">Opinion groups forming…</p>
    </motion.div>
  );
}

function ClusterMap({
  seed,
  clusters,
  clusterProbabilities,
  variant = "mini",
  layoutId,
}: ClusterMinimapProps) {
  const dimensions = DIMENSIONS[variant];
  const { mapSize, cardWidth } = dimensions;
  const isFull = variant === "full";

  const largestSize = Math.max(...clusters.map((c) => c.size));
  const radii = clusters.map((cluster) =>
    clusterRadius(cluster.size, largestSize),
  );
  const anchors = clusterAnchors(
    seed,
    clusters.map((c) => c.slot),
    radii,
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
  const leadingStableId =
    status.kind === "unplaced" || status.kind === "between"
      ? null
      : clusters[status.clusterIndex].stableId;
  const enterGlow = useEnterGlow(leadingStableId);

  return (
    <motion.div
      layoutId={layoutId}
      className="relative overflow-hidden rounded-2xl"
      style={{
        backgroundColor: "#1c1a2b",
        width: cardWidth,
        height: mapSize,
        boxShadow:
          "0 6px 18px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.2)",
      }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
    >
      {isFull && <OpinionGroupsTitle />}

      <div
        className="absolute top-0"
        style={{
          left: (cardWidth - mapSize) / 2,
          width: mapSize,
          height: mapSize,
        }}
      >
        {clusters.map((cluster, i) => (
          <ClusterCircle
            key={cluster.stableId}
            center={anchors[i]}
            radius={radii[i] * mapSize}
            color={slotColor(cluster.slot)}
            isLeading={cluster.stableId === leadingStableId}
            glowKey={
              enterGlow?.stableId === cluster.stableId ? enterGlow.key : null
            }
            memberDotOffsets={memberDotOffsets(
              `${seed}-${cluster.stableId}`,
              memberDotCount(cluster.size, largestSize),
            )}
            dimensions={dimensions}
          />
        ))}

        {isFull &&
          clusters.map((cluster, i) => (
            <ClusterNameLabel
              key={cluster.stableId}
              cluster={cluster}
              center={anchors[i]}
              radius={radii[i] * mapSize}
              mapSize={mapSize}
            />
          ))}

        <UserDot
          position={userDotFraction}
          clusterProbabilities={clusterProbabilities}
          dimensions={dimensions}
          showYouTag={isFull}
        />
      </div>

      {!isFull && <MinimapLabel status={status} clusters={clusters} />}
    </motion.div>
  );
}

function useEnterGlow(leadingStableId: string | null) {
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

  return enterGlow;
}

function OpinionGroupsTitle() {
  return (
    <p className="absolute left-3 top-2.5 z-10 text-[11px] font-bold uppercase tracking-wider text-white/60">
      Opinion groups
    </p>
  );
}

interface ClusterCircleProps {
  center: Point;
  radius: number;
  color: string;
  isLeading: boolean;
  glowKey: number | null;
  memberDotOffsets: Point[];
  dimensions: MinimapDimensions;
}

function ClusterCircle({
  center,
  radius,
  color,
  isLeading,
  glowKey,
  memberDotOffsets,
  dimensions,
}: ClusterCircleProps) {
  return (
    <div
      className="absolute rounded-full transition-all duration-500"
      style={{
        left: center.x * dimensions.mapSize - radius,
        top: center.y * dimensions.mapSize - radius,
        width: radius * 2,
        height: radius * 2,
        border: `${isLeading ? 1.5 : 1}px solid ${color}${isLeading ? "" : "99"}`,
        backgroundColor: `${color}${isLeading ? "59" : "1f"}`,
      }}
    >
      {glowKey !== null && <EnterGlow key={glowKey} color={color} />}
      {memberDotOffsets.map((offset, i) => (
        <MemberDot
          key={i}
          offset={offset}
          radius={radius}
          color={color}
          size={dimensions.memberDotSize}
        />
      ))}
    </div>
  );
}

function EnterGlow({ color }: { color: string }) {
  return (
    <motion.div
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
  );
}

interface MemberDotProps {
  offset: Point;
  radius: number;
  color: string;
  size: number;
}

function MemberDot({ offset, radius, color, size }: MemberDotProps) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        left: radius * (1 + offset.x) - size / 2,
        top: radius * (1 + offset.y) - size / 2,
        width: size,
        height: size,
        backgroundColor: color,
      }}
    />
  );
}

interface ClusterNameLabelProps {
  cluster: MinimapCluster;
  center: Point;
  radius: number;
  mapSize: number;
}

function ClusterNameLabel({ cluster, center, radius, mapSize }: ClusterNameLabelProps) {
  const top = Math.min(center.y * mapSize + radius + 2, mapSize - CLUSTER_LABEL_HEIGHT);
  return (
    <p
      className="absolute z-10 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold"
      style={{
        left: center.x * mapSize,
        top,
        color: slotColor(cluster.slot),
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.7)",
      }}
    >
      {getClusterDisplayName(cluster.slot, cluster.name)}
    </p>
  );
}

interface UserDotProps {
  position: Point;
  clusterProbabilities: number[] | null;
  dimensions: MinimapDimensions;
  showYouTag: boolean;
}

function UserDot({ position, clusterProbabilities, dimensions, showYouTag }: UserDotProps) {
  const { mapSize, userDotSize } = dimensions;
  const offset = {
    x: position.x * mapSize - userDotSize / 2,
    y: position.y * mapSize - userDotSize / 2,
  };
  const [scope, animate] = useAnimate();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    const pulseThenMove = async () => {
      await animate(
        scope.current,
        { scale: 1.6 },
        { duration: 0.15, ease: "easeOut" },
      );
      await animate(
        scope.current,
        { x: offset.x, y: offset.y, scale: 1 },
        { type: "spring", stiffness: 170, damping: 18 },
      );
    };
    pulseThenMove();
  }, [clusterProbabilities]);

  return (
    <motion.div
      ref={scope}
      className="absolute left-0 top-0 z-20 rounded-full"
      initial={{ x: offset.x, y: offset.y }}
      style={{
        width: userDotSize,
        height: userDotSize,
        backgroundColor: USER_DOT_COLOR,
        border: "2px solid white",
        boxShadow: `0 0 0 4px ${USER_DOT_COLOR}55`,
      }}
    >
      {showYouTag && <YouTag />}
    </motion.div>
  );
}

function YouTag() {
  return (
    <span
      className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
      style={{ backgroundColor: USER_DOT_COLOR }}
    >
      You
    </span>
  );
}

interface MinimapLabelProps {
  status: LeaningStatus;
  clusters: MinimapCluster[];
}

function MinimapLabel({ status, clusters }: MinimapLabelProps) {
  const isPlaced = status.kind !== "unplaced" && status.kind !== "between";
  return (
    <p
      className={`absolute bottom-1.5 left-2.5 right-2.5 z-10 truncate text-[10px] leading-tight ${isPlaced ? "text-white/90" : "text-white/70"}`}
      style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.7)" }}
    >
      <MinimapLabelText status={status} clusters={clusters} />
    </p>
  );
}

function MinimapLabelText({ status, clusters }: MinimapLabelProps) {
  if (status.kind === "unplaced") return <>Where do you fit?</>;
  if (status.kind === "between") return <>Somewhere in between</>;

  const cluster = clusters[status.clusterIndex];
  return (
    <>
      {LEVEL_WORDS[status.kind]}{" "}
      <span
        className="font-semibold"
        style={{ color: slotColor(cluster.slot) }}
      >
        {getClusterDisplayName(cluster.slot, cluster.name)}
      </span>
    </>
  );
}
