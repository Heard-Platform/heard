import { useRef, useState } from "react";
import { ZoomOut } from "lucide-react";
import { UserTimelineEvent } from "../../types";
import { getLaneForEntry, TIMELINE_LANES } from "./user-timeline-lanes";

interface UserTimelineChartProps {
  timeline: UserTimelineEvent[];
}

interface TimeRange {
  start: number;
  end: number;
}

interface DragSelection {
  fromPercent: number;
  toPercent: number;
}

const TICK_COUNT = 5;
const ONE_HOUR = 60 * 60 * 1000;
const TWO_DAYS = 48 * ONE_HOUR;
// Drags narrower than this are treated as clicks, not zooms
const MIN_ZOOM_DRAG_PERCENT = 1;

const formatTick = (timestamp: number, spanMs: number) => {
  if (spanMs < ONE_HOUR) {
    return new Date(timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" });
  }
  if (spanMs < TWO_DAYS) {
    return new Date(timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const clampPercent = (percent: number) => Math.min(100, Math.max(0, percent));

const getTimeRange = (timeline: UserTimelineEvent[]): TimeRange => {
  const timestamps = timeline.map((entry) => entry.timestamp);
  const start = Math.min(...timestamps);
  const end = Math.max(...timestamps);
  return end > start ? { start, end } : { start: start - ONE_HOUR, end: end + ONE_HOUR };
};

const getAccountCreatedAt = (timeline: UserTimelineEvent[]) =>
  timeline.find((entry) => entry.kind === "account_created")?.timestamp;

export function UserTimelineChart({ timeline }: UserTimelineChartProps) {
  const [hovered, setHovered] = useState<{ entry: UserTimelineEvent; percent: number } | null>(
    null,
  );
  const [zoomRange, setZoomRange] = useState<TimeRange | null>(null);
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  if (timeline.length === 0) return null;

  const { start, end } = zoomRange ?? getTimeRange(timeline);
  const toPercent = (timestamp: number) => ((timestamp - start) / (end - start)) * 100;
  const toTimestamp = (percent: number) => start + ((end - start) * percent) / 100;
  const entriesInView = timeline.filter(
    (entry) => entry.timestamp >= start && entry.timestamp <= end,
  );
  const visibleLanes = TIMELINE_LANES.filter((lane) =>
    timeline.some((entry) => getLaneForEntry(entry) === lane),
  );
  const accountCreatedAt = getAccountCreatedAt(timeline);
  const anonymousRegionPercent =
    accountCreatedAt !== undefined && timeline.some((entry) => entry.wasAnonymous)
      ? clampPercent(toPercent(accountCreatedAt))
      : 0;

  const pointerPercent = (clientX: number) => {
    const rect = plotRef.current!.getBoundingClientRect();
    return clampPercent(((clientX - rect.left) / rect.width) * 100);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const percent = pointerPercent(e.clientX);
    setDragSelection({ fromPercent: percent, toPercent: percent });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragSelection) return;
    setHovered(null);
    setDragSelection({ ...dragSelection, toPercent: pointerPercent(e.clientX) });
  };

  const handlePointerUp = () => {
    if (!dragSelection) return;
    const fromPercent = Math.min(dragSelection.fromPercent, dragSelection.toPercent);
    const toPercent = Math.max(dragSelection.fromPercent, dragSelection.toPercent);
    if (toPercent - fromPercent >= MIN_ZOOM_DRAG_PERCENT) {
      setZoomRange({ start: toTimestamp(fromPercent), end: toTimestamp(toPercent) });
    }
    setDragSelection(null);
  };
  const ticks = Array.from(
    { length: TICK_COUNT },
    (_, index) => start + ((end - start) * index) / (TICK_COUNT - 1),
  );

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
        <span>Drag across the chart to zoom in</span>
        {zoomRange && (
          <button
            type="button"
            onClick={() => setZoomRange(null)}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
          >
            <ZoomOut className="w-3.5 h-3.5" />
            Reset zoom
          </button>
        )}
      </div>
      <div className="flex">
        <div className="w-28 shrink-0">
          {visibleLanes.map((lane) => (
            <div key={lane.label} className="h-7 flex items-center text-xs text-slate-600">
              {lane.label}
            </div>
          ))}
        </div>

        <div className="relative flex-1 min-w-0">
          {anonymousRegionPercent > 0 && (
            <div
              className="absolute inset-y-0 left-0 bg-slate-100 rounded-sm"
              style={{ width: `${anonymousRegionPercent}%` }}
            >
              <span className="absolute top-0 left-1 text-[10px] text-slate-500">anonymous</span>
            </div>
          )}

          <div
            ref={plotRef}
            className="relative cursor-crosshair select-none touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => setDragSelection(null)}
          >
            {visibleLanes.map((lane) => (
              <div key={lane.label} className="relative h-7">
                <div className="absolute inset-x-0 top-1/2 border-t border-slate-200" />
                {entriesInView
                  .filter((entry) => getLaneForEntry(entry) === lane)
                  .map((entry, index) => {
                    const percent = toPercent(entry.timestamp);
                    return (
                      <button
                        key={`${entry.timestamp}-${index}`}
                        type="button"
                        aria-label={`${entry.label} at ${new Date(entry.timestamp).toLocaleString()}`}
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center"
                        style={{ left: `${percent}%` }}
                        onMouseEnter={() => setHovered({ entry, percent })}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered({ entry, percent })}
                        onBlur={() => setHovered(null)}
                      >
                        <span
                          className="block w-2.5 h-2.5 rounded-full ring-2 ring-white"
                          style={{ backgroundColor: lane.color }}
                        />
                      </button>
                    );
                  })}
              </div>
            ))}

            {dragSelection && (
              <div
                className="absolute inset-y-0 bg-blue-500/10 border-x border-blue-400 pointer-events-none"
                style={{
                  left: `${Math.min(dragSelection.fromPercent, dragSelection.toPercent)}%`,
                  width: `${Math.abs(dragSelection.toPercent - dragSelection.fromPercent)}%`,
                }}
              />
            )}
          </div>

          {hovered && (
            <div
              className="absolute bottom-full mb-2 z-10 w-64 p-2 rounded-md bg-white border border-slate-200 shadow-md text-xs pointer-events-none"
              style={{
                left: `${hovered.percent}%`,
                transform: `translateX(-${hovered.percent}%)`,
              }}
            >
              <div className="text-slate-900">{hovered.entry.label}</div>
              <div className="text-slate-500">
                {new Date(hovered.entry.timestamp).toLocaleString()}
                {hovered.entry.wasAnonymous && " · anonymous"}
              </div>
              {hovered.entry.detail && (
                <div className="text-slate-700 mt-1 line-clamp-3 wrap-break-word">
                  {hovered.entry.detail}
                </div>
              )}
              {hovered.entry.roomId && (
                <div className="text-slate-500 mt-1 truncate">
                  Room: {hovered.entry.roomTopic ?? hovered.entry.roomId}
                </div>
              )}
            </div>
          )}

          <div className="relative h-5 mt-1 border-t border-slate-300">
            {ticks.map((tick, index) => (
              <span
                key={tick}
                className="absolute top-1 text-[10px] text-slate-500 whitespace-nowrap"
                style={{
                  left: `${toPercent(tick)}%`,
                  transform: `translateX(-${(index / (TICK_COUNT - 1)) * 100}%)`,
                }}
              >
                {formatTick(tick, end - start)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
