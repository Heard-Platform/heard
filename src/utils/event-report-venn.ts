import type {
  EventReportCamp,
  EventReportStatementByCamp,
} from "../types";

export const VENN_WIDTH_PX = 540;
export const VENN_HEIGHT_PX = 470;
export const VENN_CIRCLE_DIAMETER_PX = 300;
export const CAMP_AGREEMENT_THRESHOLD_PERCENT = 60;
export const NO_CAMP_REGION_KEY = "none";

const SMALLEST_DOT_PX = 9;
const LARGEST_DOT_PX = 22;
const SMALLEST_DOT_AGREE_PERCENT = 30;
const LARGEST_DOT_AGREE_PERCENT = 90;
const RING_SPACING_SCALE = 0.8;

export interface VennPoint {
  x: number;
  y: number;
}

export interface VennDot {
  statement: EventReportStatementByCamp;
  regionKey: string;
  x: number;
  y: number;
}

const CIRCLE_CENTERS_BY_CAMP_COUNT: Record<number, VennPoint[]> = {
  2: [
    { x: 200, y: 200 },
    { x: 340, y: 200 },
  ],
  3: [
    { x: 200, y: 170 },
    { x: 340, y: 170 },
    { x: 270, y: 290 },
  ],
};

const REGION_CENTERS_BY_CAMP_COUNT: Record<
  number,
  Record<string, VennPoint>
> = {
  2: {
    "0": { x: 110, y: 200 },
    "1": { x: 430, y: 200 },
    "0-1": { x: 270, y: 200 },
    [NO_CAMP_REGION_KEY]: { x: 60, y: 420 },
  },
  3: {
    "0": { x: 120, y: 130 },
    "1": { x: 420, y: 130 },
    "2": { x: 270, y: 385 },
    "0-1": { x: 270, y: 100 },
    "0-2": { x: 175, y: 265 },
    "1-2": { x: 365, y: 265 },
    "0-1-2": { x: 270, y: 215 },
    [NO_CAMP_REGION_KEY]: { x: 60, y: 420 },
  },
};

const CAMP_LABEL_POSITIONS_BY_CAMP_COUNT: Record<
  number,
  VennPoint[]
> = {
  2: [
    { x: 40, y: 30 },
    { x: 400, y: 30 },
  ],
  3: [
    { x: 30, y: -4 },
    { x: 380, y: -4 },
    { x: 330, y: 446 },
  ],
};

const DOT_OFFSETS: VennPoint[] = [
  { x: 0, y: 0 },
  { x: 24, y: 14 },
  { x: -24, y: 12 },
  { x: 10, y: -24 },
  { x: -16, y: -22 },
  { x: 30, y: -6 },
  { x: -32, y: -4 },
  { x: 0, y: 28 },
];

export function getVennCircleCenters(campCount: number): VennPoint[] {
  return CIRCLE_CENTERS_BY_CAMP_COUNT[campCount] ?? [];
}

export function getVennCampLabelPositions(
  campCount: number,
): VennPoint[] {
  return CAMP_LABEL_POSITIONS_BY_CAMP_COUNT[campCount] ?? [];
}

export function getCampAgreePercent(
  statement: EventReportStatementByCamp,
  campId: string,
): number {
  const campAgreement = statement.campAgreements.find(
    (agreement) => agreement.campId === campId,
  );
  return campAgreement?.agreePercent ?? 0;
}

export function getVennRegionKey(
  statement: EventReportStatementByCamp,
  campIds: string[],
): string {
  const agreeingCampIndexes = campIds
    .map((campId, campIndex) => ({ campId, campIndex }))
    .filter(
      ({ campId }) =>
        getCampAgreePercent(statement, campId) >=
        CAMP_AGREEMENT_THRESHOLD_PERCENT,
    )
    .map(({ campIndex }) => campIndex);
  if (agreeingCampIndexes.length === 0) return NO_CAMP_REGION_KEY;
  return agreeingCampIndexes.join("-");
}

function getDotOffset(indexInRegion: number): VennPoint {
  if (indexInRegion < DOT_OFFSETS.length) {
    return DOT_OFFSETS[indexInRegion];
  }
  const offsetsAroundCenter = DOT_OFFSETS.slice(1);
  const indexAroundCenter = indexInRegion - DOT_OFFSETS.length;
  const ring =
    Math.floor(indexAroundCenter / offsetsAroundCenter.length) + 1;
  const baseOffset =
    offsetsAroundCenter[
      indexAroundCenter % offsetsAroundCenter.length
    ];
  const ringScale = 1 + ring * RING_SPACING_SCALE;
  return { x: baseOffset.x * ringScale, y: baseOffset.y * ringScale };
}

export function placeVennDots(
  statements: EventReportStatementByCamp[],
  campIds: string[],
): VennDot[] {
  const regionCenters = REGION_CENTERS_BY_CAMP_COUNT[campIds.length];
  if (!regionCenters) return [];
  const dotCountByRegionKey: Record<string, number> = {};
  return statements.map((statement) => {
    const regionKey = getVennRegionKey(statement, campIds);
    const indexInRegion = dotCountByRegionKey[regionKey] ?? 0;
    dotCountByRegionKey[regionKey] = indexInRegion + 1;
    const regionCenter = regionCenters[regionKey];
    const offset = getDotOffset(indexInRegion);
    return {
      statement,
      regionKey,
      x: regionCenter.x + offset.x,
      y: regionCenter.y + offset.y,
    };
  });
}

export function getVennDotSizePx(
  overallAgreePercent: number,
): number {
  const agreeRange =
    LARGEST_DOT_AGREE_PERCENT - SMALLEST_DOT_AGREE_PERCENT;
  const agreeShare =
    (overallAgreePercent - SMALLEST_DOT_AGREE_PERCENT) / agreeRange;
  const unclampedSize =
    SMALLEST_DOT_PX + agreeShare * (LARGEST_DOT_PX - SMALLEST_DOT_PX);
  return Math.round(
    Math.min(
      LARGEST_DOT_PX,
      Math.max(SMALLEST_DOT_PX, unclampedSize),
    ),
  );
}

export function describeVennRegion(
  regionKey: string,
  camps: EventReportCamp[],
): string {
  if (regionKey === NO_CAMP_REGION_KEY) return "No camp agreed";
  const agreeingCamps = regionKey
    .split("-")
    .map((campIndex) => camps[Number(campIndex)]);
  if (agreeingCamps.length === camps.length) {
    return camps.length === 2
      ? "Both camps agreed"
      : `All ${camps.length} camps agreed`;
  }
  if (agreeingCamps.length === 1) {
    return `Only ${agreeingCamps[0].name} agreed`;
  }
  const campNames = agreeingCamps.map((camp) => camp.name);
  return `${campNames.join(" and ")} agreed`;
}