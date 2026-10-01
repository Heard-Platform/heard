import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from "recharts";

interface FlyerSwipeFunnelChartProps {
  opened: number;
  swipes: number[];
  saved: number;
  exited: number;
}

export function FlyerSwipeFunnelChart({ opened, swipes, saved, exited }: FlyerSwipeFunnelChartProps) {
  if (opened === 0) return null;

  const data = [
    { label: "Opened", users: opened, color: "#facc15" },
    ...swipes.map((users, i) => ({ label: `${i + 1} swipe${i === 0 ? "" : "s"}`, users, color: "#facc15" })),
    { label: "Saved spot", users: saved, color: "#10b981" },
    { label: "Exited", users: exited, color: "#94a3b8" },
  ];

  return (
    <ResponsiveContainer width={320} height={data.length * 28 + 16}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 72, bottom: 8, left: 0 }}>
        <XAxis type="number" hide domain={[0, opened]} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={96} />
        <Tooltip formatter={(value: number) => [value, "Users"]} />
        <Bar dataKey="users" radius={[0, 3, 3, 0]}>
          {data.map((step) => (
            <Cell key={step.label} fill={step.color} />
          ))}
          <LabelList
            dataKey="users"
            position="right"
            style={{ fontSize: 11 }}
            formatter={(value: number) => `${value} (${Math.round((value / opened) * 100)}%)`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
