import { LineChart, Line, ResponsiveContainer, YAxis, XAxis } from "recharts";

interface SparklineData {
  day: number;
  count: number;
  timestamp: number;
}

interface SparklineChartProps {
  data: SparklineData[];
  color: string;
  height?: number;
}

export function SparklineChart({ data, color, height = 50 }: SparklineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <XAxis dataKey="day" hide />
        <YAxis 
          domain={[0, 'auto']} 
          ticks={[0, 5, 10, 15, 20]}
          width={30}
          tick={{ fontSize: 10 }}
          allowDataOverflow={false}
          includeHidden
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke={color} 
          strokeWidth={2} 
          dot={false}
          label={{ fontSize: 10, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
