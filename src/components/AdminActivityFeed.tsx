import { useState, useEffect } from "react";
import moment from "moment";
import { Button } from "./ui/button";
import { X, User, DoorOpen, FileText, ThumbsUp, RefreshCw, Users, LogIn, UserPlus } from "lucide-react";
import { api } from "../utils/api";
import type { ActivityFeedEvent, ActivityFeedEventType } from "../types";

interface AdminActivityFeedProps {
  onExit: () => void;
}

const TYPE_CONFIG: Record<
  ActivityFeedEventType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  user: { label: "User", icon: User, color: "text-green-700", bg: "bg-green-100" },
  session: { label: "Session", icon: LogIn, color: "text-teal-700", bg: "bg-teal-100" },
  room: { label: "Room", icon: DoorOpen, color: "text-blue-700", bg: "bg-blue-100" },
  community: { label: "Community", icon: Users, color: "text-orange-700", bg: "bg-orange-100" },
  statement: { label: "Statement", icon: FileText, color: "text-purple-700", bg: "bg-purple-100" },
  vote: { label: "Vote", icon: ThumbsUp, color: "text-amber-700", bg: "bg-amber-100" },
  modInviteAccept: { label: "Mod Invite Accept", icon: UserPlus, color: "text-violet-700", bg: "bg-violet-100" },
};

const ALL_TYPES: ActivityFeedEventType[] = [
  "user",
  "session",
  "room",
  "community",
  "statement",
  "vote",
  "modInviteAccept",
];

function formatTime(ts: number): string {
  return moment(ts).fromNow();
}

export function AdminActivityFeed({ onExit }: AdminActivityFeedProps) {
  const [events, setEvents] = useState<ActivityFeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityFeedEventType | "all">("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await api.getActivityFeed();
    if (res.success && res.data) {
      setEvents(res.data.events);
    } else {
      setError("Failed to load activity feed");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const visible = filter === "all" ? events : events.filter((e) => e.type === filter);

  const counts = ALL_TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t] = events.filter((e) => e.type === t).length;
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", display: "flex", flexDirection: "column" }}>
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>Activity Feed</h1>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0 0 0" }}>New records from the last 7 days</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onExit}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div style={{ padding: "16px 24px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({events.length})
        </Button>
        {ALL_TYPES.map((t) => {
          const cfg = TYPE_CONFIG[t];
          return (
            <Button
              key={t}
              variant={filter === t ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(t)}
            >
              {cfg.label}s ({counts[t] ?? 0})
            </Button>
          );
        })}
      </div>

      <div style={{ flex: 1, padding: "0 24px 24px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "48px", color: "#6b7280" }}>Loading…</div>
        )}
        {error && !loading && (
          <div style={{ textAlign: "center", padding: "48px", color: "#ef4444" }}>{error}</div>
        )}
        {!loading && !error && visible.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: "#6b7280" }}>No records found</div>
        )}
        {!loading && !error && visible.length > 0 && (
          <div style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#374151", width: "90px" }}>Type</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Details</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#374151", width: "80px" }}>When</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((event, i) => {
                  const cfg = TYPE_CONFIG[event.type];
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={`${event.type}-${event.id}-${i}`}
                      style={{ borderBottom: i < visible.length - 1 ? "1px solid #f3f4f6" : "none" }}
                    >
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 500 }}
                          className={`${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", color: "#111827", maxWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span title={event.label}>{event.label}</span>
                        {event.meta && Object.keys(event.meta).length > 0 && (
                          <span style={{ color: "#9ca3af", fontSize: "11px", marginLeft: "8px" }}>
                            {Object.entries(event.meta).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 16px", color: "#6b7280", whiteSpace: "nowrap" }}>
                        {formatTime(event.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
