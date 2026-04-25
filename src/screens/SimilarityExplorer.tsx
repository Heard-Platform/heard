import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";

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

interface SimilarityExplorerProps {
  onExit: () => void;
}

type SortDir = "asc" | "desc";

export function SimilarityExplorer({ onExit }: SimilarityExplorerProps) {
  const [mode, setMode] = useState<Mode>("pairs");
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<string>(ALL_TOPICS);
  const [topicSearch, setTopicSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>(
    MODE_CONFIGS.pairs.defaultSortKey,
  );
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [cols, setCols] = useState<Col[]>(MODE_CONFIGS.pairs.cols);

  useEffect(() => {
    const config = MODE_CONFIGS[mode];
    setRows(null);
    setError(null);
    setCols(config.cols);
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
    const q = topicSearch.trim().toLowerCase();
    if (!q) return allTopics;
    return allTopics.filter((t) => t.toLowerCase().includes(q));
  }, [allTopics, topicSearch]);

  const filteredSorted = useMemo(() => {
    if (!rows) return [];
    const q = topicSearch.trim().toLowerCase();
    let filtered = topic === ALL_TOPICS
      ? rows
      : rows.filter((r) => r.topic === topic);
    if (q) filtered = filtered.filter((r) => r.topic.toLowerCase().includes(q));
    const col = cols.find((c) => c.key === sortKey);
    const numeric = col?.numeric ?? false;
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const diff = numeric
        ? Number(av) - Number(bv)
        : String(av).localeCompare(String(bv));
      return sortDir === "desc" ? -diff : diff;
    });
    return sorted;
  }, [rows, topic, topicSearch, sortKey, sortDir, cols]);

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
      setSortDir(cols.find((c) => c.key === key)?.numeric ? "desc" : "asc");
    }
  };

  const totalWidth = cols.reduce((sum, c) => sum + c.width, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Similarity Explorer</h1>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-muted-foreground">View:</label>
            <Select value={mode} onValueChange={(v: string) => setMode(v as Mode)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODE_CONFIGS).map(([k, c]) => (
                  <SelectItem key={k} value={k}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load {MODE_CONFIGS[mode].path}: {error}
            <div className="mt-2 text-muted-foreground">
              Run the relevant scripts first:
              <pre className="mt-1">
                deno task extract-statements{"\n"}
                deno task score-statement-similarity{"\n"}
                deno task dryrun-duplicate-detection
              </pre>
            </div>
          </div>
        )}

        {!error && rows === null && (
          <div className="text-sm text-muted-foreground">Loading CSV...</div>
        )}

        {rows && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Topic:</label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger className="w-[320px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_TOPICS}>All topics</SelectItem>
                    {visibleTopics.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Search:</label>
                <Input
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  placeholder="Filter topics..."
                  className="w-[240px]"
                />
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                {filteredSorted.length} rows
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table
                className="table-fixed"
                style={{ width: totalWidth }}
              >
                <TableHeader>
                  <TableRow>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((row, i) => (
                    <TableRow key={page * PAGE_SIZE + i}>
                      {cols.map((col) => {
                        const raw = row[col.key] ?? "";
                        const display = col.numeric
                          ? Number(raw).toFixed(4)
                          : raw;
                        return (
                          <TableCell
                            key={col.key}
                            title={raw}
                            className={`truncate ${col.numeric ? "font-mono" : ""}`}
                            style={{ width: col.width, maxWidth: col.width }}
                          >
                            {display}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  {pageRows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={cols.length}
                        className="text-center text-muted-foreground"
                      >
                        No rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {page + 1} of {pageCount}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
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
    <TableHead
      style={{ width: col.width, maxWidth: col.width }}
      className="relative select-none p-0"
    >
      <button
        type="button"
        onClick={onSort}
        className="flex h-10 w-full items-center gap-1 truncate px-2 text-left"
        style={{ paddingRight: 12 }}
      >
        {col.label}
        {isSorted && <span>{sortDir === "desc" ? "↓" : "↑"}</span>}
      </button>
      <div
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 8,
          zIndex: 10,
          cursor: "col-resize",
          background: "var(--border, #ccc)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background =
            "var(--primary, #3b82f6)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background =
            "var(--border, #ccc)";
        }}
      />
    </TableHead>
  );
}
