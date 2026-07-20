import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { RefreshCw } from "lucide-react";
import { devApi } from "../../utils/dev-api";
import { timeAgoShort } from "../../utils/time";

interface ReferralEventDetail {
  refereeUserId: string;
  refereeEmail?: string;
  source: string;
  referrerUserId?: string;
  referrerEmail?: string;
  roomId?: string;
  createdAt: number;
}

interface ReferralEventSummary {
  bySource: { source: string; count: number }[];
  referrals: ReferralEventDetail[];
}

const SOURCE_LABELS: Record<string, string> = {
  user: "Friend referral (user)",
  newsletter: "Newsletter",
  social: "Social",
};

export function ReferralEventsTab() {
  const [summary, setSummary] = useState<ReferralEventSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await devApi.getReferralEvents();
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error("Error fetching referral events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 secondary-text-strong">
        Loading referral events...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center py-12 secondary-text-strong">
        Failed to load referral events.
      </div>
    );
  }

  const total = summary.bySource.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Referral Events</h2>
        <Button onClick={load} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <p className="text-xs text-slate-400">
        Every referred_by_* user_event ever recorded, across all rooms. Unrecognized ?src=
        values still show up here under their raw name.
      </p>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          By Source ({total.toLocaleString()} total)
        </h3>
        {summary.bySource.length === 0 ? (
          <p className="text-sm text-slate-400">No referral events yet.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {summary.bySource.map(({ source, count }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={source} className="flex items-baseline gap-1.5 text-sm">
                  <span className="text-slate-700">{SOURCE_LABELS[source] ?? source}</span>
                  <span className="font-mono text-slate-500">
                    {count.toLocaleString()} <span className="text-slate-400">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Referees ({summary.referrals.length.toLocaleString()})
        </h3>
        {summary.referrals.length === 0 ? (
          <p className="text-sm text-slate-400">No referral events yet.</p>
        ) : (
          <div className="max-h-[32rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-1 pr-2 font-medium">Referee Email</th>
                  <th className="py-1 pr-2 font-medium">Source</th>
                  <th className="py-1 pr-2 font-medium">Referrer Email</th>
                  <th className="py-1 pr-2 font-medium">Room</th>
                  <th className="py-1 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {summary.referrals.map((r, i) => (
                  <tr key={`${r.refereeUserId}-${r.createdAt}-${i}`} className="border-b last:border-0">
                    <td className="py-1 pr-2 font-mono text-xs text-slate-600 break-all">
                      {r.refereeEmail ?? r.refereeUserId}
                    </td>
                    <td className="py-1 pr-2 text-slate-700">
                      {SOURCE_LABELS[r.source] ?? r.source}
                    </td>
                    <td className="py-1 pr-2 font-mono text-xs text-slate-600 break-all">
                      {r.source === "user" ? (r.referrerEmail ?? r.referrerUserId ?? "—") : "—"}
                    </td>
                    <td className="py-1 pr-2 font-mono text-xs text-slate-500 break-all">
                      {r.roomId ?? "—"}
                    </td>
                    <td className="py-1 text-right text-xs text-slate-400 whitespace-nowrap">
                      {timeAgoShort(r.createdAt)} ago
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
