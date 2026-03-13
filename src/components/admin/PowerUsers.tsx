import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Loader2, TrendingUp } from "lucide-react";
import { adminApi } from "../../utils/admin-api";
import type { UserSession } from "../../types";

interface PowerUsersProps {
  adminKey: string;
  onPowerUserClick: (userId: string) => void;
}

interface PowerUser {
  user: UserSession;
  uniqueDays: number;
}

export function PowerUsers({ adminKey, onPowerUserClick }: PowerUsersProps) {
  const [powerUsers, setPowerUsers] = useState<PowerUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPowerUsers = async () => {
      setLoading(true);
      try {
        const response = await adminApi.getPowerUsers(adminKey);
        if (response.success && response.data) {
          setPowerUsers(response.data.powerUsers || []);
        }
      } catch (error) {
        console.error("Error fetching power users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPowerUsers();
  }, [adminKey]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-semibold">Power Users</h2>
        <Badge variant="outline" className="ml-2">
          {powerUsers.length} users
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Users ranked by number of unique days they were active
      </p>

      <div className="space-y-2">
        <div className="grid grid-cols-[60px_1fr_auto_auto] gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
          <div>Rank</div>
          <div>User</div>
          <div>Active Days</div>
          <div>Type</div>
        </div>

        {powerUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity records found
          </div>
        ) : (
          powerUsers.map((powerUser, index) => (
            <div
              key={powerUser.user.id}
              className="grid grid-cols-[60px_1fr_auto_auto] gap-4 items-center border-b py-3 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onPowerUserClick(powerUser.user.id)}
            >
              <div className="font-bold text-lg">
                {index === 0 && "🥇"}
                {index === 1 && "🥈"}
                {index === 2 && "🥉"}
                {index > 2 && `#${index + 1}`}
              </div>
              <div className="space-y-1">
                <div className="font-medium">
                  {powerUser.user.name || "Anonymous"}
                </div>
                <div className="text-xs text-muted-foreground">
                  ID: {powerUser.user.id.slice(0, 8)}...
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="font-mono">
                  {powerUser.uniqueDays} {powerUser.uniqueDays === 1 ? "day" : "days"}
                </Badge>
              </div>
              <div className="text-right">
                {powerUser.user.isDeveloper && (
                  <Badge variant="outline" className="text-xs">
                    Dev
                  </Badge>
                )}
                {powerUser.user.isAnonymous && (
                  <Badge variant="outline" className="text-xs">
                    Anon
                  </Badge>
                )}
                {!powerUser.user.isAnonymous && !powerUser.user.isDeveloper && (
                  <Badge variant="outline" className="text-xs">
                    User
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}