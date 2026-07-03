import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SentEmail } from "../../../types";
import { DAY_MS, startOfDay } from "./utils";

const TIMELINE_DAYS = 7;
const TEMPLATE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

interface VolumeTimelineProps {
  sentEmails: SentEmail[];
}

export function VolumeTimeline({ sentEmails }: VolumeTimelineProps) {
  const todayStart = startOfDay(Date.now());
  const dayStarts = Array.from(
    { length: TIMELINE_DAYS },
    (_, i) => todayStart - (TIMELINE_DAYS - 1 - i) * DAY_MS,
  );
  const templates = Array.from(new Set(sentEmails.map((e) => e.template))).sort();

  const data = dayStarts.map((day) => {
    const row: Record<string, number | string> = {
      date: new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    for (const template of templates) {
      row[template] = sentEmails.filter(
        (e) => e.template === template && startOfDay(e.sentAt) === day,
      ).length;
    }
    return row;
  });

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-sm font-semibold header-3 mb-3">Send volume timeline</h3>
      {sentEmails.length === 0 ? (
        <p className="text-sm secondary-text">No sends recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {templates.map((template, i) => (
              <Line
                key={template}
                type="monotone"
                dataKey={template}
                stroke={TEMPLATE_COLORS[i % TEMPLATE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
