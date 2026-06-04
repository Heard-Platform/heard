import { useRef, useState, useEffect } from "react";
import type { UserTimelineEntry } from "../types";

interface UserTimelineChartProps {
  users: UserTimelineEntry[];
}

const DAY_MS = 86_400_000;
const SVG_H = 300;
const PAD = { top: 20, right: 24, bottom: 44, left: 24 };
const BASELINE_Y = SVG_H - PAD.bottom;
const MAX_ARCH_H = BASELINE_Y - PAD.top;
const MIN_ARCH_H = 10;

function arcColor(lastActive: number): string {
  const daysAgo = (Date.now() - lastActive) / DAY_MS;
  if (daysAgo < 30) return "#10b981";
  if (daysAgo < 90) return "#f59e0b";
  return "#9ca3af";
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

interface TooltipState {
  x: number;
  y: number;
  id: string;
  name: string;
  email: string;
  createdAt: number;
  lastActive: number;
}

export function UserTimelineChart({ users }: UserTimelineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(800);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setSvgWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setSvgWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const entries = users
    .filter((u) => !u.isTestUser && !u.isDeveloper)
    // longest spans render first (behind) so shorter arcs stay visible
    .sort((a, b) => (b.lastActive - b.createdAt) - (a.lastActive - a.createdAt));

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No user data available
      </div>
    );
  }

  const minTime = Math.min(...entries.map((u) => u.createdAt));
  const maxTime = Math.max(...entries.map((u) => u.lastActive));
  const totalSpan = maxTime - minTime || 1;
  const maxUserSpan = Math.max(...entries.map((u) => u.lastActive - u.createdAt)) || 1;

  const chartW = svgWidth - PAD.left - PAD.right;
  const timeToX = (ts: number) => PAD.left + ((ts - minTime) / totalSpan) * chartW;

  const TICK_COUNT = 6;
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const ts = minTime + (totalSpan / (TICK_COUNT - 1)) * i;
    return { ts, x: timeToX(ts) };
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          Active ≤ 30d
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
          30–90d
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
          90d+
        </span>
        {users.filter((u) => !u.isTestUser && !u.isDeveloper).length !== users.length && (
          <span className="ml-auto">
            {users.filter((u) => !u.isTestUser && !u.isDeveloper).length} of {users.length} users shown
          </span>
        )}
      </div>

      <div ref={containerRef} className="relative">
        <svg
          width={svgWidth}
          height={SVG_H}
          style={{ display: "block", overflow: "visible" }}
        >
          {/* baseline */}
          <line
            x1={PAD.left}
            y1={BASELINE_Y}
            x2={PAD.left + chartW}
            y2={BASELINE_Y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />

          {entries.map((u) => {
            const x1 = timeToX(u.createdAt);
            const x2 = timeToX(u.lastActive);
            const midX = (x1 + x2) / 2;
            const userSpan = u.lastActive - u.createdAt;
            const archH =
              MIN_ARCH_H + (MAX_ARCH_H - MIN_ARCH_H) * (userSpan / maxUserSpan);
            const peakY = BASELINE_Y - archH;
            const pathD = `M ${x1} ${BASELINE_Y} Q ${midX} ${peakY} ${x2} ${BASELINE_Y}`;
            const color = arcColor(u.lastActive);
            const name = u.nickname || u.id.slice(0, 8);
            const xSpan = x2 - x1;

            // For quadratic Bézier with midpoint control: X is linear in t,
            // so t = (dotX - x1) / (x2 - x1), then Y = baseline*(1-2t+2t²) + 2t(1-t)*peakY
            const dotY = (dotX: number) => {
              const t = xSpan === 0 ? 0 : Math.max(0, Math.min(1, (dotX - x1) / xSpan));
              return BASELINE_Y * (1 - 2 * t + 2 * t * t) + 2 * t * (1 - t) * peakY;
            };

            return (
              <g key={u.id}>
                {/* activity dots */}
                {u.activeDays?.map((dayTs) => {
                  const dx = timeToX(dayTs);
                  return (
                    <circle
                      key={dayTs}
                      cx={dx}
                      cy={dotY(dx)}
                      r={1.5}
                      fill={color}
                      fillOpacity={tooltip && tooltip.id !== u.id ? 0.05 : 0.75}
                      style={{ pointerEvents: "none", transition: "fill-opacity 0.15s" }}
                    />
                  );
                })}
                {/* wide transparent hit area */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() =>
                    setTooltip({
                      x: midX,
                      y: peakY,
                      id: u.id,
                      name,
                      email: u.email,
                      createdAt: u.createdAt,
                      lastActive: u.lastActive,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
                {/* visible arc */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  strokeOpacity={tooltip && tooltip.id !== u.id ? 0.08 : 0.5}
                  style={{ pointerEvents: "none", transition: "stroke-opacity 0.15s" }}
                />
              </g>
            );
          })}

          {/* x-axis ticks + labels */}
          {ticks.map(({ ts, x }) => (
            <g key={ts}>
              <line
                x1={x}
                y1={BASELINE_Y}
                x2={x}
                y2={BASELINE_Y + 5}
                stroke="#d1d5db"
                strokeWidth={1}
              />
              <text
                x={x}
                y={BASELINE_Y + 17}
                textAnchor="middle"
                fontSize={10}
                fill="#9ca3af"
              >
                {fmtDate(ts)}
              </text>
            </g>
          ))}
        </svg>

        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: tooltip.x,
              top: tooltip.y - 8,
              transform: "translate(-50%, -100%)",
              pointerEvents: "none",
            }}
            className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs space-y-0.5 whitespace-nowrap z-10"
          >
            <p className="font-semibold text-sm">{tooltip.name}</p>
            <p className="text-gray-400">{tooltip.email}</p>
            <p className="text-gray-500">Joined: {fmtDate(tooltip.createdAt)}</p>
            <p className="text-gray-500">Last active: {fmtDate(tooltip.lastActive)}</p>
            <p className="text-gray-500">
              Span:{" "}
              {Math.round((tooltip.lastActive - tooltip.createdAt) / DAY_MS) === 0
                ? "same day"
                : `${Math.round((tooltip.lastActive - tooltip.createdAt) / DAY_MS)} days`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
