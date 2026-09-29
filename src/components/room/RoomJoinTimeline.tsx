import { useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ParticipantJoin } from "./RoomAnalyticsModal";
import { buildJoinTimeline, type JoinTimelineBucket } from "./join-timeline";

const NAMED_COLOR = "#2a78d6";
const ANONYMOUS_COLOR = "#8a8a8a";

const CHART_CLASS_NAME =
  "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-cartesian-axis-line]:stroke-border";

const X_AXIS_PROPS = {
  dataKey: "label",
  tick: { fontSize: 11 },
  tickLine: false,
  interval: "preserveStartEnd" as const,
  minTickGap: 24,
};

function Swatch({ color }: { color: string }) {
  return <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />;
}

function TooltipCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border bg-popover text-popover-foreground px-3 py-2 text-xs shadow-md space-y-1">
      {children}
    </div>
  );
}

function JoinsTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const bucket: JoinTimelineBucket = payload[0].payload;
  return (
    <TooltipCard>
      <p className="text-muted-foreground">{bucket.label}</p>
      <p className="flex items-center gap-1.5">
        <Swatch color={NAMED_COLOR} />
        {bucket.named} non-anonymous
      </p>
      <p className="flex items-center gap-1.5">
        <Swatch color={ANONYMOUS_COLOR} />
        {bucket.anonymous} anonymous
      </p>
    </TooltipCard>
  );
}

function AnonymousShareTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const bucket: JoinTimelineBucket = payload[0].payload;
  return (
    <TooltipCard>
      <p className="text-muted-foreground">{bucket.label}</p>
      <p>
        {bucket.anonymousPctSoFar}% anonymous · {100 - bucket.anonymousPctSoFar}% non-anonymous
      </p>
      <p className="text-muted-foreground">
        of {bucket.totalSoFar} {bucket.totalSoFar === 1 ? "participant" : "participants"} so far
      </p>
    </TooltipCard>
  );
}

function JoinsChart({ buckets }: { buckets: JoinTimelineBucket[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-1">New participants</h3>
      <p className="text-xs text-muted-foreground mb-2">
        When each person first posted or voted
      </p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1.5">
          <Swatch color={NAMED_COLOR} />
          Non-anonymous
        </span>
        <span className="flex items-center gap-1.5">
          <Swatch color={ANONYMOUS_COLOR} />
          Anonymous
        </span>
      </div>
      <div className={CHART_CLASS_NAME}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={buckets} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis {...X_AXIS_PROPS} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
            <Tooltip content={<JoinsTooltip />} cursor={{ fill: "currentColor", opacity: 0.06 }} />
            <Bar dataKey="named" stackId="joins" fill={NAMED_COLOR} />
            <Bar dataKey="anonymous" stackId="joins" fill={ANONYMOUS_COLOR} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AnonymousShareChart({ buckets }: { buckets: JoinTimelineBucket[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-1">Anonymous share</h3>
      <p className="text-xs text-muted-foreground mb-2">
        Percent of all participants so far who are anonymous
      </p>
      <div className={CHART_CLASS_NAME}>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={buckets} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis {...X_AXIS_PROPS} />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              unit="%"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<AnonymousShareTooltip />} cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }} />
            <Line
              type="stepAfter"
              dataKey="anonymousPctSoFar"
              stroke={ANONYMOUS_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: ANONYMOUS_COLOR, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function JoinTimelineTable({ buckets }: { buckets: JoinTimelineBucket[] }) {
  const rows = buckets.filter((bucket) => bucket.named + bucket.anonymous > 0);
  return (
    <div className="max-h-60 overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="text-muted-foreground">
          <tr className="border-b">
            <th className="text-left font-normal py-1.5">Period</th>
            <th className="text-right font-normal py-1.5">Non-anon</th>
            <th className="text-right font-normal py-1.5">Anon</th>
            <th className="text-right font-normal py-1.5">Anon % so far</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((bucket) => (
            <tr key={bucket.startsAt} className="border-b last:border-0">
              <td className="py-1.5">{bucket.label}</td>
              <td className="text-right py-1.5">{bucket.named}</td>
              <td className="text-right py-1.5">{bucket.anonymous}</td>
              <td className="text-right py-1.5">{bucket.anonymousPctSoFar}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RoomJoinTimeline({ joins }: { joins: ParticipantJoin[] }) {
  const [showTable, setShowTable] = useState(false);
  const buckets = buildJoinTimeline(joins);

  if (buckets.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        No participant data yet.
      </div>
    );
  }

  return (
    <div className="py-2 space-y-6">
      <JoinsChart buckets={buckets} />
      <AnonymousShareChart buckets={buckets} />
      <div className="pt-3 border-t space-y-3">
        <button
          type="button"
          onClick={() => setShowTable((shown) => !shown)}
          className="text-xs text-muted-foreground underline"
        >
          {showTable ? "Hide" : "Show"} table view
        </button>
        {showTable && <JoinTimelineTable buckets={buckets} />}
      </div>
    </div>
  );
}
