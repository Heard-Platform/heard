import { useState } from "react";
import {
  LineChart,
  Line,
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
    "votedPct" | "respondedPct" | "nonAnonPct" | "multiRoomPct" | "multiCommunityPct"
  >;
  countKey: keyof Pick<
    CohortFunnelEntry,
    "votedCount" | "respondedCount" | "nonAnonCount" | "multiRoomCount" | "multiCommunityCount"
  >;
  label: string;
  color: string;
}

const STAGES: Stage[] = [
  { key: "votedPct", countKey: "votedCount", label: "Voted", color: "#2a78d6" },
  { key: "respondedPct", countKey: "respondedCount", label: "Responded", color: "#eb6834" },
  { key: "nonAnonPct", countKey: "nonAnonCount", label: "Added email/phone", color: "#1baf7a" },
  { key: "multiRoomPct", countKey: "multiRoomCount", label: "Active in 2+ rooms", color: "#eda100" },
  { key: "multiCommunityPct", countKey: "multiCommunityCount", label: "Active in 2+ communities", color: "#e87ba4" },
];

const TEXT_PRIMARY = "#0b0b0b";
const TEXT_SECONDARY = "#52514e";
const TEXT_MUTED = "#898781";
const GRIDLINE = "#e1e0d9";
const BASELINE = "#c3c2b7";

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
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
      {STAGES.map((stage) => (
        <div
          key={stage.key}
          style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}
        >
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 2,
              background: stage.color,
            }}
          />
          <span style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: 600 }}>
            {entry[stage.key]}%
          </span>
          <span style={{ color: TEXT_SECONDARY, fontSize: 12 }}>
            {stage.label} ({entry[stage.countKey]})
          </span>
        </div>
      ))}

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
    <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2">
      {STAGES.map((stage) => (
        <div key={stage.key} className="flex items-center gap-1.5">
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 2,
              background: stage.color,
            }}
          />
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
        Each line is the % of that week's signups reaching a stage, in order of typical
        usage maturity. Stages overlap rather than strictly nest (e.g. a user can add an
        email without voting), so lines can cross.
      </p>

      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={cohorts} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke={GRIDLINE} />
          <XAxis
            dataKey="cohortLabel"
            tick={{ fontSize: 12, fill: TEXT_MUTED }}
            axisLine={{ stroke: BASELINE }}
            tickLine={false}
          />
          <YAxis
            domain={[0, "auto"]}
            tick={{ fontSize: 12, fill: TEXT_MUTED }}
            axisLine={{ stroke: BASELINE }}
            tickLine={false}
            width={44}
            unit="%"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: BASELINE, strokeWidth: 1 }} />
          {STAGES.map((stage) => (
            <Line
              key={stage.key}
              type="monotone"
              dataKey={stage.key}
              name={stage.label}
              stroke={stage.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: stage.color, stroke: "#fcfcfb", strokeWidth: 2 }}
            />
          ))}
        </LineChart>
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
                {STAGES.map((stage) => (
                  <th
                    key={stage.key}
                    className="text-right py-2 pr-3"
                    style={{ color: TEXT_SECONDARY }}
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
                  {STAGES.map((stage) => (
                    <td
                      key={stage.key}
                      className="py-2 pr-3 text-right"
                      style={{ color: TEXT_PRIMARY }}
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
