import type { ReactNode } from "react";

export type ControlsBadgeTone = "neutral" | "live" | "paused";

const BADGE_TONE: Record<ControlsBadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  live: "heard-primary-gradient text-white",
  paused: "attention-bg attention-text",
};

interface ControlsFrameProps {
  badge: string;
  badgeTone: ControlsBadgeTone;
  position?: string;
  title: string;
  children?: ReactNode;
  controls?: ReactNode;
}

export function ControlsFrame({
  badge,
  badgeTone,
  position,
  title,
  children,
  controls,
}: ControlsFrameProps) {
  return (
    <div className="relative flex flex-col h-full w-full max-w-md mx-auto px-4 pt-4 pb-5 gap-4">
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 ${BADGE_TONE[badgeTone]}`}
        >
          {badgeTone === "live" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
          {badge}
        </span>
        {position && (
          <span className="text-sm font-semibold text-muted-foreground tabular-nums">{position}</span>
        )}
      </div>
      <h2 className="text-2xl font-bold text-foreground leading-tight">{title}</h2>
      <div className="flex flex-col gap-4 min-h-0 flex-1 overflow-y-auto -mx-1 px-1 -my-1 py-1">{children}</div>
      {controls && <div className="shrink-0">{controls}</div>}
    </div>
  );
}

export function ControlsStats({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map(({ value, label }) => (
        <div key={label} className="heard-card-bg rounded-xl px-3 py-2.5">
          <p className="text-2xl font-black text-foreground leading-none tabular-nums">{value}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
