import type { ReactNode } from "react";
import type { AttendeePhoneState } from "../../../types";

export const AGREE_COLOR = "#22c55e";
export const DISAGREE_COLOR = "#ef4444";
export const PASS_COLOR = "#cbd5e1";
export const ACCENT_COLOR = "#a855f7";
export const MUTED_BAR_COLOR = "#d8b4fe";

export const PHONE_STATE_COLORS: Record<AttendeePhoneState, string> = {
  swiping: ACCENT_COLOR,
  waiting: AGREE_COLOR,
  lobby: "#f59e0b",
  end: "#334155",
  idle: PASS_COLOR,
};

export const PHONE_STATE_LABELS: Record<AttendeePhoneState, string> = {
  swiping: "Swiping",
  waiting: "Waiting for the others",
  lobby: "Lobby",
  end: "End screen",
  idle: "Idle 30s+",
};

export function SupportPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="heard-card-bg space-y-3 rounded-2xl border p-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.08em] secondary-text">{title}</h2>
      {children}
    </section>
  );
}

export function SupportTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="heard-card-bg rounded-2xl border px-4 py-3">
      <p className="text-3xl font-extrabold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-sm secondary-text">{label}</p>
    </div>
  );
}

export function SupportChip({ children }: { children: ReactNode }) {
  return (
    <span className="pass-tint-bg whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold tabular-nums">
      {children}
    </span>
  );
}

export function SupportNote({ children }: { children: ReactNode }) {
  return <p className="text-xs secondary-text">{children}</p>;
}

export function ColorSwatch({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

export interface StackedBarSegment {
  key: string;
  percent: number;
  color: string;
}

export function StackedBar({ segments, label }: { segments: StackedBarSegment[]; label: string }) {
  return (
    <div role="img" aria-label={label} className="pass-tint-bg flex h-3 overflow-hidden rounded-full">
      {segments.map((segment) => (
        <span
          key={segment.key}
          className="h-full transition-[width] duration-700 ease-out"
          style={{ width: `${segment.percent}%`, backgroundColor: segment.color }}
        />
      ))}
    </div>
  );
}
