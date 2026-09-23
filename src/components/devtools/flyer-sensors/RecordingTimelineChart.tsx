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
  GRID_COLOR,
  LINE_COLOR,
  NEAR_MISS_COLOR,
  SELECTED_COLOR,
  SIGNAL_COLOR,
  THRESHOLD_COLOR,
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
  placements: FlyerPlacement[];
  threshold: number;
  selectedPlacement: FlyerPlacement | undefined;
  zoomWindow: TimeWindow | null;
  onZoomChange: (window: TimeWindow | null) => void;
  onHoverTimeChange: (timeMs: number | null) => void;
}

const MAX_POINTS = 1500;

export const RecordingTimelineChart = memo(function RecordingTimelineChart({
  samples,
  clusters,
  placements,
  threshold,
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
            <ReferenceLine y={threshold} stroke={THRESHOLD_COLOR} strokeDasharray="4 4" />
            {clusters
              .filter((cluster) => !cluster.isSignal)
              .map((cluster) => (
                <ReferenceLine key={cluster.startMs} x={cluster.startMs} stroke={NEAR_MISS_COLOR} strokeDasharray="2 2" />
              ))}
            {placements.map((placement) => (
              <ReferenceLine
                key={placement.number}
                x={placement.cluster.startMs}
                stroke={clusterColor(placement.cluster)}
                strokeWidth={placement === selectedPlacement ? 2 : 1}
                label={{ value: `#${placement.number}`, position: "top", fontSize: 11 }}
              />
            ))}
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
        Drag across the chart to zoom in, or select a flyer to zoom to its taps. Green lines are detected flyers, grey dashed lines are spike clusters with the wrong tap count, and the red dashed line is the tap threshold.
      </p>
    </div>
  );
});
