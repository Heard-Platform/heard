import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f1a393b4`;

interface AiUsageData {
  timeline: Array<{ date: string; [endpoint: string]: number | string }>;
  endpoints: string[];
  totals: {
    totalCalls: number;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
  };
}

const COLORS = [
  "#7c3aed",
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#65a30d",
  "#9333ea",
];

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function AiUsagePage() {
  const [data, setData] = useState<AiUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/public-ai-usage`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setData(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>

        <div style={{ marginBottom: 48 }}>
          <a
            href="/"
            style={{ fontSize: 14, color: "#6366f1", textDecoration: "none", marginBottom: 24, display: "inline-block" }}
          >
            ← heard.vote
          </a>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: "#0f172a", margin: "16px 0 12px" }}>
            AI Usage
          </h1>
          <p style={{ fontSize: 18, color: "#475569", lineHeight: 1.7, maxWidth: 680 }}>
            We are committed to responsible AI usage and transparency in all our business practices.
            Heard uses AI to help moderate content and surface insights from community conversations.
            This page shows our real-time API usage — tokens consumed by day and by endpoint — so you can see
            exactly how we're using these tools.
          </p>
        </div>

        {loading && (
          <p style={{ color: "#94a3b8", fontSize: 16 }}>Loading usage data...</p>
        )}

        {error && (
          <p style={{ color: "#dc2626", fontSize: 16 }}>Error: {error}</p>
        )}

        {data && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 48 }}>
              <StatCard label="Total API Calls" value={data.totals.totalCalls.toLocaleString()} />
              <StatCard label="Total Tokens" value={formatTokens(data.totals.totalTokens)} />
              <StatCard label="Input Tokens" value={formatTokens(data.totals.inputTokens)} />
              <StatCard label="Output Tokens" value={formatTokens(data.totals.outputTokens)} />
            </div>

            <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 32, marginBottom: 48 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>
                Token Usage by Day
              </h2>
              <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24 }}>
                Total tokens consumed per day, broken down by endpoint.
              </p>

              {data.timeline.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 14 }}>No usage recorded yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <AreaChart data={data.timeline} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                    <defs>
                      {data.endpoints.map((endpoint, i) => (
                        <linearGradient key={endpoint} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={formatTokens}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [formatTokens(value), name]}
                      labelFormatter={formatDate}
                      contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
                    />
                    {data.endpoints.map((endpoint, i) => (
                      <Area
                        key={endpoint}
                        type="monotone"
                        dataKey={endpoint}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        fill={`url(#grad-${i})`}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
              Data updates in real time. Tracking began June 2026.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
