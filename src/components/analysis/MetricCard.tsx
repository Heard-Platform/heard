import { Card } from "../ui/card";

interface MetricCardProps {
  viz: "dots";
  label: string;
  description: string;
  filled: number;
  total: number;
  filledColor?: string;
}

export function MetricCard({ label, description, filled, total, filledColor }: MetricCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="flex flex-wrap gap-0.5 mb-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 min-w-1.5 rounded-full ${i < filled ? (filledColor ?? "positive-bg") : "bg-muted"}`}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </Card>
  );
}
