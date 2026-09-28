import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ClusterRecomputesChartProps {
  weekly: { weekStart: string; count: number }[];
}

const formatWeek = (weekStart: string) =>
  new Date(`${weekStart}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function ClusterRecomputesChart({ weekly }: ClusterRecomputesChartProps) {
  if (weekly.length === 0) return null;

  const data = weekly.map((w) => ({ week: formatWeek(w.weekStart), count: w.count }));

  return (
    <ResponsiveContainer width={320} height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
        <Tooltip formatter={(value: number) => [value, "Recomputes"]} />
        <Bar dataKey="count" fill="#818cf8" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
