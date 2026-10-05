import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";

interface FlyerScreenFunnelChartProps {
  opened: number;
  emailAdded: number;
  returnedViaEmail: number;
  returnedOnMultipleDays: number;
}

export function FlyerScreenFunnelChart({
  opened,
  emailAdded,
  returnedViaEmail,
  returnedOnMultipleDays,
}: FlyerScreenFunnelChartProps) {
  if (opened === 0) return null;

  const data = [
    { label: "Loaded results page", users: opened },
    { label: "Added email", users: emailAdded },
    { label: "Returned via email", users: returnedViaEmail },
    { label: "Returned 2+ days (any way)", users: returnedOnMultipleDays },
  ];

  return (
    <ResponsiveContainer width={350} height={data.length * 28 + 16}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 72, bottom: 8, left: 0 }}>
        <XAxis type="number" hide domain={[0, opened]} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={150} />
        <Tooltip formatter={(value: number) => [value, "Users"]} />
        <Bar dataKey="users" fill="#EA580C" radius={[0, 3, 3, 0]}>
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
