import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatWeekStart } from "../../../utils/time";

interface VotesPerSessionChartProps {
  weekly: { weekStart: string; averageVotes: number; sessions: number }[];
}

export function VotesPerSessionChart({ weekly }: VotesPerSessionChartProps) {
  if (weekly.length === 0) return null;

  const data = weekly.map((w) => ({ week: formatWeekStart(w.weekStart), averageVotes: w.averageVotes, sessions: w.sessions }));

  return (
    <ResponsiveContainer width={320} height={200}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="average" orientation="left" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
        <YAxis yAxisId="sessions" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
        <Tooltip
          formatter={(value: number, name: string) =>
            name === "averageVotes" ? [value, "Avg votes / session"] : [value, "Sessions"]
          }
        />
        <Bar yAxisId="sessions" dataKey="sessions" fill="#c7d2fe" radius={[3, 3, 0, 0]} />
        <Line yAxisId="average" type="monotone" dataKey="averageVotes" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: "#6366f1" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
