import { Card } from "../ui/card";
import { LucideIcon } from "lucide-react";

interface StatBoxProps {
  icon: LucideIcon;
  value: number;
  label: string;
  gradientFrom: string;
  gradientTo: string;
}

export function StatBox({
  icon: Icon,
  value,
  label,
  gradientFrom,
  gradientTo,
}: StatBoxProps) {
  return (
    <Card
      className={`p-2 gap-2 bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white`}
    >
      <Icon className="w-4 h-4 opacity-80 mb-1" />
      <div className="text-lg leading-tight">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </Card>
  );
}