import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Statement } from "../../types";

interface PolisSpectrumScrubProps {
  statements: Statement[];
}

interface Point {
  statement: Statement;
  agreePct: number;
  disagreePct: number;
  passPct: number;
  nx: number;
  jitter: number;
}

interface AnchorBand {
  label: string;
  target: number;
  min: number;
  max: number;
  useLowestIdx?: boolean;
  useHighestIdx?: boolean;
}

const ANCHOR_BANDS: AnchorBand[] = [
  { label: "most agreement", target: 0, min: 0, max: 0.12, useLowestIdx: true },
  { label: "high agreement", target: 0.25, min: 0.18, max: 0.36 },
  { label: "split", target: 0.5, min: 0.42, max: 0.58 },
  { label: "high disagreement", target: 0.75, min: 0.64, max: 0.82 },
  { label: "most disagreement", target: 1, min: 0.88, max: 1, useHighestIdx: true },
];

const SCRUB_HALF_WIDTH_PCT = 0.055;
const BRICK_GAP_PX = 5;
const AGREE_COLOR = "#1D9E75";
const DISAGREE_COLOR = "#D85A30";
const COLOR_BG = "#ffffff";
const COLOR_FG = "#1a1a1a";
const COLOR_MUTED = "#f4f4f5";
const COLOR_MUTED_FG = "#71717a";
const COLOR_BORDER = "rgba(0,0,0,0.1)";
const FONT_SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function makeSeededRng(initial: number): () => number {
  let s = initial;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function dotColor(nx: number, alpha: number): string {
  const r = Math.round(55 + nx * 168);
  const g = Math.round(158 - nx * 128);
  const b = Math.round(77 - nx * 47);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    padding: "16px 0 8px",
    userSelect: "none",
    WebkitUserSelect: "none",
    fontFamily: FONT_SANS,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    color: COLOR_MUTED_FG,
    marginBottom: 6,
    padding: "0 2px",
  },
  stripWrap: {
    position: "relative",
    width: "100%",
    height: 160,
    cursor: "crosshair",
  },
  canvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
  labelLayer: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  anchorLabel: {
    position: "absolute",
    pointerEvents: "none",
    background: COLOR_BG,
    border: `0.5px solid ${COLOR_BORDER}`,
    borderRadius: 6,
    padding: "6px 9px",
    maxWidth: 155,
    fontSize: 11,
    lineHeight: 1.4,
    color: COLOR_FG,
  },
  anchorBadge: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: COLOR_MUTED_FG,
    marginBottom: 2,
  },
  anchorText: {
    fontWeight: 500,
  },
  cardsArea: {
    marginTop: 10,
    minHeight: 88,
  },
  pinBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 2px 6px",
    fontSize: 11,
    color: COLOR_MUTED_FG,
  },
  pinButton: {
    fontSize: 11,
    padding: "2px 8px",
    cursor: "pointer",
    borderRadius: 4,
    color: COLOR_MUTED_FG,
    background: "transparent",
    border: "none",
    font: "inherit",
  },
  bricksScroll: {
    display: "flex",
    flexWrap: "wrap",
    alignContent: "flex-start",
    gap: BRICK_GAP_PX,
    maxHeight: 168,
    overflowY: "auto",
    overflowX: "hidden",
    paddingBottom: 6,
    scrollbarWidth: "thin",
  },
  brick: {
    minWidth: 100,
    maxWidth: 210,
    background: COLOR_MUTED,
    border: `0.5px solid ${COLOR_BORDER}`,
    borderRadius: 6,
    padding: "7px 9px",
    fontSize: 11,
    lineHeight: 1.4,
    color: COLOR_FG,
  },
  brickText: {
    fontWeight: 500,
    marginBottom: 5,
    lineHeight: 1.35,
  },
  brickBarWrap: {
    display: "flex",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    gap: 1,
    marginBottom: 4,
  },
  brickNums: {
    display: "flex",
    gap: 5,
    fontSize: 10,
  },
  hint: {
    fontSize: 12,
    color: COLOR_MUTED_FG,
    padding: "20px 2px",
  },
  scrubHint: {
    fontSize: 11,
    color: COLOR_MUTED_FG,
    marginTop: 6,
    transition: "opacity 0.4s",
    padding: "0 2px",
  },
};

export function PolisSpectrumScrub({ statements }: PolisSpectrumScrubProps) {
  const stripWrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [dims, setDims] = useState({ w: 0, h: 0, dpr: 1 });
  const [hoverRange, setHoverRange] = useState<{ start: number; end: number } | null>(null);
  const [pinnedRange, setPinnedRange] = useState<{ start: number; end: number } | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [hintHidden, setHintHidden] = useState(false);

  const pinned = pinnedRange !== null;
  const activeRange = pinned ? pinnedRange : hoverRange;

  const points = useMemo<Point[]>(() => {
    const rng = makeSeededRng(13);
    return statements
      .map((s) => {
        const total = s.agrees + s.superAgrees + s.disagrees + s.passes;
        const agreePct = total === 0 ? 0 : ((s.agrees + s.superAgrees) / total) * 100;
        const disagreePct = total === 0 ? 0 : (s.disagrees / total) * 100;
        const passPct = Math.max(0, 100 - agreePct - disagreePct);
        return {
          statement: s,
          agreePct,
          disagreePct,
          passPct,
          nx: (100 - (agreePct - disagreePct)) / 200,
          jitter: (rng() - 0.5) * 0.65 + 0.5,
        };
      })
      .sort((a, b) => a.nx - b.nx);
  }, [statements]);

  const anchors = useMemo<{ label: string; point: Point }[]>(() => {
    if (points.length === 0) return [];
    const used = new Set<Point>();
    const result: { label: string; point: Point }[] = [];
    for (const { label, target, min, max, useLowestIdx: lowestIndex, useHighestIdx: highestIndex } of ANCHOR_BANDS) {
      const pick = points
        .filter((p) => p.nx >= min && p.nx <= max && !used.has(p))
        .sort((a, b) =>
          lowestIndex
            ? a.nx - b.nx
            : highestIndex
              ? b.nx - a.nx
              : Math.abs(a.nx - target) - Math.abs(b.nx - target),
        )
        .shift();
      if (pick) {
        used.add(pick);
        result.push({ label, point: pick });
      }
    }
    return result;
  }, [points]);

  useEffect(() => {
    const wrap = stripWrapRef.current;
    if (!wrap) return;
    const observe = () => {
      setDims({
        w: wrap.offsetWidth,
        h: wrap.offsetHeight,
        dpr: window.devicePixelRatio || 1,
      });
    };
    observe();
    const ro = new ResizeObserver(observe);
    ro.observe(wrap);
    window.addEventListener("resize", observe);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", observe);
    };
  }, []);

  const ptX = useCallback(
    (p: Point) => p.nx * (dims.w * 0.92) + dims.w * 0.04,
    [dims.w],
  );
  const ptY = useCallback((p: Point) => dims.h * 0.1 + p.jitter * (dims.h * 0.72), [dims.h]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dims.w === 0 || dims.h === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = dims.w * dims.dpr;
    canvas.height = dims.h * dims.dpr;
    ctx.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
    ctx.clearRect(0, 0, dims.w, dims.h);

    ctx.strokeStyle = "rgba(0,0,0,0.07)";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(dims.w * 0.04, dims.h * 0.5);
    ctx.lineTo(dims.w * 0.96, dims.h * 0.5);
    ctx.stroke();

    if (activeRange !== null) {
      const x = activeRange.start;
      const w = Math.max(2, activeRange.end - activeRange.start);
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.beginPath();
      ctx.roundRect(x, 2, w, dims.h - 4, 4);
      ctx.fill();
      ctx.strokeStyle = pinned ? "rgba(0,0,0,0.32)" : "rgba(0,0,0,0.16)";
      ctx.lineWidth = pinned ? 1.25 : 1;
      ctx.beginPath();
      ctx.roundRect(x, 2, w, dims.h - 4, 4);
      ctx.stroke();
    }

    points.forEach((p) => {
      const x = ptX(p);
      const y = ptY(p);
      let dist: number;
      if (activeRange === null) {
        dist = 1;
      } else if (x >= activeRange.start && x <= activeRange.end) {
        dist = 0;
      } else {
        dist =
          Math.min(
            Math.abs(x - activeRange.start),
            Math.abs(x - activeRange.end),
          ) / dims.w;
      }
      const inActive = dist === 0;
      const radius = inActive ? 6 : 4;
      const alpha = activeRange !== null ? (inActive ? 1 : Math.max(0.15, 0.8 - dist * 4)) : 0.75;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = dotColor(p.nx, alpha);
      ctx.fill();
      if (inActive) {
        ctx.strokeStyle = dotColor(p.nx, 0.9);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }, [dims, points, activeRange, pinned, ptX, ptY]);

  const hoverBand = (cx: number) => {
    const bw = dims.w * SCRUB_HALF_WIDTH_PCT;
    return { start: cx - bw, end: cx + bw };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    if (pinned && pinnedRange) {
      const center = (pinnedRange.start + pinnedRange.end) / 2;
      if (Math.abs(cx - center) < 8) {
        setPinnedRange(null);
        return;
      }
    }
    setPinnedRange(null);
    setDragStart(cx);
    setHoverRange(hoverBand(cx));
    e.currentTarget.setPointerCapture(e.pointerId);
    if (!hintHidden) setHintHidden(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = Math.max(0, Math.min(dims.w, e.clientX - rect.left));
    if (!hintHidden) setHintHidden(true);

    if (dragStart !== null) {
      setHoverRange({
        start: Math.min(dragStart, cx),
        end: Math.max(dragStart, cx),
      });
    } else if (!pinned) {
      setHoverRange(hoverBand(cx));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart === null) return;
    const canvas = canvasRef.current;
    if (!canvas) {
      setDragStart(null);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const cx = Math.max(0, Math.min(dims.w, e.clientX - rect.left));
    const dist = Math.abs(cx - dragStart);
    const next =
      dist < 4
        ? hoverBand(cx)
        : { start: Math.min(dragStart, cx), end: Math.max(dragStart, cx) };
    setPinnedRange(next);
    setHoverRange(null);
    setDragStart(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerLeave = () => {
    if (pinned || dragStart !== null) return;
    setHoverRange(null);
  };

  const nearby = useMemo<Point[]>(() => {
    if (activeRange === null || dims.w === 0) return [];
    const center = (activeRange.start + activeRange.end) / 2;
    return points
      .filter((p) => {
        const x = ptX(p);
        return x >= activeRange.start && x <= activeRange.end;
      })
      .sort((a, b) => Math.abs(ptX(a) - center) - Math.abs(ptX(b) - center));
  }, [activeRange, points, dims.w, ptX]);

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span>← agree</span>
        <span>disagree →</span>
      </div>

      <div
        ref={stripWrapRef}
        style={{ ...styles.stripWrap, touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>

      <div style={styles.cardsArea}>
        {pinned && (
          <div style={styles.pinBar}>
            <span>
              {nearby.length} statement{nearby.length !== 1 ? "s" : ""} pinned
            </span>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setPinnedRange(null);
              }}
              style={styles.pinButton}
            >
              ✕ unpin
            </button>
          </div>
        )}

        {activeRange !== null && nearby.length === 0 && (
          <div style={styles.hint}>— no statements here —</div>
        )}

        {activeRange !== null && nearby.length > 0 && (
          <div style={styles.bricksScroll}>
            {nearby.map((p, i) => (
              <div key={i} style={styles.brick}>
                <div style={styles.brickText}>{p.statement.text}</div>
                <div style={styles.brickBarWrap}>
                  <div style={{ flex: p.agreePct, background: AGREE_COLOR }} />
                  <div style={{ flex: p.disagreePct, background: DISAGREE_COLOR }} />
                  <div style={{ flex: p.passPct, background: COLOR_BORDER }} />
                </div>
                <div style={styles.brickNums}>
                  <span style={{ color: AGREE_COLOR, fontWeight: 500 }}>
                    {Math.round(p.agreePct)}%
                  </span>
                  <span style={{ color: DISAGREE_COLOR, fontWeight: 500 }}>
                    {Math.round(p.disagreePct)}%
                  </span>
                  <span style={{ color: COLOR_MUTED_FG }}>
                    {Math.round(p.passPct)}% pass
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeRange === null && anchors.length > 0 && (
          <div style={styles.bricksScroll}>
            {anchors.map(({ label, point: p }, i) => (
              <div key={i} style={styles.brick}>
                <div style={styles.anchorBadge}>{label}</div>
                <div style={styles.brickText}>{p.statement.text}</div>
                <div style={styles.brickBarWrap}>
                  <div style={{ flex: p.agreePct, background: AGREE_COLOR }} />
                  <div style={{ flex: p.disagreePct, background: DISAGREE_COLOR }} />
                  <div style={{ flex: p.passPct, background: COLOR_BORDER }} />
                </div>
                <div style={styles.brickNums}>
                  <span style={{ color: AGREE_COLOR, fontWeight: 500 }}>
                    {Math.round(p.agreePct)}%
                  </span>
                  <span style={{ color: DISAGREE_COLOR, fontWeight: 500 }}>
                    {Math.round(p.disagreePct)}%
                  </span>
                  <span style={{ color: COLOR_MUTED_FG }}>
                    {Math.round(p.passPct)}% pass
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeRange === null && anchors.length === 0 && (
          <div style={styles.hint}>
            hover the strip to read statements · click to pin
          </div>
        )}
      </div>

      <div style={{ ...styles.scrubHint, opacity: hintHidden ? 0 : 1 }}>
        drag to explore · click to pin
      </div>
    </div>
  );
}
