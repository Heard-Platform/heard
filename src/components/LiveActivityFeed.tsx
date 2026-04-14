import { useState, useEffect, useRef } from "react";
import { Card } from "./ui/card";
import { Activity, ThumbsUp, FileText, User, Users, LogIn } from "lucide-react";
import { api } from "../utils/api";
import type { ActivityEvent, LiveActivityData } from "../types";

export function LiveActivityFeed() {
  const [liveActivity, setLiveActivity] = useState<LiveActivityData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLiveActivity = async () => {
    const res = await api.getLiveActivity();
    if (res.success && res.data) {
      setLiveActivity(res.data);
    }
  };

  useEffect(() => {
    fetchLiveActivity();
    intervalRef.current = setInterval(fetchLiveActivity, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600" />
          Live Activity (last 10 min)
        </h2>
        {liveActivity && (
          <span className="text-xs text-muted-foreground">
            {liveActivity.events.length} event{liveActivity.events.length !== 1 ? "s" : ""} · refreshes every 30s
          </span>
        )}
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {!liveActivity ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : liveActivity.events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No activity in the last 10 minutes</p>
        ) : (
          liveActivity.events.map((event: ActivityEvent) => (
            <div
              key={`${event.type}-${event.id}-${event.timestamp}`}
              className="flex items-start gap-3 border rounded-lg p-3 text-sm"
            >
              <div className="mt-0.5 shrink-0">
                {event.type === "vote" && <ThumbsUp className="w-4 h-4 text-blue-500" />}
                {event.type === "statement" && <FileText className="w-4 h-4 text-purple-500" />}
                {event.type === "user" && <User className="w-4 h-4 text-green-500" />}
                {event.type === "community" && <Users className="w-4 h-4 text-orange-500" />}
                {event.type === "session" && <LogIn className="w-4 h-4 text-teal-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="capitalize font-medium text-xs text-muted-foreground mr-2">{event.type}</span>
                <span className="break-words">{event.label}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
