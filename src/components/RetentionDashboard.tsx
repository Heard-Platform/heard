import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { X, TrendingUp } from "lucide-react";
import { api } from "../utils/api";
import type { CohortFunnelEntry } from "../types";
import { CohortFunnelChart } from "./CohortFunnelChart";

type CohortMode = "joined" | "active";
type TimeFrame = "1m" | "3m" | "6m" | "all";

const TIME_FRAME_OPTIONS: { value: TimeFrame; label: string }[] = [
  { value: "1m", label: "Last month" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "all", label: "All time" },
];

function getCutoffTimestamp(timeFrame: TimeFrame): number | null {
  if (timeFrame === "all") return null;
  const months = timeFrame === "1m" ? 1 : timeFrame === "3m" ? 3 : 6;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return cutoff.getTime();
}

interface RetentionDashboardProps {
  onExit?: () => void;
}

export function RetentionDashboard({ onExit }: RetentionDashboardProps) {
  const [cohorts, setCohorts] = useState<CohortFunnelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cohortMode, setCohortMode] = useState<CohortMode>("active");
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1m");

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      const cutoff = getCutoffTimestamp(timeFrame);
      const res = await api.getCohortFunnel(cohortMode, cutoff ?? undefined);
      if (!cancelled && res.success) {
        setCohorts(res.data?.cohorts ?? []);
      }
      if (!cancelled) setLoading(false);
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [cohortMode, timeFrame]);

  const latestCohort = cohorts.length > 0 ? cohorts[cohorts.length - 1] : null;

  return (
    <div className="heard-page-bg p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="heard-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl">Retention Dashboard</h1>
          </div>
          {onExit && (
            <Button variant="outline" onClick={onExit}>
              <X className="w-4 h-4 mr-2" />
              Exit
            </Button>
          )}
        </div>

        {!loading && latestCohort && (
          <Card className="p-6 bg-gradient-to-br from-orange-50/50 to-amber-50/50 border-orange-100">
            <p className="text-sm text-muted-foreground mb-1">
              Active users &mdash; week of {latestCohort.cohortLabel}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Users who returned on more than one day during that same week, out of{" "}
              {latestCohort.totalUsers} {cohortMode === "joined" ? "users who joined" : "users active"} that week
            </p>
            <p className="text-3xl mb-2">
              {latestCohort.activeThisWeekCount}{" "}
              <span className="text-lg text-muted-foreground">
                ({latestCohort.activeThisWeekPct}%)
              </span>
            </p>
          </Card>
        )}

        <Card className="p-6">
          <div className="heard-between mb-4">
            <h2 className="text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Cohort Funnel by {cohortMode === "joined" ? "Join Week" : "Activity Week"}
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Button
                  variant={cohortMode === "joined" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCohortMode("joined")}
                >
                  Joined that week
                </Button>
                <Button
                  variant={cohortMode === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCohortMode("active")}
                >
                  Active that week
                </Button>
              </div>
              <Select value={timeFrame} onValueChange={(value: string) => setTimeFrame(value as TimeFrame)}>
                <SelectTrigger size="sm" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FRAME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading cohorts...</p>
          ) : (
            <CohortFunnelChart cohorts={cohorts} cohortMode={cohortMode} />
          )}
        </Card>
      </div>
    </div>
  );
}
