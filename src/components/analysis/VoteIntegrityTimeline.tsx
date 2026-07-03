import { useEffect, useMemo, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";

export type VoteChoice = "super_agree" | "agree" | "pass" | "disagree";

export interface VoteIntegrityEvent {
  id: string;
  timestamp: number;
  /** Device fingerprint derived from signals like user agent, screen size, timezone. Never rendered raw. */
  fingerprint: string;
  isAnon: boolean;
  choice: VoteChoice;
  statementText?: string;
}

interface VoteIntegrityTimelineProps {
  votes: VoteIntegrityEvent[];
  onVoteSelect?: (vote: VoteIntegrityEvent) => void;
}

interface ChoiceStyle {
  key: VoteChoice;
  label: string;
  color: string;
}

const CHOICE_STYLES: ChoiceStyle[] = [
  { key: "super_agree", label: "Super Agree", color: "var(--color-purple-500)" },
  { key: "agree", label: "Agree", color: "var(--color-green-500)" },
  { key: "pass", label: "Pass", color: "var(--color-amber-500)" },
  { key: "disagree", label: "Disagree", color: "var(--color-red-500)" },
];

const PAD = { top: 10, right: 24, bottom: 40, left: 120 };
const ROW_H = 30;
const MAX_CHART_HEIGHT = 480;
const DOT_R = 4;
const HIT_R = 9;
const SUSPICIOUS_WINDOW_MS = 6000;
const SUSPICIOUS_MIN_BURST = 3;
const TOOLTIP_HALF_W = 130;

interface ViewWindow {
  start: number;
  end: number;
}

function clampView(start: number, end: number, domain: ViewWindow, minSpan: number): ViewWindow {
  const maxSpan = domain.end - domain.start;
  const span = Math.min(Math.max(end - start, minSpan), maxSpan);
  let s = start;
  let e = s + span;
  if (s < domain.start) {
    s = domain.start;
    e = s + span;
  }
  if (e > domain.end) {
    e = domain.end;
    s = e - span;
  }
  return { start: s, end: e };
}

function formatTick(ts: number, spanMs: number): string {
  const date = new Date(ts);
  if (spanMs > 2 * 86_400_000) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (spanMs > 2 * 3_600_000) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatFull(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// Flags votes where the same fingerprint casts the same choice repeatedly
// within a short window -- the "bot spam" / coordinated-voting signature.
function findSuspiciousIds(votes: VoteIntegrityEvent[]): Set<string> {
  const flagged = new Set<string>();
  const byKey = new Map<string, VoteIntegrityEvent[]>();
  for (const v of votes) {
    const key = `${v.fingerprint}::${v.choice}`;
    const arr = byKey.get(key);
    if (arr) arr.push(v);
    else byKey.set(key, [v]);
  }
  for (const arr of byKey.values()) {
    const sorted = [...arr].sort((a, b) => a.timestamp - b.timestamp);
    let windowStart = 0;
    for (let i = 0; i < sorted.length; i++) {
      while (sorted[i].timestamp - sorted[windowStart].timestamp > SUSPICIOUS_WINDOW_MS) windowStart++;
      if (i - windowStart + 1 >= SUSPICIOUS_MIN_BURST) {
        for (let k = windowStart; k <= i; k++) flagged.add(sorted[k].id);
      }
    }
  }
  return flagged;
}

interface RowInfo {
  fingerprint: string;
  votes: VoteIntegrityEvent[];
  flaggedCount: number;
  mostRecentTs: number;
  firstSeenTs: number;
}

function buildRows(votes: VoteIntegrityEvent[], suspiciousIds: Set<string>): RowInfo[] {
  const map = new Map<string, RowInfo>();
  for (const v of votes) {
    let row = map.get(v.fingerprint);
    if (!row) {
      row = { fingerprint: v.fingerprint, votes: [], flaggedCount: 0, mostRecentTs: -Infinity, firstSeenTs: Infinity };
      map.set(v.fingerprint, row);
    }
    row.votes.push(v);
    if (suspiciousIds.has(v.id)) row.flaggedCount++;
    if (v.timestamp > row.mostRecentTs) row.mostRecentTs = v.timestamp;
    if (v.timestamp < row.firstSeenTs) row.firstSeenTs = v.timestamp;
  }
  return Array.from(map.values()).sort((a, b) => b.mostRecentTs - a.mostRecentTs);
}

// Stable, arrival-order voter numbers -- independent of the most-recent-first
// display sort, so a given voter keeps the same friendly label as new votes come in.
function buildVoterNumbers(rows: RowInfo[]): Map<string, number> {
  const byArrival = [...rows].sort((a, b) => a.firstSeenTs - b.firstSeenTs);
  return new Map(byArrival.map((r, i) => [r.fingerprint, i + 1]));
}

function anonSummary(row: RowInfo): { label: string; color: string } {
  const anonVotes = row.votes.filter((v) => v.isAnon).length;
  if (anonVotes === row.votes.length) return { label: "Anonymous", color: "#9ca3af" };
  if (anonVotes === 0) return { label: "Identified", color: "#4b5563" };
  return { label: "Mixed", color: "var(--color-amber-600)" };
}

interface TooltipState {
  vote: VoteIntegrityEvent;
  row: RowInfo;
  x: number;
  y: number;
  flagged: boolean;
}

export function VoteIntegrityTimeline({ votes, onVoteSelect }: VoteIntegrityTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState(800);
  const [view, setView] = useState<ViewWindow | null>(null);
  const [hoveredFingerprint, setHoveredFingerprint] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const dragRef = useRef<{ startX: number; startView: ViewWindow } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setSvgWidth(entries[0].contentRect.width));
    ro.observe(el);
    setSvgWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const domain = useMemo<ViewWindow | null>(() => {
    if (votes.length === 0) return null;
    const min = Math.min(...votes.map((v) => v.timestamp));
    const max = Math.max(...votes.map((v) => v.timestamp));
    const pad = Math.max((max - min) * 0.05, 1000);
    return { start: min - pad, end: max + pad };
  }, [votes]);

  useEffect(() => {
    if (domain) setView(domain);
  }, [domain]);

  const suspiciousIds = useMemo(() => findSuspiciousIds(votes), [votes]);
  const rows = useMemo(() => buildRows(votes, suspiciousIds), [votes, suspiciousIds]);
  const rowIndex = useMemo(() => new Map(rows.map((r, i) => [r.fingerprint, i])), [rows]);
  const voterNumbers = useMemo(() => buildVoterNumbers(rows), [rows]);

  const chartW = svgWidth - PAD.left - PAD.right;
  const laneAreaH = rows.length * ROW_H;
  const svgH = PAD.top + laneAreaH + PAD.bottom;
  const minSpan = domain ? Math.min(2000, domain.end - domain.start) : 2000;

  const xScale = (t: number, v: ViewWindow) => PAD.left + ((t - v.start) / (v.end - v.start)) * chartW;

  const zoomAt = (anchorT: number, factor: number) => {
    if (!view || !domain) return;
    const span = view.end - view.start;
    const ratio = (anchorT - view.start) / span;
    const newSpan = Math.min(Math.max(span * factor, minSpan), domain.end - domain.start);
    const newStart = anchorT - ratio * newSpan;
    setView(clampView(newStart, newStart + newSpan, domain, minSpan));
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (!view || !svgRef.current) return;
    // Plain wheel scrolls the row list vertically; zoom requires a modifier
    // so scrolling through many voters doesn't fight with zooming the timeline.
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const span = view.end - view.start;
    const anchorT = view.start + ((mouseX - PAD.left) / chartW) * span;
    zoomAt(anchorT, e.deltaY < 0 ? 0.8 : 1.25);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!view) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startView: view };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current || !domain) return;
      const dx = e.clientX - dragRef.current.startX;
      const span = dragRef.current.startView.end - dragRef.current.startView.start;
      const deltaTime = (dx / chartW) * span;
      const newStart = dragRef.current.startView.start - deltaTime;
      const newEnd = dragRef.current.startView.end - deltaTime;
      setView(clampView(newStart, newEnd, domain, minSpan));
    };
    const onUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, chartW, domain, minSpan]);

  if (votes.length === 0 || !domain || !view) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No vote data available
      </div>
    );
  }

  const span = view.end - view.start;
  const buffer = span * 0.1;
  const visibleVotes = votes.filter((v) => v.timestamp >= view.start - buffer && v.timestamp <= view.end + buffer);

  const TICK_COUNT = 6;
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const ts = view.start + (span / (TICK_COUNT - 1)) * i;
    return { ts, x: xScale(ts, view) };
  });

  const anonCount = votes.filter((v) => v.isAnon).length;
  const flaggedRowCount = rows.filter((r) => r.flaggedCount > 0).length;

  const clampedTooltipX = tooltip
    ? Math.min(Math.max(tooltip.x, PAD.left + TOOLTIP_HALF_W), Math.max(PAD.left + chartW - TOOLTIP_HALF_W, PAD.left + TOOLTIP_HALF_W))
    : 0;
  const flipTooltipBelow = tooltip ? tooltip.y - scrollTop < 90 : false;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>{votes.length} votes</span>
          <span>{rows.length} voters</span>
          <span>{Math.round((anonCount / votes.length) * 100)}% anonymous</span>
          {flaggedRowCount > 0 && (
            <span className="flex items-center gap-1 disagree-text font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              {flaggedRowCount} flagged voter{flaggedRowCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => zoomAt((view.start + view.end) / 2, 0.7)}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => zoomAt((view.start + view.end) / 2, 1.4)}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setView(domain)}>
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative border border-gray-200 rounded-md"
        style={{ maxHeight: MAX_CHART_HEIGHT, overflowY: laneAreaH > MAX_CHART_HEIGHT - PAD.top - PAD.bottom ? "auto" : "hidden", overflowX: "hidden" }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgH}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          style={{ display: "block", cursor: isDragging ? "grabbing" : "grab", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
        >
          <defs>
            <clipPath id="vote-integrity-clip">
              <rect x={PAD.left} y={PAD.top} width={chartW} height={laneAreaH} />
            </clipPath>
          </defs>

          {rows.map((row, i) => {
            const y = PAD.top + i * ROW_H;
            const summary = anonSummary(row);
            const rowFlagged = row.flaggedCount > 0;
            return (
              <g key={row.fingerprint}>
                <rect
                  x={PAD.left}
                  y={y}
                  width={chartW}
                  height={ROW_H}
                  fill={rowFlagged ? "var(--color-red-50)" : i % 2 === 0 ? "#fafafa" : "#ffffff"}
                  fillOpacity={hoveredFingerprint && hoveredFingerprint !== row.fingerprint ? 0.5 : 1}
                />
                <line x1={PAD.left} y1={y + ROW_H} x2={PAD.left + chartW} y2={y + ROW_H} stroke="#f0f0f0" strokeWidth={1} />
                <text x={PAD.left - 110} y={y + ROW_H / 2 - 6} textAnchor="start" dominantBaseline="middle" fontSize={10} fontWeight={rowFlagged ? 700 : 500} fill={rowFlagged ? "var(--color-red-700)" : "#374151"}>
                  Voter {voterNumbers.get(row.fingerprint)}
                </text>
                <text x={PAD.left - 110} y={y + ROW_H / 2 + 7} textAnchor="start" dominantBaseline="middle" fontSize={8.5} fill={summary.color}>
                  {summary.label}
                </text>
              </g>
            );
          })}
          <rect x={PAD.left} y={PAD.top} width={chartW} height={laneAreaH} fill="none" stroke="#d1d5db" strokeWidth={1} />

          <g clipPath="url(#vote-integrity-clip)">
            {visibleVotes.map((v) => {
              const i = rowIndex.get(v.fingerprint);
              if (i === undefined) return null;
              const style = CHOICE_STYLES.find((c) => c.key === v.choice)!;
              const x = xScale(v.timestamp, view);
              const y = PAD.top + i * ROW_H + ROW_H / 2;
              const isFlagged = suspiciousIds.has(v.id);
              const dimmed = hoveredFingerprint !== null && hoveredFingerprint !== v.fingerprint;
              const emphasized = hoveredFingerprint !== null && hoveredFingerprint === v.fingerprint;
              const row = rows[i];

              return (
                <g
                  key={v.id}
                  style={{ cursor: onVoteSelect ? "pointer" : "default" }}
                  onMouseEnter={() => {
                    setHoveredFingerprint(v.fingerprint);
                    setTooltip({ vote: v, row, x, y, flagged: isFlagged });
                  }}
                  onMouseLeave={() => {
                    setHoveredFingerprint(null);
                    setTooltip(null);
                  }}
                  onClick={() => onVoteSelect?.(v)}
                >
                  <circle cx={x} cy={y} r={HIT_R} fill="transparent" />
                  {isFlagged && (
                    <circle
                      cx={x}
                      cy={y}
                      r={DOT_R + 4}
                      fill="none"
                      stroke="var(--color-red-500)"
                      strokeWidth={1.5}
                      strokeOpacity={dimmed ? 0.15 : 0.75}
                      className="animate-pulse"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={emphasized ? DOT_R + 1.5 : DOT_R}
                    fill={style.color}
                    fillOpacity={dimmed ? 0.15 : 0.95}
                    stroke="white"
                    strokeWidth={v.isAnon ? 1.25 : 1}
                    strokeDasharray={v.isAnon ? "1.5,1.25" : undefined}
                    strokeOpacity={dimmed ? 0.15 : 1}
                    style={{ transition: "r 0.1s, fill-opacity 0.15s, stroke-opacity 0.15s" }}
                  />
                </g>
              );
            })}
          </g>

          {ticks.map(({ ts, x }) => (
            <g key={ts}>
              <line x1={x} y1={PAD.top + laneAreaH} x2={x} y2={PAD.top + laneAreaH + 5} stroke="#d1d5db" strokeWidth={1} />
              <text x={x} y={PAD.top + laneAreaH + 18} textAnchor="middle" fontSize={10} fill="#9ca3af">
                {formatTick(ts, span)}
              </text>
            </g>
          ))}
        </svg>

        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: clampedTooltipX,
              top: flipTooltipBelow ? tooltip.y + 14 : tooltip.y - 10,
              transform: flipTooltipBelow ? "translate(-50%, 0%)" : "translate(-50%, -100%)",
              pointerEvents: "none",
            }}
            className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs space-y-1 whitespace-nowrap z-10 max-w-xs"
          >
            <p className="font-semibold">Voter {voterNumbers.get(tooltip.row.fingerprint)}</p>
            <p className="text-gray-500">{tooltip.vote.isAnon ? "Anonymous" : "Identified"} voter</p>
            <p className="text-gray-500">
              Vote: <span className="font-medium" style={{ color: CHOICE_STYLES.find((c) => c.key === tooltip.vote.choice)!.color }}>{CHOICE_STYLES.find((c) => c.key === tooltip.vote.choice)!.label}</span>
            </p>
            <p className="text-gray-500">{formatFull(tooltip.vote.timestamp)}</p>
            <p className="text-gray-400 whitespace-normal">Grouped by device, so we can spot the same person voting more than once.</p>
            {tooltip.vote.statementText && <p className="text-gray-500 whitespace-normal italic">"{tooltip.vote.statementText}"</p>}
            {tooltip.flagged && (
              <p className="disagree-text font-medium flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Voted the same way many times, very quickly
              </p>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Scroll to see more voters, drag to pan the timeline, Ctrl/Cmd+scroll (or the zoom buttons) to zoom. Each row is one voter, sorted by most recent activity &middot; dot color = how they voted &middot; dashed dot border = anonymous, solid = identified &middot; red glow = flagged for voting the same way many times, very quickly.
      </p>
    </div>
  );
}
