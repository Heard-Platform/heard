import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { devApi } from "../../utils/dev-api";

type EndpointKey = "ping" | "kv-single" | "sql-table" | "kv-all";

interface EndpointConfig {
  key: EndpointKey;
  label: string;
  description: string;
  run: () => Promise<{ success: boolean; durationMs: number }>;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    key: "ping",
    label: "Ping",
    description: "No-op — baseline round-trip to edge function",
    run: () => devApi.testPingPerf(),
  },
  {
    key: "kv-single",
    label: "KV Single Room",
    description: "Fetch one room by ID from Deno KV",
    run: () => devApi.testKvSinglePerf(),
  },
  {
    key: "sql-table",
    label: "SQL Flyer Scans",
    description: "Fetch flyer_scans table from Postgres",
    run: () => devApi.testSqlTablePerf(),
  },
  {
    key: "kv-all",
    label: "KV All Rooms",
    description: "Fetch all rooms from Deno KV (expensive scan)",
    run: () => devApi.testKvAllPerf(),
  },
];

const RUNS_PER_ENDPOINT = 5;
const TOTAL_REQUESTS = ENDPOINTS.length * RUNS_PER_ENDPOINT;

interface TimingResult {
  endpoint: EndpointKey;
  durationMs: number;
  success: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function avgColor(ms: number): string {
  if (ms < 300) return "text-green-600";
  if (ms < 800) return "text-yellow-600";
  return "text-red-600";
}

export function PerformanceTestTab() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TimingResult[]>([]);

  const runTest = async () => {
    setRunning(true);
    setProgress(0);
    setResults([]);

    const queue = shuffle(
      ENDPOINTS.flatMap((ep) => Array(RUNS_PER_ENDPOINT).fill(ep)),
    ) as EndpointConfig[];

    const collected: TimingResult[] = [];

    for (const ep of queue) {
      const { success, durationMs } = await ep.run();
      collected.push({ endpoint: ep.key, durationMs, success });
      setProgress(collected.length);
    }

    setResults(collected);
    setRunning(false);
  };

  const stats = ENDPOINTS.map((ep) => {
    const epResults = results.filter((r) => r.endpoint === ep.key);
    const times = epResults.map((r) => r.durationMs);
    const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : null;
    const errors = epResults.filter((r) => !r.success).length;
    return { ...ep, times, avg, errors };
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">Performance Test</h2>
        <p className="text-sm text-slate-500 mb-4">
          Fires {TOTAL_REQUESTS} requests ({RUNS_PER_ENDPOINT} per endpoint) in random order and
          reports average round-trip latency per endpoint.
        </p>
        <Button onClick={runTest} disabled={running}>
          {running ? `Running… ${progress} / ${TOTAL_REQUESTS}` : "Run Performance Test"}
        </Button>
      </Card>

      {results.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Results</h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2 font-semibold">Endpoint</th>
                <th className="p-2 font-semibold">Description</th>
                <th className="p-2 font-semibold text-center">Average</th>
                <th className="p-2 font-semibold">Individual runs (ms)</th>
                <th className="p-2 font-semibold text-center">Errors</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.key} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-medium whitespace-nowrap">{s.label}</td>
                  <td className="p-2 text-slate-500">{s.description}</td>
                  <td className={`p-2 text-center font-mono font-semibold ${s.avg !== null ? avgColor(s.avg) : ""}`}>
                    {s.avg !== null ? `${s.avg.toFixed(0)} ms` : "—"}
                  </td>
                  <td className="p-2 font-mono text-slate-400 text-xs">
                    {s.times.map((t) => t.toFixed(0)).join(" · ")}
                  </td>
                  <td className="p-2 text-center">
                    {s.errors > 0 ? (
                      <span className="text-red-500 font-semibold">{s.errors}</span>
                    ) : (
                      <span className="text-green-500">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
