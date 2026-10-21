import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";

interface CreateRoomFunnelChartProps {
  opened: number;
  reviewed: number;
  created: number;
  shared: number;
}

export function CreateRoomFunnelChart({ opened, reviewed, created, shared }: CreateRoomFunnelChartProps) {
  if (opened === 0) return null;

  const data = [
    { label: "Opened", users: opened },
    { label: "Reached review", users: reviewed },
    { label: "Created", users: created },
    { label: "Shared link", users: shared },
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
