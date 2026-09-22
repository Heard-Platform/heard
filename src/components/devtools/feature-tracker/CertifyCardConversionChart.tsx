import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface CertifyCardConversionChartProps {
  monthly: { month: string; shown: number; emailSubmitted: number }[];
}

const formatMonth = (month: string) => {
  const [year, monthNum] = month.split("-");
  const date = new Date(Date.UTC(Number(year), Number(monthNum) - 1, 1));
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
};

export function CertifyCardConversionChart({ monthly }: CertifyCardConversionChartProps) {
  const data = monthly.map((m) => ({
    month: formatMonth(m.month),
    shown: m.shown,
    rate: m.shown > 0 ? Math.round((m.emailSubmitted / m.shown) * 1000) / 10 : null,
  }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width={320} height={200}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="rate"
          orientation="left"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={32}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          yAxisId="shown"
          orientation="right"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          formatter={(value: number, name: string) =>
            name === "rate" ? [`${value}%`, "Conversion"] : [value, "Shown"]
          }
        />
        <Bar yAxisId="shown" dataKey="shown" fill="#c4b5fd" radius={[3, 3, 0, 0]} />
        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="rate"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ r: 3, fill: "#8b5cf6" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
