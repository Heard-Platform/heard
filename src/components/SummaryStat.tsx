import { Card } from "./ui/card";

interface SummaryStatProps {
  label: string;
  value: number | string;
}

export function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  );
}
