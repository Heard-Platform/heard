import { Timer } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SessionMinutesWeek } from "../../types";
import { formatWeekStart } from "../../utils/time";
import { Card } from "../ui/card";

interface SessionLengthCardProps {
  weekly: SessionMinutesWeek[];
  loading: boolean;
}

export function SessionLengthCard({ weekly, loading }: SessionLengthCardProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl flex items-center gap-2">
        <Timer className="w-5 h-5 text-purple-600" />
        Median Session Length
      </h2>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        Minutes from a user's first to last vote, splitting sessions on 15+ minute gaps. Sessions with a single vote
        are left out. Last 12 weeks.
      </p>
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading sessions...</p>
      ) : (
        <SessionLengthChart weekly={weekly} />
      )}
    </Card>
  );
}

function SessionLengthChart({ weekly }: { weekly: SessionMinutesWeek[] }) {
  if (weekly.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No sessions yet</p>;
  }

  const data = weekly.map((w) => ({ week: formatWeekStart(w.weekStart), medianMinutes: w.medianMinutes, sessions: w.sessions }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          formatter={(value: number, _name: string, item: { payload?: { sessions: number } }) => [
            `${value} min (${item.payload?.sessions ?? 0} sessions)`,
            "Median session",
          ]}
        />
        <Line type="monotone" dataKey="medianMinutes" stroke="#9333ea" strokeWidth={2} dot={{ r: 3, fill: "#9333ea" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
