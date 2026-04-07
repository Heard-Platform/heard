import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { AVATAR_OPTIONS } from "../../../utils/constants/avatars";

interface AvatarAnimalChartProps {
  counts: Record<string, number>;
}

export function AvatarAnimalChart({ counts }: AvatarAnimalChartProps) {
  const data = AVATAR_OPTIONS
    .map((a) => ({ name: a.label, count: counts[a.value] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <ResponsiveContainer width={220} height={160}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "transparent" }} formatter={(v) => [v, "Users"]} />
        <Bar dataKey="count" fill="#84cc16" radius={[0, 4, 4, 0]}>
          <LabelList dataKey="count" position="right" style={{ fontSize: 11 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
