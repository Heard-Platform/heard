import { divIcon } from "leaflet";
import { EMPTY_RING_THICKNESS_PX, voteShares, type FlyerVoteTally } from "./flyer-votes";

const AGREE_COLOR = "#16a34a";
const DISAGREE_COLOR = "#dc2626";
const EMPTY_COLOR = "#94a3b8";
const RING_GAP_PX = 3;

function arcCircle(radius: number, center: number, thickness: number, color: string, fraction: number, offsetFraction: number) {
  const circumference = 2 * Math.PI * radius;
  return `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${color}" stroke-width="${thickness}" stroke-dasharray="${circumference * fraction} ${circumference}" stroke-dashoffset="${-circumference * offsetFraction}" transform="rotate(-90 ${center} ${center})" />`;
}

export function voteRingIcon(tally: FlyerVoteTally, pinRadiusPx: number, thicknessPx: number) {
  const radius = pinRadiusPx + RING_GAP_PX + thicknessPx / 2;
  const size = Math.ceil(2 * (radius + thicknessPx / 2) + 2);
  const center = size / 2;
  const { total, agreeFraction, disagreeFraction } = voteShares(tally);

  const rings =
    total === 0
      ? `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${EMPTY_COLOR}" stroke-width="${EMPTY_RING_THICKNESS_PX}" stroke-dasharray="3 3" />`
      : arcCircle(radius, center, thicknessPx, AGREE_COLOR, agreeFraction, 0) +
        arcCircle(radius, center, thicknessPx, DISAGREE_COLOR, disagreeFraction, agreeFraction);

  return divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [center, center],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="pointer-events:none;">${rings}</svg>`,
  });
}
