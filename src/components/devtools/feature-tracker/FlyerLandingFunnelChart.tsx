import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";

interface FlyerLandingFunnelChartProps {
  opened: number;
  submitted: number;
  lookedAround: number;
}

export function FlyerLandingFunnelChart({ opened, submitted, lookedAround }: FlyerLandingFunnelChartProps) {
  if (opened === 0) return null;

  const data = [
    { label: "Opened", users: opened },
    { label: "Submitted email", users: submitted },
    { label: "Looked around", users: lookedAround },
  ];

  return (
    <ResponsiveContainer width={320} height={data.length * 28 + 16}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 72, bottom: 8, left: 0 }}>
        <XAxis type="number" hide domain={[0, opened]} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={104} />
        <Tooltip formatter={(value: number) => [value, "Users"]} />
        <Bar dataKey="users" fill="#16A34A" radius={[0, 3, 3, 0]}>
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
