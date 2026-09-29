import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { X, Activity, UserPlus } from "lucide-react";
import { api } from "../utils/api";
import type { WeeklySignupCount } from "../types";

const BAR_COLOR = "#2a78d6";
const TEXT_PRIMARY = "#0b0b0b";
const TEXT_SECONDARY = "#52514e";
const TEXT_MUTED = "#898781";
const GRIDLINE = "#e1e0d9";
const BASELINE = "#c3c2b7";

function SignupsTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const week: WeeklySignupCount = payload[0].payload;
  return (
    <div
      style={{
        background: "#fcfcfb",
        border: "1px solid rgba(11,11,11,0.10)",
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 2px 8px rgba(11,11,11,0.08)",
      }}
    >
      <p style={{ color: TEXT_SECONDARY, fontSize: 12, marginBottom: 2 }}>Week of {week.weekLabel}</p>
      <p style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: 600 }}>
        {week.signups} {week.signups === 1 ? "signup" : "signups"}
      </p>
    </div>
  );
}

function WeeklySignupsChart({ weeks }: { weeks: WeeklySignupCount[] }) {
  if (weeks.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No signups yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={weeks} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke={GRIDLINE} />
        <XAxis
          dataKey="weekLabel"
          tick={{ fontSize: 12, fill: TEXT_MUTED }}
          axisLine={{ stroke: BASELINE }}
          tickLine={false}
          minTickGap={16}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: TEXT_MUTED }}
          axisLine={{ stroke: BASELINE }}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<SignupsTooltip />} cursor={{ fill: GRIDLINE, opacity: 0.5 }} />
        <Bar dataKey="signups" name="Signups" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ActivityDashboardProps {
  onExit?: () => void;
}

export function ActivityDashboard({ onExit }: ActivityDashboardProps) {
  const [weeks, setWeeks] = useState<WeeklySignupCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      const res = await api.getWeeklySignups();
      if (!cancelled && res.success) {
        setWeeks(res.data?.weeks ?? []);
      }
      if (!cancelled) setLoading(false);
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalSignups = weeks.reduce((sum, week) => sum + week.signups, 0);

  return (
    <div className="heard-page-bg p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="heard-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl">Activity Dashboard</h1>
          </div>
          {onExit && (
            <Button variant="outline" onClick={onExit}>
              <X className="w-4 h-4 mr-2" />
              Exit
            </Button>
          )}
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Signups by Week
            </h2>
            <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
              Non-anonymous, non-developer users, bucketed by the week their user record was
              created (UTC, weeks start Monday).
              {!loading && ` ${totalSignups} total.`}
            </p>
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading signups...</p>
          ) : (
            <WeeklySignupsChart weeks={weeks} />
          )}
        </Card>
      </div>
    </div>
  );
}
