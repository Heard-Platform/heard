import { Card } from "./ui/card";
import { User } from "lucide-react";
import { SparklineChart } from "./SparklineChart";
import { ActivityMetricBox } from "./ActivityMetricBox";

interface ActivityMetrics {
  dau: number;
  wau: number;
  mau: number;
  dailyBreakdown: Array<{ date: string; activeUsers: number }>;
  calculatedAt: string;
}

interface ActivityMetricsProps {
  metrics: ActivityMetrics;
}

export function ActivityMetrics({ metrics }: ActivityMetricsProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <h2 className="text-xl mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-blue-600" />
        User Activity Metrics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ActivityMetricBox type="dau" value={metrics.dau} />
        <ActivityMetricBox type="wau" value={metrics.wau} />
        <ActivityMetricBox type="mau" value={metrics.mau} />
      </div>
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <p className="text-sm text-muted-foreground mb-3">Daily Activity (Last 30 Days)</p>
        <div className="h-24">
          <SparklineChart 
            data={metrics.dailyBreakdown.map((day, i) => ({
              day: i,
              count: day.activeUsers,
              timestamp: new Date(day.date).getTime()
            }))}
            color="#2563eb"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Calculated at: {new Date(metrics.calculatedAt).toLocaleString()}
        </p>
      </div>
    </Card>
  );
}