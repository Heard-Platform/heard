import { formatClockTime } from "./format";

export const CHART_HEIGHT_PX = 220;
export const CHART_MARGIN = { top: 16, right: 16, bottom: 0, left: 0 };
export const LINE_COLOR = "#334155";
export const GRID_COLOR = "#e2e8f0";
export const SIGNAL_COLOR = "#16a34a";
export const SELECTED_COLOR = "#2563eb";
export const NEAR_MISS_COLOR = "#94a3b8";
export const THRESHOLD_COLOR = "#dc2626";

export const TOOLTIP_PROPS = {
  labelFormatter: (timeMs: number) => formatClockTime(timeMs),
  formatter: (value: number) => [`${value.toFixed(1)} m/s²`, "|a|"],
};
