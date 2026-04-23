import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { RefreshCw } from "lucide-react";
import { devApi } from "../../utils/dev-api";
import { VoteStats } from "../../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const VOTE_TYPE_LABELS: Record<string, string> = {
  agree: "Agree",
  disagree: "Disagree",
  pass: "Unsure",
  super_agree: "Super Agree",
};

const VOTE_TYPE_COLORS: Record<string, string> = {
  agree: "agree-bg",
  disagree: "disagree-bg",
  pass: "pass-bg",
  super_agree: "super-agree-bg",
};

const DISTRIBUTION_ORDER = ["1", "2–5", "6–10", "11–20", "21–50", "51–100", "100+"];

export function VoteStatsTab() {
  const [stats, setStats] = useState<VoteStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await devApi.getVoteStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching vote stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 secondary-text-strong">
        Loading vote stats...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12 secondary-text-strong">
        Failed to load vote stats.
      </div>
    );
  }

  const distData = DISTRIBUTION_ORDER.map((bucket) => ({
    bucket,
    users: stats.distributionByUser[bucket] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Vote Statistics</h2>
        <Button onClick={load} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <p className="text-xs text-slate-400">
        Includes every vote in the database — test users and scalability data are not filtered out.
      </p>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 space-y-1">
          <p className="text-xs secondary-text uppercase tracking-wider">Total Votes</p>
          <p className="text-3xl font-bold">{stats.total.toLocaleString()}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs secondary-text uppercase tracking-wider">Unique Voters</p>
          <p className="text-3xl font-bold">{stats.uniqueVoters.toLocaleString()}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs secondary-text uppercase tracking-wider">Avg Votes / User</p>
          <p className="text-3xl font-bold">{stats.avgVotesPerUser}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-sm font-semibold header-3 mb-4">By Vote Type</h3>
          <div className="space-y-3">
            {Object.entries(stats.byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700">{VOTE_TYPE_LABELS[type] ?? type}</span>
                      <span className="font-mono text-slate-500">
                        {count.toLocaleString()}{" "}
                        <span className="text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${VOTE_TYPE_COLORS[type] ?? "bg-slate-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Votes per User Distribution
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={distData} barCategoryGap="20%">
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), "users"]}
                labelFormatter={(label) => `${label} votes`}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="users" radius={[3, 3, 0, 0]}>
                {distData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={`hsl(${220 + i * 10}, 60%, ${55 - i * 3}%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 text-center mt-1">votes per user</p>
        </Card>
      </div>
    </div>
  );
}
