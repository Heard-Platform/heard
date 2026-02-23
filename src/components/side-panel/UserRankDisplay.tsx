import { useState, useEffect } from "react";
import { Trophy, AlertCircle } from "lucide-react";
import type { UserSession } from "../../types";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

interface UserRankDisplayProps {
  user: UserSession;
}

export function UserRankDisplay({ user }: UserRankDisplayProps) {
  const [rank, setRank] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRank = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f1a393b4/user-rank`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ userId: user.id }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setRank(data.rank);
          setTotalUsers(data.totalUsers);
        }
      } catch (error) {
        console.error("Failed to fetch user rank:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRank();
  }, [user.id, user.score]);

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
