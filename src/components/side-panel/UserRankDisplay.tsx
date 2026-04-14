import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import type { UserSession } from "../../types";
import { api, safelyMakeApiCall } from "../../utils/api";

interface UserRankDisplayProps {
  user: UserSession;
}

export function UserRankDisplay({ user }: UserRankDisplayProps) {
  const [rank, setRank] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRank = async () => {
      setLoading(true);
      const response = await safelyMakeApiCall(() => api.getUserRank());
      if (response?.data) {
        setRank(response.data.rank);
        setTotalUsers(response.data.totalUsers);
      }
      setLoading(false);
    };

    fetchRank();
  }, [user.score]);

  if (loading) {
    return null;
  }

  if (rank === null) {
    return null;
  }

  return (
    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <div>
          <p className="text-purple-900 font-bold text-sm">
            Rank #{rank} of {totalUsers}
          </p>
          {user.isDeveloper && (
            <p className="text-blue-700 text-xs mt-0.5">
              As a developer, you won't be included in the rankings shown to other users
            </p>
          )}
        </div>
      </div>
    </div>
  );
}