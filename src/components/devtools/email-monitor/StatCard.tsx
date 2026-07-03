import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  tone?: "critical";
  icon?: ReactNode;
}

export function StatCard({ label, value, tone, icon }: StatCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 text-sm secondary-text mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-semibold ${tone === "critical" ? "error-text" : "text-slate-900"}`}>
        {value}
      </div>
    </div>
  );
}
