// @ts-nocheck (mini-app component; type-checked by this dir's own tsconfig, not the project root's)
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";

const PAGE_SIZE = 50;
const ALL_TOPICS = "__all__";

type Mode = "pairs" | "merges";

type Col = {
  key: string;
  label: string;
  width: number;
  numeric?: boolean;
};

type ModeConfig = {
  label: string;
  path: string;
  cols: Col[];
  defaultSortKey: string;
  rowFilter?: (row: Record<string, string>) => boolean;
};

const MODE_CONFIGS: Record<Mode, ModeConfig> = {
  pairs: {
    label: "All pairs",
    path: "/data/statement-similarity.csv",
    defaultSortKey: "cosine_similarity",
    cols: [
      { key: "topic", label: "Topic", width: 220 },
      { key: "statement_1", label: "Statement 1", width: 320 },
      { key: "statement_2", label: "Statement 2", width: 320 },
      { key: "cosine_similarity", label: "Cosine similarity", width: 140, numeric: true },
    ],
    rowFilter: (r) => r.statement_1 !== r.statement_2,
  },
  merges: {
    label: "Dryrun merges",
    path: "/data/dryrun-merges.csv",
    defaultSortKey: "similarity",
    cols: [
      { key: "topic", label: "Topic", width: 220 },
      { key: "duplicate_text", label: "Duplicate (new)", width: 320 },
      { key: "target_text", label: "Target (kept)", width: 320 },
      { key: "similarity", label: "Similarity", width: 140, numeric: true },
    ],
  },
};

type SortDir = "asc" | "desc";

const CONTAINER_PADDING = 48;

function fitColsToViewport(configCols: Col[]): Col[] {
  const totalWeight = configCols.reduce((s, c) => s + c.width, 0);
  const available =
    (typeof window !== "undefined" ? window.innerWidth : 1280) - CONTAINER_PADDING;
  return configCols.map((c) => ({
    ...c,
    width: Math.max(60, Math.floor((c.width / totalWeight) * available)),
  }));
}

export function App() {
  const [mode, setMode] = useState<Mode>("pairs");
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<string>(ALL_TOPICS);
  const [topicSearch, setTopicSearch] = useState("");
  const deferredTopicSearch = useDeferredValue(topicSearch);
  const [sortKey, setSortKey] = useState<string>(MODE_CONFIGS.pairs.defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [cols, setCols] = useState<Col[]>(() => fitColsToViewport(MODE_CONFIGS.pairs.cols));

  useEffect(() => {
    const config = MODE_CONFIGS[mode];
    setRows(null);
    setError(null);
    setCols(fitColsToViewport(config.cols));
    setSortKey(config.defaultSortKey);
    setSortDir("desc");
    setTopic(ALL_TOPICS);
    setTopicSearch("");

    let cancelled = false;
    fetch(config.path)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.text();
      })
      .then((text) => {
        const parsed = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
        });
        const filtered = config.rowFilter
          ? parsed.data.filter(config.rowFilter)
          : parsed.data;
        if (!cancelled) setRows(filtered);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const allTopics = useMemo(() => {
    if (!rows) return [];
    return Array.from(new Set(rows.map((r) => r.topic))).sort();
  }, [rows]);

  const visibleTopics = useMemo(() => {
    const q = deferredTopicSearch.trim().toLowerCase();
    if (!q) return allTopics;
    return allTopics.filter((t) => t.toLowerCase().includes(q));
  }, [allTopics, deferredTopicSearch]);

  const filteredSorted = useMemo(() => {
    if (!rows) return [];
    const q = deferredTopicSearch.trim().toLowerCase();
    let filtered = topic === ALL_TOPICS ? rows : rows.filter((r) => r.topic === topic);
    if (q) filtered = filtered.filter((r) => r.topic.toLowerCase().includes(q));
    const numeric =
      MODE_CONFIGS[mode].cols.find((c) => c.key === sortKey)?.numeric ?? false;
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const diff = numeric
        ? Number(av) - Number(bv)
        : String(av).localeCompare(String(bv));
      return sortDir === "desc" ? -diff : diff;
    });
    return sorted;
  }, [rows, topic, deferredTopicSearch, sortKey, sortDir, mode]);

  useEffect(() => {
    setPage(0);
  }, [mode, topic, topicSearch, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const pageRows = filteredSorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSortClick = (key: string) => {
    if (key === sortKey) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      const numeric = MODE_CONFIGS[mode].cols.find((c) => c.key === key)?.numeric;
      setSortDir(numeric ? "desc" : "asc");
    }
  };

  const totalWidth = cols.reduce((sum, c) => sum + c.width, 0);

  return (
    <div className="container">
      <div className="header">
        <h1>Similarity Explorer</h1>
        <div className="control">
          <label>View:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            style={{ width: 200 }}
          >
            {Object.entries(MODE_CONFIGS).map(([k, c]) => (
              <option key={k} value={k}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error">
          Failed to load {MODE_CONFIGS[mode].path}: {error}
          <pre>
            Run the scripts first (from project root):{"\n"}
            deno run --allow-net --allow-env --allow-read --allow-write --env-file=.env research/duplication-detection/scripts/extract-statements.ts
            {"\n"}
            deno run --allow-net --allow-env --allow-read --allow-write --env-file=.env research/duplication-detection/scripts/score-statement-similarity.ts
            {"\n"}
            deno run --allow-read --allow-write research/duplication-detection/scripts/dryrun-duplicate-detection.ts
          </pre>
        </div>
      )}

      {!error && rows === null && <div className="loading">Loading CSV...</div>}

      {rows && (
        <>
          <div className="controls">
            <div className="control">
              <label>Topic:</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ width: 320 }}
              >
                <option value={ALL_TOPICS}>All topics</option>
                {visibleTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="control">
              <label>Search:</label>
              <input
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Filter topics..."
              />
            </div>
            <div className="right">{filteredSorted.length} rows</div>
          </div>

          <div className="table-wrap">
            <table style={{ width: totalWidth }}>
              <thead>
                <tr>
                  {cols.map((col, idx) => (
                    <ResizableHeader
                      key={col.key}
                      col={col}
                      isSorted={col.key === sortKey}
                      sortDir={sortDir}
                      onSort={() => handleSortClick(col.key)}
                      onResize={(newWidth) => {
                        setCols((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], width: newWidth };
                          return next;
                        });
                      }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => (
                  <tr key={page * PAGE_SIZE + i}>
                    {cols.map((col) => {
                      const raw = row[col.key] ?? "";
                      const display = col.numeric ? Number(raw).toFixed(4) : raw;
                      return (
                        <td
                          key={col.key}
                          title={raw}
                          className={col.numeric ? "numeric" : ""}
                          style={{ width: col.width, maxWidth: col.width }}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={cols.length} className="empty">
                      No rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <div>
              Page {page + 1} of {pageCount}
            </div>
            <button
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface ResizableHeaderProps {
  col: Col;
  isSorted: boolean;
  sortDir: SortDir;
  onSort: () => void;
  onResize: (width: number) => void;
}

function ResizableHeader({
  col,
  isSorted,
  sortDir,
  onSort,
  onResize,
}: ResizableHeaderProps) {
  const startXRef = useRef(0);
  const startWRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startXRef.current = e.clientX;
    startWRef.current = col.width;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startXRef.current;
      onResize(Math.max(60, startWRef.current + delta));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <th style={{ width: col.width, maxWidth: col.width }}>
      <button type="button" onClick={onSort} className="sort">
        {col.label}
        {isSorted && <span> {sortDir === "desc" ? "↓" : "↑"}</span>}
      </button>
      <div
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
        className="resize-handle"
      />
    </th>
  );
}
