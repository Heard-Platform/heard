import { useState, type ReactNode } from "react";
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
import type { CohortFunnelEntry, CohortVoteBucket } from "../types";

interface CohortFunnelChartProps {
  cohorts: CohortFunnelEntry[];
  cohortMode?: "joined" | "active";
}

interface Stage {
  key: keyof Pick<
    CohortFunnelEntry,
    | "multiPostViewPct"
    | "votedPct"
    | "moreThanFiveVotesPct"
    | "respondedPct"
    | "createdRoomPct"
    | "nonAnonPct"
    | "multiRoomPct"
    | "multiCommunityPct"
    | "multiDayPct"
    | "multiWeekPct"
    | "activeThisWeekPct"
  >;
  countKey: keyof Pick<
    CohortFunnelEntry,
    | "multiPostViewCount"
    | "votedCount"
    | "moreThanFiveVotesCount"
    | "respondedCount"
    | "createdRoomCount"
    | "nonAnonCount"
    | "multiRoomCount"
    | "multiCommunityCount"
    | "multiDayCount"
    | "multiWeekCount"
    | "activeThisWeekCount"
  >;
  label: string;
  color: string;
  dashed?: boolean;
}

const FUNNEL_STAGES: Stage[] = [
  { key: "multiPostViewPct", countKey: "multiPostViewCount", label: "Viewed 2+ posts", color: "#e34948" },
  { key: "votedPct", countKey: "votedCount", label: "Voted", color: "#2a78d6" },
  { key: "moreThanFiveVotesPct", countKey: "moreThanFiveVotesCount", label: "Cast 6+ votes", color: "#1e3a8a" },
  { key: "respondedPct", countKey: "respondedCount", label: "Responded", color: "#eb6834" },
  { key: "createdRoomPct", countKey: "createdRoomCount", label: "Created a post", color: "#8b5cf6" },
  { key: "nonAnonPct", countKey: "nonAnonCount", label: "Has email/phone", color: "#1baf7a" },
  { key: "multiRoomPct", countKey: "multiRoomCount", label: "Active in 2+ rooms", color: "#eda100" },
  { key: "multiCommunityPct", countKey: "multiCommunityCount", label: "Active in 2+ communities", color: "#e87ba4" },
];

const RETENTION_STAGES: Stage[] = [
  { key: "multiDayPct", countKey: "multiDayCount", label: "Active on 2+ days", color: "#008300", dashed: true },
  { key: "multiWeekPct", countKey: "multiWeekCount", label: "Active in 2+ weeks", color: "#4a3aa7", dashed: true },
  { key: "activeThisWeekPct", countKey: "activeThisWeekCount", label: "Active 2+ days that week", color: "#c2410c", dashed: true },
];

const ALL_STAGES: Stage[] = [...FUNNEL_STAGES, ...RETENTION_STAGES];

const VOTE_BUCKETS_LABEL = "Votes cast that week";
const VOTE_BUCKET_COLORS = ["#c9e4e9", "#8fc7d1", "#4fa3b3", "#1b7a91", "#0b4a5e"];

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

function voteBucketLabel(label: string): string {
  return `${label} ${label === "1" ? "vote" : "votes"}`;
}

function TableHeader({ divided, children }: { divided?: boolean; children: ReactNode }) {
  return (
    <th
      className="text-right py-2 pr-3"
      style={{
        color: TEXT_SECONDARY,
        borderLeft: divided ? `1px dashed ${GRIDLINE}` : undefined,
      }}
    >
      {children}
    </th>
  );
}

function TableCell({ pct, count, divided }: { pct: number; count: number; divided?: boolean }) {
  return (
    <td
      className="py-2 pr-3 text-right"
      style={{
        color: TEXT_PRIMARY,
        borderLeft: divided ? `1px dashed ${GRIDLINE}` : undefined,
      }}
    >
      {pct}% ({count})
    </td>
  );
}

function BucketSwatch({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
      <rect x={0} y={0} width={size} height={size} rx={2} fill={color} />
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

function BucketRow({ bucket, color }: { bucket: CohortVoteBucket; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
      <BucketSwatch color={color} />
      <span style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: 600 }}>
        {bucket.pct}%
      </span>
      <span style={{ color: TEXT_SECONDARY, fontSize: 12 }}>
        {voteBucketLabel(bucket.label)} ({bucket.count})
      </span>
    </div>
  );
}

function CustomTooltip({ active, payload, label, hiddenStages }: any) {
  if (!active || !payload || !payload.length) return null;
  const entry: CohortFunnelEntry = payload[0]?.payload;
  if (!entry) return null;

  const visibleFunnelStages = FUNNEL_STAGES.filter((stage) => !hiddenStages.has(stage.key));
  const visibleRetentionStages = RETENTION_STAGES.filter((stage) => !hiddenStages.has(stage.key));

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
      {visibleFunnelStages.map((stage) => (
        <StageRow key={stage.key} stage={stage} entry={entry} />
      ))}

      {visibleRetentionStages.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${GRIDLINE}` }}>
          <p style={{ color: TEXT_SECONDARY, fontSize: 11, marginBottom: 4 }}>
            Return behavior
          </p>
          {visibleRetentionStages.map((stage) => (
            <StageRow key={stage.key} stage={stage} entry={entry} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${GRIDLINE}` }}>
        <p style={{ color: TEXT_SECONDARY, fontSize: 11, marginBottom: 4 }}>
          {VOTE_BUCKETS_LABEL} ({entry.votesThisWeekCount} total)
        </p>
        {entry.voteBuckets.map((bucket, i) => (
          <BucketRow key={bucket.label} bucket={bucket} color={VOTE_BUCKET_COLORS[i]} />
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

function LegendItem({
  label,
  color,
  dashed,
  isHidden,
  onToggle,
}: {
  label: string;
  color: string;
  dashed?: boolean;
  isHidden: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={!isHidden}
      className="flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
      style={{ opacity: isHidden ? 0.35 : 1 }}
    >
      <LineSwatch color={color} dashed={dashed} />
      <span
        style={{
          color: TEXT_SECONDARY,
          fontSize: 12,
          textDecoration: isHidden ? "line-through" : undefined,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function Legend({
  hiddenStages,
  onToggleStage,
}: {
  hiddenStages: Set<string>;
  onToggleStage: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-2">
      {FUNNEL_STAGES.map((stage) => (
        <LegendItem
          key={stage.key}
          label={stage.label}
          color={stage.color}
          dashed={stage.dashed}
          isHidden={hiddenStages.has(stage.key)}
          onToggle={() => onToggleStage(stage.key)}
        />
      ))}

      <span style={{ color: BASELINE, fontSize: 12 }} aria-hidden>
        |
      </span>

      {RETENTION_STAGES.map((stage) => (
        <LegendItem
          key={stage.key}
          label={stage.label}
          color={stage.color}
          dashed={stage.dashed}
          isHidden={hiddenStages.has(stage.key)}
          onToggle={() => onToggleStage(stage.key)}
        />
      ))}
    </div>
  );
}

export function CohortFunnelChart({ cohorts, cohortMode = "joined" }: CohortFunnelChartProps) {
  const [showTable, setShowTable] = useState(false);
  const [hiddenStages, setHiddenStages] = useState<Set<string>>(new Set());
  const cohortNoun = cohortMode === "joined" ? "signups" : "active users";

  const toggleStage = (key: string) => {
    setHiddenStages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (cohorts.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Not enough {cohortMode === "joined" ? "signup" : "activity"} data yet to build cohorts.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: TEXT_MUTED }}>
        Each solid line is the % of that week's {cohortNoun} reaching a stage, in order of
        typical usage maturity. Stages overlap rather than strictly nest (e.g. a user can
        add an email without voting), so lines can cross. The three dashed lines are a
        different kind of measure &mdash; return behavior, not maturity &mdash; showing the % who
        came back and used the app on more than one distinct day or week, including the % who
        were active on more than one day within that same cohort week ("active users"). The
        stacked bars below split each cohort by how many votes each user cast during that
        cohort week, with 0 and 1 kept as their own buckets. The last bars show cohort size, so
        thin weeks can be read with appropriate skepticism.
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
          <Tooltip
            content={(props) => <CustomTooltip {...props} hiddenStages={hiddenStages} />}
            cursor={{ stroke: BASELINE, strokeWidth: 1 }}
            wrapperStyle={{ zIndex: 10 }}
          />
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
              hide={hiddenStages.has(stage.key)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p style={{ color: TEXT_SECONDARY, fontSize: 11 }}>{VOTE_BUCKETS_LABEL}</p>
        {cohorts[0].voteBuckets.map((bucket, i) => (
          <span key={bucket.label} className="flex items-center gap-1">
            <BucketSwatch color={VOTE_BUCKET_COLORS[i]} size={8} />
            <span style={{ color: TEXT_SECONDARY, fontSize: 11 }}>{bucket.label}</span>
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={110}>
        <BarChart
          data={cohorts}
          syncId="cohort-funnel"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke={GRIDLINE} />
          <XAxis dataKey="cohortLabel" tick={false} axisLine={{ stroke: BASELINE }} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tick={{ fontSize: 10, fill: TEXT_MUTED }}
            axisLine={{ stroke: BASELINE }}
            tickLine={false}
            width={44}
            unit="%"
          />
          <Tooltip content={() => null} cursor={{ fill: GRIDLINE, opacity: 0.5 }} />
          {cohorts[0].voteBuckets.map((bucket, i) => (
            <Bar
              key={bucket.label}
              dataKey={(entry: CohortFunnelEntry) => entry.voteBuckets[i]?.pct ?? 0}
              name={`${bucket.label} votes`}
              stackId="vote-buckets"
              fill={VOTE_BUCKET_COLORS[i]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <p style={{ color: TEXT_SECONDARY, fontSize: 11 }}>
        Cohort size ({cohortMode === "joined" ? "users joined" : "users active"} that week)
      </p>

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

      <Legend hiddenStages={hiddenStages} onToggleStage={toggleStage} />

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
                  <TableHeader key={stage.key}>{stage.label}</TableHeader>
                ))}
                {RETENTION_STAGES.map((stage, i) => (
                  <TableHeader key={stage.key} divided={i === 0}>
                    {stage.label}
                  </TableHeader>
                ))}
                {cohorts[0].voteBuckets.map((bucket, i) => (
                  <TableHeader key={bucket.label} divided={i === 0}>
                    {voteBucketLabel(bucket.label)} that week
                  </TableHeader>
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
                    <TableCell key={stage.key} pct={entry[stage.key]} count={entry[stage.countKey]} />
                  ))}
                  {RETENTION_STAGES.map((stage, i) => (
                    <TableCell
                      key={stage.key}
                      pct={entry[stage.key]}
                      count={entry[stage.countKey]}
                      divided={i === 0}
                    />
                  ))}
                  {entry.voteBuckets.map((bucket, i) => (
                    <TableCell
                      key={bucket.label}
                      pct={bucket.pct}
                      count={bucket.count}
                      divided={i === 0}
                    />
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
