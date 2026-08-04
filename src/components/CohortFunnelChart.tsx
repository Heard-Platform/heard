import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CohortFunnelEntry } from "../types";

interface CohortFunnelChartProps {
  cohorts: CohortFunnelEntry[];
}

interface Stage {
  key: keyof Pick<
    CohortFunnelEntry,
    | "votedPct"
    | "respondedPct"
    | "nonAnonPct"
    | "multiRoomPct"
    | "multiCommunityPct"
    | "multiDayPct"
    | "multiWeekPct"
  >;
  countKey: keyof Pick<
    CohortFunnelEntry,
    | "votedCount"
    | "respondedCount"
    | "nonAnonCount"
    | "multiRoomCount"
    | "multiCommunityCount"
    | "multiDayCount"
    | "multiWeekCount"
  >;
  label: string;
  color: string;
  dashed?: boolean;
}

const FUNNEL_STAGES: Stage[] = [
  { key: "votedPct", countKey: "votedCount", label: "Voted", color: "#2a78d6" },
  { key: "respondedPct", countKey: "respondedCount", label: "Responded", color: "#eb6834" },
  { key: "nonAnonPct", countKey: "nonAnonCount", label: "Added email/phone", color: "#1baf7a" },
  { key: "multiRoomPct", countKey: "multiRoomCount", label: "Active in 2+ rooms", color: "#eda100" },
  { key: "multiCommunityPct", countKey: "multiCommunityCount", label: "Active in 2+ communities", color: "#e87ba4" },
];

const RETENTION_STAGES: Stage[] = [
  { key: "multiDayPct", countKey: "multiDayCount", label: "Active on 2+ days", color: "#008300", dashed: true },
  { key: "multiWeekPct", countKey: "multiWeekCount", label: "Active in 2+ weeks", color: "#4a3aa7", dashed: true },
];

const ALL_STAGES: Stage[] = [...FUNNEL_STAGES, ...RETENTION_STAGES];

const TEXT_PRIMARY = "#0b0b0b";
const TEXT_SECONDARY = "#52514e";
const TEXT_MUTED = "#898781";
const GRIDLINE = "#e1e0d9";
const BASELINE = "#c3c2b7";

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function LineSwatch({ color, dashed, width = 14 }: { color: string; dashed?: boolean; width?: number }) {
  return (
    <svg width={width} height={4} style={{ display: "block", flexShrink: 0 }}>
      <line
        x1={0}
        y1={2}
        x2={width}
        y2={2}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dashed ? "3 2" : undefined}
      />
    </svg>
  );
}

function StageRow({ stage, entry }: { stage: Stage; entry: CohortFunnelEntry }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
      <LineSwatch color={stage.color} dashed={stage.dashed} width={12} />
      <span style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: 600 }}>
        {entry[stage.key]}%
      </span>
      <span style={{ color: TEXT_SECONDARY, fontSize: 12 }}>
        {stage.label} ({entry[stage.countKey]})
      </span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const entry: CohortFunnelEntry = payload[0]?.payload;
  if (!entry) return null;

  return (
    <div
      style={{
        background: "#fcfcfb",
        border: "1px solid rgba(11,11,11,0.10)",
        borderRadius: 8,
        padding: "10px 12px",
        boxShadow: "0 2px 8px rgba(11,11,11,0.08)",
      }}
    >
      <p style={{ color: TEXT_SECONDARY, fontSize: 12, marginBottom: 6 }}>
        Cohort of {label} &middot; {entry.totalUsers} users
      </p>
      {FUNNEL_STAGES.map((stage) => (
        <StageRow key={stage.key} stage={stage} entry={entry} />
      ))}

      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${GRIDLINE}` }}>
        <p style={{ color: TEXT_SECONDARY, fontSize: 11, marginBottom: 4 }}>
          Return behavior
        </p>
        {RETENTION_STAGES.map((stage) => (
          <StageRow key={stage.key} stage={stage} entry={entry} />
        ))}
      </div>

      {entry.topPosts.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${GRIDLINE}` }}>
          <p style={{ color: TEXT_SECONDARY, fontSize: 11, marginBottom: 4 }}>
            Top posts that week
          </p>
          {entry.topPosts.map((post) => (
            <div key={post.id} style={{ marginTop: 3, maxWidth: 260 }}>
              <span style={{ color: TEXT_PRIMARY, fontSize: 12, fontWeight: 600 }}>
                {post.votes} votes
              </span>
              <span style={{ color: TEXT_SECONDARY, fontSize: 12 }}>
                {" "}
                &middot; {truncate(post.topic, 70)}
                {post.subHeard ? ` (${post.subHeard})` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-2">
      {FUNNEL_STAGES.map((stage) => (
        <div key={stage.key} className="flex items-center gap-1.5">
          <LineSwatch color={stage.color} dashed={stage.dashed} />
          <span style={{ color: TEXT_SECONDARY, fontSize: 12 }}>{stage.label}</span>
        </div>
      ))}

      <span style={{ color: BASELINE, fontSize: 12 }} aria-hidden>
        |
      </span>

      {RETENTION_STAGES.map((stage) => (
        <div key={stage.key} className="flex items-center gap-1.5">
          <LineSwatch color={stage.color} dashed={stage.dashed} />
          <span style={{ color: TEXT_SECONDARY, fontSize: 12 }}>{stage.label}</span>
        </div>
      ))}
    </div>
  );
}

export function CohortFunnelChart({ cohorts }: CohortFunnelChartProps) {
  const [showTable, setShowTable] = useState(false);

  if (cohorts.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Not enough signup data yet to build cohorts.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: TEXT_MUTED }}>
        Each solid line is the % of that week's signups reaching a stage, in order of
        typical usage maturity. Stages overlap rather than strictly nest (e.g. a user can
        add an email without voting), so lines can cross. The two dashed lines are a
        different kind of measure &mdash; return behavior, not maturity &mdash; showing the % who
        came back and used the app on more than one distinct day or week. The bars below
        show cohort size, so thin weeks can be read with appropriate skepticism.
      </p>

      <ResponsiveContainer width="100%" height={380}>
        <LineChart
          data={cohorts}
          syncId="cohort-funnel"
          margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke={GRIDLINE} />
          <XAxis dataKey="cohortLabel" tick={false} axisLine={{ stroke: BASELINE }} tickLine={false} />
          <YAxis
            domain={[0, "auto"]}
            tick={{ fontSize: 12, fill: TEXT_MUTED }}
            axisLine={{ stroke: BASELINE }}
            tickLine={false}
            width={44}
            unit="%"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: BASELINE, strokeWidth: 1 }} />
          {ALL_STAGES.map((stage) => (
            <Line
              key={stage.key}
              type="monotone"
              dataKey={stage.key}
              name={stage.label}
              stroke={stage.color}
              strokeWidth={2}
              strokeDasharray={stage.dashed ? "6 4" : undefined}
              dot={false}
              activeDot={{ r: 4, fill: stage.color, stroke: "#fcfcfb", strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <p style={{ color: TEXT_SECONDARY, fontSize: 11 }}>Cohort size (users joined that week)</p>

      <ResponsiveContainer width="100%" height={90}>
        <BarChart
          data={cohorts}
          syncId="cohort-funnel"
          margin={{ top: 0, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid vertical={false} stroke={GRIDLINE} />
          <XAxis
            dataKey="cohortLabel"
            tick={{ fontSize: 12, fill: TEXT_MUTED }}
            axisLine={{ stroke: BASELINE }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: TEXT_MUTED }}
            axisLine={{ stroke: BASELINE }}
            tickLine={false}
            width={44}
          />
          <Tooltip content={() => null} cursor={{ fill: GRIDLINE, opacity: 0.5 }} />
          <Bar dataKey="totalUsers" name="Cohort size" fill={BASELINE} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <Legend />

      <div className="flex justify-center">
        <button
          onClick={() => setShowTable((v) => !v)}
          className="text-xs underline"
          style={{ color: TEXT_SECONDARY }}
        >
          {showTable ? "Hide" : "Show"} table view
        </button>
      </div>

      {showTable && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: GRIDLINE }}>
                <th className="text-left py-2 pr-3" style={{ color: TEXT_SECONDARY }}>
                  Cohort
                </th>
                <th className="text-right py-2 pr-3" style={{ color: TEXT_SECONDARY }}>
                  Users
                </th>
                {FUNNEL_STAGES.map((stage) => (
                  <th
                    key={stage.key}
                    className="text-right py-2 pr-3"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    {stage.label}
                  </th>
                ))}
                {RETENTION_STAGES.map((stage, i) => (
                  <th
                    key={stage.key}
                    className="text-right py-2 pr-3"
                    style={{
                      color: TEXT_SECONDARY,
                      borderLeft: i === 0 ? `1px dashed ${GRIDLINE}` : undefined,
                    }}
                  >
                    {stage.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((entry) => (
                <tr key={entry.cohortStart} className="border-b" style={{ borderColor: GRIDLINE }}>
                  <td className="py-2 pr-3" style={{ color: TEXT_PRIMARY }}>
                    {entry.cohortLabel}
                  </td>
                  <td className="py-2 pr-3 text-right" style={{ color: TEXT_PRIMARY }}>
                    {entry.totalUsers}
                  </td>
                  {FUNNEL_STAGES.map((stage) => (
                    <td
                      key={stage.key}
                      className="py-2 pr-3 text-right"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      {entry[stage.key]}% ({entry[stage.countKey]})
                    </td>
                  ))}
                  {RETENTION_STAGES.map((stage, i) => (
                    <td
                      key={stage.key}
                      className="py-2 pr-3 text-right"
                      style={{
                        color: TEXT_PRIMARY,
                        borderLeft: i === 0 ? `1px dashed ${GRIDLINE}` : undefined,
                      }}
                    >
                      {entry[stage.key]}% ({entry[stage.countKey]})
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
