import { memo, useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../../ui/button";
import {
  CHART_HEIGHT_PX,
  CHART_MARGIN,
  DISMISSED_COLOR,
  GRID_COLOR,
  LINE_COLOR,
  NEAR_MISS_COLOR,
  SELECTED_COLOR,
  SIGNAL_COLOR,
  TOOLTIP_PROPS,
} from "./chart-theme";
import { downsampleByPeakMagnitude, samplesInWindow } from "./downsample";
import { formatClockTime } from "./format";
import { chartPointerTime, type ChartPointerState } from "./chart-pointer";
import { useDragSelect } from "./use-drag-select";
import type { TimeWindow } from "./time-window";
import type { AccelerometerSample, FlyerPlacement, TapCluster } from "./sensor-types";

interface RecordingTimelineChartProps {
  samples: AccelerometerSample[];
  clusters: TapCluster[];
  dismissedClusters: TapCluster[];
  placements: FlyerPlacement[];
  selectedPlacement: FlyerPlacement | undefined;
  zoomWindow: TimeWindow | null;
  onZoomChange: (window: TimeWindow | null) => void;
  onHoverTimeChange: (timeMs: number | null) => void;
}

const MAX_POINTS = 1500;

export const RecordingTimelineChart = memo(function RecordingTimelineChart({
  samples,
  clusters,
  dismissedClusters,
  placements,
  selectedPlacement,
  zoomWindow,
  onZoomChange,
  onHoverTimeChange,
}: RecordingTimelineChartProps) {
  const { selection, chartHandlers } = useDragSelect(onZoomChange);

  const pointerHandlers = {
    ...chartHandlers,
    onMouseMove: (state: ChartPointerState | null) => {
      chartHandlers.onMouseMove(state);
      onHoverTimeChange(chartPointerTime(state));
    },
    onMouseLeave: () => {
      chartHandlers.onMouseLeave();
      onHoverTimeChange(null);
    },
  };

  const points = useMemo(() => {
    const visible = zoomWindow ? samplesInWindow(samples, zoomWindow.startMs, zoomWindow.endMs) : samples;
    return downsampleByPeakMagnitude(visible, MAX_POINTS);
  }, [samples, zoomWindow]);

  const clusterColor = (cluster: TapCluster) => {
    if (cluster === selectedPlacement?.cluster) return SELECTED_COLOR;
    if (dismissedClusters.includes(cluster)) return DISMISSED_COLOR;
    return cluster.isSignal ? SIGNAL_COLOR : NEAR_MISS_COLOR;
  };

  return (
    <div>
      <div className="heard-between mb-2 min-h-8">
        <h3 className="text-sm font-medium text-slate-700">
          {zoomWindow
            ? `Acceleration magnitude (${formatClockTime(zoomWindow.startMs)} – ${formatClockTime(zoomWindow.endMs)})`
            : "Acceleration magnitude (full recording)"}
        </h3>
        {zoomWindow && (
          <Button variant="outline" size="sm" onClick={() => onZoomChange(null)}>
            Reset zoom
          </Button>
        )}
      </div>
      <div className="select-none cursor-crosshair">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
          <LineChart data={points} margin={CHART_MARGIN} {...pointerHandlers}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="timeMs"
              type="number"
              domain={zoomWindow ? [zoomWindow.startMs, zoomWindow.endMs] : ["dataMin", "dataMax"]}
              allowDataOverflow
              tickFormatter={formatClockTime}
              tick={{ fontSize: 11 }}
            />
            <YAxis tick={{ fontSize: 11 }} width={40} />
            <Tooltip {...TOOLTIP_PROPS} />
            {clusters
              .filter((cluster) => !cluster.isSignal)
              .map((cluster) => (
                <ReferenceLine key={cluster.startMs} x={cluster.startMs} stroke={NEAR_MISS_COLOR} strokeDasharray="2 2" />
              ))}
            {dismissedClusters.map((cluster) => (
              <ReferenceLine
                key={cluster.startMs}
                x={cluster.startMs}
                stroke={DISMISSED_COLOR}
                strokeDasharray="2 2"
                label={{ value: "✕", position: "top", fontSize: 11, fill: DISMISSED_COLOR }}
              />
            ))}
            {placements.map(({ id, cluster, flyerGroup }) =>
              cluster ? (
                <ReferenceLine
                  key={id}
                  x={cluster.startMs}
                  stroke={clusterColor(cluster)}
                  strokeWidth={cluster === selectedPlacement?.cluster ? 2 : 1}
                  label={{ value: `#${flyerGroup}`, position: "top", fontSize: 11 }}
                />
              ) : null,
            )}
            <Line dataKey="magnitude" stroke={LINE_COLOR} strokeWidth={1} dot={false} isAnimationActive={false} />
            {zoomWindow &&
              clusters.flatMap((cluster) =>
                cluster.peaks.map((peak) => (
                  <ReferenceDot
                    key={peak.timeMs}
                    x={peak.timeMs}
                    y={peak.magnitude}
                    r={4}
                    fill={clusterColor(cluster)}
                    stroke="#ffffff"
                  />
                )),
              )}
            {selection && (
              <ReferenceArea x1={selection.startMs} x2={selection.endMs} fill={SELECTED_COLOR} fillOpacity={0.1} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-500 mt-1">
        Drag across the chart to zoom in, or select a flyer to zoom to its taps. Green lines are detected flyers. Grey dashed lines are near misses: bursts with more taps than a flyer signal. Red dashed lines are detected flyers you marked as not a flyer.
      </p>
    </div>
  );
});
