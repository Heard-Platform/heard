import { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Loader2, UserPlus } from "lucide-react";
import { api } from "../../utils/api";
import { RecentUserTimeline } from "../../types";
import { UserTimelineChart } from "./UserTimelineChart";
import { describeUser, formatDate } from "./user-history-format";

const RECENT_DAYS = 3;
const FIRST_MINUTES_MS = 10 * 60 * 1000;

interface RecentUserTimelinesProps {
  adminKey: string;
  onSelectUser: (userId: string) => void;
}

export function RecentUserTimelines({ adminKey, onSelectUser }: RecentUserTimelinesProps) {
  const [recentUsers, setRecentUsers] = useState<RecentUserTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentUsers();
  }, []);

  const loadRecentUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.adminGetRecentUserTimelines(adminKey, RECENT_DAYS);
      if (response.success && response.data) {
        setRecentUsers(response.data.users);
      } else {
        setError("Failed to load recent users");
      }
    } catch (err) {
      console.error("Error loading recent user timelines:", err);
      setError("Error loading recent users");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <UserPlus className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg">New Users</h3>
        {!isLoading && (
          <span className="text-sm text-slate-500">({recentUsers.length})</span>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Users first seen in the past {RECENT_DAYS} days, zoomed to their first 10 minutes.
      </p>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading recent users...
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {!isLoading && !error && recentUsers.length === 0 && (
        <p className="text-slate-500 text-sm">No new users</p>
      )}

      {!isLoading && recentUsers.length > 0 && (
        <div className="space-y-6">
          {recentUsers.map(({ user, firstSeenAt, timeline }) => (
            <div key={user.id}>
              <button
                type="button"
                onClick={() => onSelectUser(user.id)}
                className="text-sm text-slate-900 hover:underline"
              >
                {describeUser(user)}
              </button>
              <span className="text-xs text-slate-500 ml-2">
                first seen {formatDate(firstSeenAt)}
              </span>
              <UserTimelineChart
                timeline={timeline}
                initialZoom={{ start: firstSeenAt, end: firstSeenAt + FIRST_MINUTES_MS }}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
