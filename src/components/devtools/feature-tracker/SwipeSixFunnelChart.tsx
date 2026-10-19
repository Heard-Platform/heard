import moment from "moment-timezone";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell, CartesianGrid } from "recharts";
import type { FeatureResults } from "../../../types";

interface SwipeSixFunnelChartProps {
  funnel: FeatureResults["swipeSixFunnel"];
  daily: FeatureResults["swipeSixDailyCompletions"];
}

export function SwipeSixFunnelChart({ funnel, daily }: SwipeSixFunnelChartProps) {
  if (funnel.bannerShown === 0) return null;

  const steps = [
    { label: "Saw banner", users: funnel.bannerShown, color: "var(--color-yellow-400)" },
    { label: "Started", users: funnel.started, color: "var(--color-yellow-400)" },
    ...funnel.swipes.map((users, i) => ({ label: `${i + 1} swipe${i === 0 ? "" : "s"}`, users, color: "var(--color-yellow-400)" })),
    { label: "Completed", users: funnel.completed, color: "var(--color-emerald-500)" },
    { label: "All done", users: funnel.allDoneClicked, color: "var(--color-slate-400)" },
  ];
  const days = daily.map((d) => ({ day: moment.utc(d.date).format("M/D"), count: d.count }));

  return (
    <div className="space-y-3">
      <ResponsiveContainer width={320} height={steps.length * 28 + 16}>
        <BarChart data={steps} layout="vertical" margin={{ top: 8, right: 72, bottom: 8, left: 0 }}>
          <XAxis type="number" hide domain={[0, funnel.bannerShown]} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={96} />
          <Tooltip formatter={(value: number) => [value, "Users"]} />
          <Bar dataKey="users" radius={[0, 3, 3, 0]}>
            {steps.map((step) => (
              <Cell key={step.label} fill={step.color} />
            ))}
            <LabelList
              dataKey="users"
              position="right"
              style={{ fontSize: 11 }}
              formatter={(value: number) => `${value} (${Math.round((value / funnel.bannerShown) * 100)}%)`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div>
        <p className="text-xs text-muted-foreground">Completions per day</p>
        <ResponsiveContainer width={320} height={160}>
          <BarChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-gray-200)" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip formatter={(value: number) => [value, "Completions"]} />
            <Bar dataKey="count" fill="var(--color-emerald-500)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
