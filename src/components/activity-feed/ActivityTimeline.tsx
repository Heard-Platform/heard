import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { ActivityDayCount, ActivityFeedEventType } from "../../types";

const TYPE_LABEL: Record<ActivityFeedEventType, string> = {
  user: "User", session: "Session", room: "Room", community: "Community",
  statement: "Statement", vote: "Vote", modInviteAccept: "Mod Invite Accept",
  cohost: "Co-host", askTheData: "Ask the Data", userReport: "Report",
};

// Validated categorical palette — fixed order, CVD-safe, worst adjacent ΔE 24.2
const SERIES_COLOR: Record<ActivityFeedEventType, string> = {
  user:            "#2a78d6", // slot 1 blue
  session:         "#1baf7a", // slot 2 aqua
  room:            "#eda100", // slot 3 yellow
  community:       "#008300", // slot 4 green
  statement:       "#4a3aa7", // slot 5 violet
  vote:            "#e34948", // slot 6 red
  modInviteAccept: "#e87ba4", // slot 7 magenta
  cohost:          "#eb6834", // slot 8 orange
  askTheData:      "#2a78d6", // folds to slot 1 (shown only if data exists)
  userReport:      "#e34948", // folds to slot 6 (shown only if data exists)
};

interface ActivityTimelineProps {
  dayCounts: ActivityDayCount[];
}

export function ActivityTimeline({ dayCounts }: ActivityTimelineProps) {
  const allTypes = Object.keys(TYPE_LABEL) as ActivityFeedEventType[];
  const activeTypes = allTypes.filter((t) =>
    dayCounts.some((d) => (d[t] ?? 0) > 0),
  );
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggleType = (dataKey: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(dataKey) ? next.delete(dataKey) : next.add(dataKey);
      return next;
    });
  };

  return (
    <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", padding: "20px 24px" }}>
      <p style={{ fontSize: "12px", fontWeight: 600, color: "#52514e", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Activity by day (last 7 days)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={dayCounts} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#e1e0d9" strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#898781" }}
            axisLine={{ stroke: "#c3c2b7" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#898781" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, border: "1px solid #e1e0d9", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            labelStyle={{ fontWeight: 600, color: "#0b0b0b", marginBottom: 4 }}
            cursor={{ stroke: "#c3c2b7", strokeWidth: 1 }}
            itemSorter={(item) => -(item.value as number)}
          />
          <Legend
            iconType="plainline"
            iconSize={16}
            wrapperStyle={{ fontSize: 12, color: "#52514e", paddingTop: 8, cursor: "pointer" }}
            formatter={(value) => {
              const label = TYPE_LABEL[value as ActivityFeedEventType] ?? value;
              return (
                <span style={{ color: hidden.has(value) ? "#c3c2b7" : "#52514e" }}>
                  {label}
                </span>
              );
            }}
            onClick={(e) => toggleType(e.dataKey as string)}
          />
          {activeTypes.map((t) => (
            <Line
              key={t}
              type="monotone"
              dataKey={t}
              stroke={SERIES_COLOR[t]}
              strokeWidth={2}
              dot={false}
              hide={hidden.has(t)}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fcfcfb" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
